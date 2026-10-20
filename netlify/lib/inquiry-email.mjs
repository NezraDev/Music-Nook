import { siteData as d } from "../../src/data.js";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

export function inquiryEmail(v) {
  const type = d.forms.inquiry.types.find((item) => item.id === v.type)?.label || "Inquiry";
  const lesson = d.services.find((item) => item.id === v.service)?.name || "Not specified";
  const age = d.forms.inquiry.ageOptions.find((item) => item.id === v.age)?.label || "Not specified";
  const rows = [
    ["Name", v.name.trim()],
    ["Email", v.email.trim()],
    ["Phone", v.phone.trim() || "Not provided"],
    ["Inquiry type", type],
    ["Lesson interest", lesson],
    ["Age range", age],
  ];
  if (v.facebook?.trim()) rows.splice(3, 0, ["Facebook profile", v.facebook.trim()]);
  if (d.forms.inquiry.privacy.required || v.privacy === true)
    rows.push(["Privacy acknowledgment", v.privacy === true ? "Yes" : "No"]);
  const subject = `${d.brand.name}: ${type}${v.service ? ` | ${lesson}` : ""}`;
  const text = [d.brand.name, "NEW WEBSITE INQUIRY", "", ...rows.map(([label, value]) => `${label}: ${value}`),
    "", "MESSAGE", v.message.trim(), "", "Reply to this email to contact the visitor.",
    "This inquiry does not confirm a lesson booking."].join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New website inquiry</title></head>
<body style="margin:0;padding:24px 12px;background:#f5efdf;color:#0d1929;font-family:Arial,sans-serif;line-height:1.6">
<table role="presentation" style="width:100%;max-width:600px;margin:auto;border-collapse:collapse;background:#ffffff">
<tr><td style="padding:32px;background:#0d1929;color:#f5efdf;border-top:5px solid #49b3b0">
<p style="margin:0 0 10px;font-size:12px;letter-spacing:2px;color:#88d0ca">${escapeHtml(d.brand.name.toUpperCase())}</p>
<h1 style="margin:0;font-family:Georgia,serif;font-size:28px;line-height:1.3">New website inquiry</h1>
<p style="margin:10px 0 0;color:#d3e1dc">${escapeHtml(type)}${v.service ? ` · ${escapeHtml(lesson)}` : ""}</p></td></tr>
<tr><td style="padding:28px 32px">
<h2 style="margin:0 0 16px;font-size:18px">Visitor details</h2>
<table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map(([label, value]) => `<tr><th scope="row" style="width:38%;text-align:left;vertical-align:top;padding:10px 12px 10px 0;border-bottom:1px solid #e3e8e5;color:#335d5b">${escapeHtml(label)}</th><td style="padding:10px 0;border-bottom:1px solid #e3e8e5;overflow-wrap:anywhere">${escapeHtml(value)}</td></tr>`).join("")}</table>
<h2 style="margin:28px 0 12px;font-size:18px">Message</h2>
<div style="padding:20px;background:#e3f0eb;border-radius:8px;overflow-wrap:anywhere">${escapeHtml(v.message.trim()).replace(/\r?\n/g, "<br>")}</div>
<p style="margin:24px 0 0;font-size:14px">Use <strong>Reply</strong> to respond directly to the visitor.</p></td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e3e8e5;font-size:12px;color:#52665f">Sent from The Music Nook website. This inquiry does not confirm a lesson booking.</td></tr>
</table></body></html>`;
  return { subject, text, html };
}
