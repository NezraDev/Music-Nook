import { Resend } from "resend";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { validateInquiry } from "../../src/shared.js";
import { siteData } from "../../src/data.js";
import { inquiryEmail } from "../lib/inquiry-email.mjs";
const json = (status, code) =>
  new Response(JSON.stringify({ code }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
export default async function handler(request) {
  if (request.method !== "POST") return json(405, "invalid");
  const env = await inquiryEnvironment(request);
  const recipient = env.CONTACT_TO_EMAIL?.trim() || "the.musicnook12@gmail.com";
  if (
    !env.RESEND_API_KEY ||
    !env.CONTACT_FROM_EMAIL ||
    !env.CONTACT_ALLOWED_ORIGIN
  )
    return json(503, "unavailable");
  if (request.headers.get("origin") !== env.CONTACT_ALLOWED_ORIGIN)
    return json(403, "invalid");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json(415, "invalid");
  if (Number(request.headers.get("content-length")) > 16000)
    return json(413, "invalid");
  let v;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json(400, "invalid");
    let size = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16000) {
        await reader.cancel();
        return json(413, "invalid");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let pos = 0;
    for (const c of chunks) {
      bytes.set(c, pos);
      pos += c.length;
    }
    v = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return json(400, "invalid");
  }
  if (!v || typeof v !== "object" || Array.isArray(v))
    return json(400, "invalid");
  if (typeof v.website !== "string" || v.website) return json(400, "invalid");
  if (
    ["name", "email", "phone", "type", "service", "age", "message"].some(
      (k) => typeof v[k] !== "string",
    ) ||
    Object.keys(validateInquiry(v)).length ||
    /[\r\n]/.test(v.email)
  )
    return json(400, "invalid");
  if (
    siteData.forms.inquiry.privacy.required &&
    !siteData.forms.inquiry.privacy.approved
  )
    return json(503, "unavailable");
  try {
    const email = inquiryEmail(v);
    const resend = new Resend(env.RESEND_API_KEY);
    const { error } = await resend.emails.send(
      {
        from: env.CONTACT_FROM_EMAIL,
        to: recipient,
        replyTo: v.email.trim(),
        ...email,
      },
      { idempotencyKey: `inquiry/${randomUUID()}` },
    );
    if (error) return json(502, "error");
    return json(200, "success");
  } catch {
    return json(502, "error");
  }
}
async function inquiryEnvironment(request) {
  const env = { ...process.env };
  const hostname = new URL(request.url).hostname;
  if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname)) return env;
  // Netlify Dev can keep an older environment after .env is edited.
  // Read local settings per request; deployed functions use their environment only.
  try {
    const local = parseEnv(await readFile(resolve(process.cwd(), ".env"), "utf8"));
    for (const key of ["RESEND_API_KEY", "CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL", "CONTACT_ALLOWED_ORIGIN"])
      if (local[key]?.trim()) env[key] = local[key].trim();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return env;
}
