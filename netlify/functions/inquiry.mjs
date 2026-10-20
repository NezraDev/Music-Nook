import { Resend } from "resend";
import { validateInquiry } from "../../src/shared.js";
import { siteData } from "../../src/data.js";
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
  const env = process.env;
  if (
    !env.RESEND_API_KEY ||
    !env.CONTACT_FROM_EMAIL ||
    !env.CONTACT_TO_EMAIL ||
    !env.TURNSTILE_SECRET_KEY ||
    !env.TURNSTILE_HOSTNAME ||
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
    /[\r\n]/.test(v.email) ||
    typeof v.token !== "string" ||
    v.token.length > 2048 ||
    !v.token
  )
    return json(400, "invalid");
  if (
    siteData.forms.inquiry.privacy.required &&
    !siteData.forms.inquiry.privacy.approved
  )
    return json(503, "unavailable");
  try {
    const challenge = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: v.token,
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!challenge.ok) return json(503, "error");
    const verified = await challenge.json();
    if (
      !verified.success ||
      verified.hostname !== env.TURNSTILE_HOSTNAME ||
      verified.action !== "inquiry"
    )
      return json(400, "challenge");
    const lines = [
      `${siteData.brand.name}: ${v.type}`,
      `Name: ${v.name.trim()}`,
      `Email: ${v.email.trim()}`,
      `Phone: ${v.phone.trim()}`,
      `Lesson: ${v.service}`,
      `Age range: ${v.age}`,
      `Privacy acknowledgment: ${v.privacy === true ? "yes" : "no"}`,
      "",
      v.message.trim(),
    ];
    const resend = new Resend(env.RESEND_API_KEY);
    const { error } = await resend.emails.send(
      {
        from: env.CONTACT_FROM_EMAIL,
        to: env.CONTACT_TO_EMAIL,
        replyTo: v.email.trim(),
        subject: `${siteData.brand.name} website inquiry`,
        text: lines.join("\n"),
      },
      { idempotencyKey: `inquiry/${await tokenHash(v.token)}` },
    );
    if (error) return json(502, "error");
    return json(200, "success");
  } catch {
    return json(502, "error");
  }
}
async function tokenHash(token) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}
