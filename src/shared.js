import { siteData as d } from "./data.js";
export const inquiryUrl = (service = "") =>
  `/contact?intent=lesson-inquiry${d.services.some((s) => s.id === service) ? `&service=${encodeURIComponent(service)}` : ""}`;
export const validCoordinates = (p) =>
  Array.isArray(p) &&
  p.length === 2 &&
  p.every(Number.isFinite) &&
  Math.abs(p[0]) <= 180 &&
  Math.abs(p[1]) <= 90;
export const approvedMedia = (items) =>
  items.filter(
    (x) =>
      x.publicationPermission === true &&
      x.src &&
      x.alt &&
      !/\[[^\]]+\]/.test(x.alt),
  );
export const limits = { name: 100, email: 254, phone: 40, facebook: 1000, message: 4000 };
export function validateInquiry(v) {
  const m = d.forms.inquiry.messages,
    e = {};
  for (const k of ["name", "email", "type", "message"])
    if (typeof v[k] !== "string" || !v[k].trim()) e[k] = m.required;
  for (const [k, max] of Object.entries(limits))
    if (typeof v[k] === "string" && v[k].length > max) e[k] = m.tooLong;
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = m.email;
  if (v.facebook !== undefined && typeof v.facebook !== "string") e.facebook = m.facebook;
  if (typeof v.facebook === "string" && v.facebook.trim()) {
    try {
      const url = new URL(v.facebook.trim());
      if (url.protocol !== "https:" || url.username || url.password ||
        !["facebook.com", "fb.com", "fb.me"].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)))
        e.facebook = m.facebook;
    } catch {
      e.facebook = m.facebook;
    }
  }
  if (!d.forms.inquiry.types.some((t) => t.id === v.type)) e.type = m.invalid;
  if (v.service && !d.services.some((s) => s.id === v.service))
    e.service = m.invalid;
  if (v.type === "lesson-inquiry" && !v.service) e.service = m.required;
  if (!d.forms.inquiry.ageOptions.some((a) => a.id === (v.age || "")))
    e.age = m.invalid;
  if (d.forms.inquiry.privacy.required && v.privacy !== true)
    e.privacy = m.required;
  return e;
}
