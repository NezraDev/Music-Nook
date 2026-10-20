import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { siteData as d } from "./data";
import { inquiryUrl, approvedMedia, validateInquiry, limits } from "./shared";
const Gallery = lazy(() => import("./Gallery"));
export function Image({ image, decorative = false, ...props }) {
  const [bad, setBad] = useState(false);
  if (!image?.src || bad)
    return <div className="image-fallback">{d.ui.imageFallback}</div>;
  return (
    <img
      src={image.src}
      alt={decorative ? "" : image.alt}
      width={image.width}
      height={image.height}
      onError={() => setBad(true)}
      {...props}
    />
  );
}
export function Action({ service, label = d.buttons.inquire, className = "" }) {
  return (
    <Link className={`button ${className}`} to={inquiryUrl(service)}>
      {label}
      <span aria-hidden="true">{d.ui.arrow}</span>
    </Link>
  );
}
function Keyboard() {
  return (
    <div className="piano-scene">
      <div className="keyboard">
        {Array.from({ length: 7 }, (_, i) => (
          <div className="piano-key-pair" key={i}>
            <span className="piano-key" style={{ "--key-index": i }} />
            {[0, 1, 3, 4, 5].includes(i % 7) && (
              <span className="piano-key piano-key-black" style={{ "--key-index": i + 3 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
function VoiceArt() {
  return (
    <div className="instrument-play voice-scene">
      <span className="voice-visual">
        <svg className="microphone-mark" viewBox="0 0 100 150" aria-hidden="true">
          <rect x="30" y="10" width="40" height="82" rx="20" />
          <path d="M20 68v12a30 30 0 0 0 60 0V68M50 110v28m-20 0h40" />
          <path className="mic-grille" d="M35 30h30M35 41h30M35 52h30M35 63h30" />
        </svg>
        <span className="floating-notes" aria-hidden="true">
          {["♪", "♫", "♪"].map((note, i) => <span key={i} style={{ "--note-index": i }}>{note}</span>)}
        </span>
      </span>
    </div>
  );
}
function GuitarArt() {
  return (
    <div className="instrument-play guitar-scene">
      <svg className="guitar-illustration" viewBox="0 0 120 210" aria-hidden="true">
        <path className="guitar-body" d="M60 88C36 76 23 92 31 111c9 20-19 20-19 49 0 28 21 42 48 42s48-14 48-42c0-29-28-29-19-49 8-19-5-35-29-23Z" />
        <path className="guitar-neck" d="M51 24h18v105H51zM48 8h24v26H48z" />
        <path className="guitar-frets" d="M52 45h16M52 57h16M52 69h16M52 81h16M52 93h16M52 105h16" />
        <circle className="guitar-rosette" cx="60" cy="145" r="20" />
        <circle className="guitar-soundhole" cx="60" cy="145" r="15" />
        <path className="guitar-bridge" d="M43 178h34v8H43z" />
        <g className="animated-strings">
          {[55, 57, 59, 61, 63, 65].map((x, i) => <path key={x} style={{ "--string-index": i }} d={`M${x} 16V182`} />)}
        </g>
        <path className="guitar-tuners" d="M44 15h7m-7 9h7m18-9h7m-7 9h7" />
      </svg>
    </div>
  );
}
function InstrumentPanel({ children }) {
  const panel = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(panel.current);
    return () => observer.disconnect();
  }, []);
  return <div className="lesson-art" ref={panel} data-live={visible} aria-hidden="true">{children}</div>;
}
function LessonRows({ full = false }) {
  return (
    <div className={`lesson-rows${full ? " lesson-rows-services" : " lesson-rows-home"}`}>
      {d.services.map((s) => (
        <article className={`lesson lesson-${s.id}`} key={s.id}>
          <InstrumentPanel>
            {s.id === "piano" ? (
              <Keyboard />
            ) : s.id === "voice" ? (
              <VoiceArt />
            ) : (
              <GuitarArt />
            )}
          </InstrumentPanel>
          <div>
            <div className={full ? "lesson-heading" : undefined}>
              <h2>{s.name}</h2>
              {full && (
                <aside className="lesson-price" aria-label={`${s.name} base price`}>
                  <span>{d.pages.services.basePriceLabel}</span>
                  <strong>{d.pages.services.basePrice}</strong>
                  <small>{d.pages.services.basePriceNote}</small>
                </aside>
              )}
            </div>
            <p className="large-copy">{s.short}</p>
            {full && (
              <>
                <p>{s.description}</p>
                <dl className="service-details">
                  {Object.entries(d.pages.services.detailLabels).map(
                    ([k, l]) => (
                      <div key={k}>
                        <dt>{l}</dt>
                        <dd>{s[k]}</dd>
                      </div>
                    ),
                  )}
                </dl>
              </>
            )}
            <Action
              service={s.id}
              label={d.buttons.ask}
              className="button-outline"
            />
          </div>
        </article>
      ))}
    </div>
  );
}
function Stories() {
  const items = d.testimonials.filter((x) => x.publicationPermission === true);
  return (
    items.length > 0 && (
      <section className="section">
        <h2>{d.pages.studentGallery.storiesTitle}</h2>
        {items.map((x) => (
          <blockquote key={x.id}>
            <p>{x.quote}</p>
            <cite>{x.name}</cite>
          </blockquote>
        ))}
      </section>
    )
  );
}
function Closing() {
  const p = d.pages.home;
  return (
    <section className="closing">
      <div>
        <h2>{p.closingTitle}</h2>
        <p>{p.closingCopy}</p>
      </div>
      <Action />
    </section>
  );
}
function InstructorPreview() {
  const p = d.pages.home;
  return (
    <section className="section instructor-preview">
      <div className="portrait-placeholder">
        <div className="portrait-shape" aria-hidden="true" />
        <span>
          {d.instructors[0]?.portraitPlaceholder || d.ui.portraitLabel}
        </span>
      </div>
      <div>
        <h2>{p.instructorTitle}</h2>
        <p>{p.instructorCopy}</p>
        <Link className="text-link" to="/about">
          {d.buttons.about} <span aria-hidden="true">{d.ui.arrow}</span>
        </Link>
      </div>
    </section>
  );
}
function Home() {
  const p = d.pages.home;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-eyebrow">Private music lessons, at home</span>
          <h1>
            {p.headline.split("\n").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p>{p.intro}</p>
          <div className="actions">
            <Action className="hero-cta hero-cta-primary" />
            <Link className="button hero-cta hero-cta-secondary" to="/services">
              {d.buttons.explore}
              <span aria-hidden="true">{d.ui.arrow}</span>
            </Link>
          </div>
        </div>
        <figure className="hero-art">
          <Image image={p.heroImage} fetchPriority="high" />
        </figure>
      </section>
      <section className="section">
        <div className="section-intro">
          <h2>{p.lessonsTitle}</h2>
          <p>{p.lessonsIntro}</p>
        </div>
        <LessonRows />
      </section>
      <section className="experience">
        <div>
          <h2>{p.experienceTitle}</h2>
          <p>{p.experienceIntro}</p>
        </div>
        <div className="benefits">
          {p.benefits.map((b) => (
            <article key={b.id}>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section music-benefits" aria-labelledby="music-benefits-title">
        <div className="section-intro">
          <h2 id="music-benefits-title">{p.musicBenefitsTitle}</h2>
          <p>{p.musicBenefitsIntro}</p>
        </div>
        <div className="music-benefit-grid">
          {p.musicBenefits.map((benefit) => (
            <article key={benefit.id}>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>
      <InstructorPreview />
      {approvedMedia(d.gallery).length > 0 && (
        <section className="section home-gallery">
          <h2>{p.galleryTitle}</h2>
          <Suspense fallback={<p>{d.ui.loading}</p>}>
            <Gallery preview />
          </Suspense>
          <Link className="text-link" to="/student-gallery">
            {d.buttons.gallery}
          </Link>
        </section>
      )}
      <Stories />
      <Closing />
    </>
  );
}
function ServiceAreas() {
  return (
    <div className="service-area-list">
      <p>{d.contact.serviceArea}</p>
      <ul>
        {d.contact.serviceAreas.map((area) => <li key={area}>{area}</li>)}
      </ul>
      <p className="service-area-note">{d.contact.serviceAreaNote}</p>
    </div>
  );
}
function About() {
  const p = d.pages.about;
  return (
    <>
      <PageHead title={p.title} intro={p.intro} />
      <section className="section about-story">
        <h2>{p.storyTitle}</h2>
        <div>
          {p.story.map((t) => (
            <p key={t}>{t}</p>
          ))}
          <ServiceAreas />
        </div>
      </section>
      <section className="section mint">
        <h2>{p.instructorsTitle}</h2>
        {d.instructors.map((i) => (
          <article key={i.id} className="instructor-preview">
            {i.portrait ? (
              <Image image={i.portrait} loading="lazy" />
            ) : (
              <div className="portrait-placeholder">
                <div className="portrait-shape" aria-hidden="true" />
                <span>{i.portraitPlaceholder}</span>
              </div>
            )}
            <div>
              <h3>{i.name}</h3>
              <p>{i.bio}</p>
              <p>{i.qualifications}</p>
              <p>{i.experience}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="section">
        <h2>{p.environmentTitle}</h2>
        <p>{p.environment}</p>
      </section>
      <Closing />
    </>
  );
}
function Services() {
  const p = d.pages.services;
  return (
    <>
      <PageHead title={p.title} intro={p.intro} />
      <section className="section">
        <LessonRows full />
      </section>
      <section className="section service-scope" aria-labelledby="service-scope-title">
        <div className="section-intro">
          <h2 id="service-scope-title">{p.scopeTitle}</h2>
          <p>{p.scopeIntro}</p>
        </div>
        <div className="music-benefit-grid">
          {p.scopeItems.map((item) => (
            <article key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              {item.showServiceAreas && <ServiceAreas />}
            </article>
          ))}
        </div>
      </section>
      <section className="section mint">
        <h2>{p.processTitle}</h2>
        <ol className="process">
          {p.process.map((x) => (
            <li key={x.id}>
              <h3>{x.title}</h3>
              <p>{x.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="section services-faq">
        <div className="services-faq-intro">
          <h2>{d.pages.faq.title}</h2>
          <p>{d.pages.faq.intro}</p>
          <Link className="text-link" to="/faq">
            {d.buttons.faq} <span aria-hidden="true">{d.ui.arrow}</span>
          </Link>
        </div>
        <div className="services-faq-list">
          {d.faqs.slice(0, 3).map((f) => (
            <details className="services-faq-item" key={f.id}>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
              {f.showServiceAreas && <ServiceAreas />}
            </details>
          ))}
        </div>
      </section>
      <Closing />
    </>
  );
}
function PageHead({ title, intro }) {
  return (
    <section className="page-head">
      <h1>{title}</h1>
      <p>{intro}</p>
    </section>
  );
}
function StudentGallery() {
  const p = d.pages.studentGallery;
  const logos = d.clientLogos.filter((x) => x.publicationPermission === true);
  return (
    <>
      <PageHead title={p.title} intro={p.intro} />
      <section className="section">
        <Suspense fallback={<p>{d.ui.loading}</p>}>
          <Gallery />
        </Suspense>
      </section>
      <Stories />
      {logos.length > 0 && (
        <section className="section">
          <h2>{p.logosTitle}</h2>
          {logos.map((x) => (
            <Image key={x.id} image={x} loading="lazy" />
          ))}
        </section>
      )}
      <Closing />
    </>
  );
}
function FAQPage() {
  const p = d.pages.faq;
  return (
    <>
      <section className="page-head faq-page-head">
        <h1>{p.title}</h1>
        <p>{p.intro}</p>
      </section>
      <section className="faq-layout" aria-label={p.title}>
        <div className="faq-page-list">
          {d.faqs.map((f) => (
            <details className="faq-page-item" key={f.id} open>
              <summary>{f.question}</summary>
              <div className="faq-page-answer">
                <p>{f.answer}</p>
                {f.showServiceAreas && <ServiceAreas />}
              </div>
            </details>
          ))}
        </div>
        <aside className="faq-preparation" aria-labelledby="faq-preparation-title">
          <h2 id="faq-preparation-title">{p.preparationTitle}</h2>
          <dl>
            <div>
              <dt>{p.instrumentLabel}</dt>
              <dd>{p.instrumentText}</dd>
            </div>
            <div>
              <dt>{p.sheetMusicLabel}</dt>
              <dd>{p.sheetMusicText}</dd>
            </div>
          </dl>
          <Action label={d.buttons.ask} className="button-outline" />
        </aside>
      </section>
    </>
  );
}
function InquiryForm() {
  const f = d.forms.inquiry;
  const loc = useLocation();
  const initial = () => {
    const q = new URLSearchParams(loc.search);
    return {
      name: "",
      email: "",
      phone: "",
      facebook: "",
      type: f.types.some((x) => x.id === q.get("intent"))
        ? q.get("intent")
        : "general",
      service: d.services.some((x) => x.id === q.get("service"))
        ? q.get("service")
        : "",
      age: "",
      message: "",
      privacy: false,
      website: "",
    };
  };
  const [values, setValues] = useState(() => ({
      ...initial(),
      type: "general",
      service: "",
    })),
    [errors, setErrors] = useState({}),
    [status, setStatus] = useState(""),
    [outcome, setOutcome] = useState(null),
    [pending, setPending] = useState(false);
  const statusDialog = useRef(null);
  const dialogButton = useRef(null);
  const submitButton = useRef(null);
  const pendingRef = useRef(false);
  useEffect(() => {
    if (!status || !outcome) return;
    const dialog = statusDialog.current;
    if (!dialog.open) dialog.showModal();
    dialogButton.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      submitButton.current?.focus();
    };
  }, [status, outcome]);
  useEffect(() => {
    const q = new URLSearchParams(loc.search);
    setValues((v) => ({
      ...v,
      type: f.types.some((x) => x.id === q.get("intent"))
        ? q.get("intent")
        : v.type,
      service: d.services.some((x) => x.id === q.get("service"))
        ? q.get("service")
        : v.service,
    }));
  }, [loc.search]);
  const change = (e) =>
    setValues((v) => ({
      ...v,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  const field = (name, required = false, type = "text") => (
    <div className="field" key={name}>
      <label htmlFor={name}>
        {f.labels[name]}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={values[name]}
        onChange={change}
        maxLength={limits[name]}
        required={required}
        autoComplete={
          name === "name"
            ? "name"
            : name === "email"
              ? "email"
              : name === "phone"
                ? "tel"
                : "off"
        }
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
      />
      {errors[name] && (
        <p className="field-error" id={`${name}-error`}>
          {errors[name]}
        </p>
      )}
    </div>
  );
  async function submit(e) {
    e.preventDefault();
    if (pendingRef.current) return;
    setStatus("");
    const errs = validateInquiry(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      requestAnimationFrame(() =>
        document.getElementById(Object.keys(errs)[0])?.focus(),
      );
      return;
    }
    pendingRef.current = true;
    setPending(true);
    try {
      const res = await fetch("/.netlify/functions/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: AbortSignal.timeout(30000),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.code || "error");
      setStatus(f.messages.success);
      setOutcome("success");
      setValues(initial());
    } catch (err) {
      setStatus(f.messages[err.message] || f.messages.error);
      setOutcome("error");
    } finally {
      setPending(false);
      pendingRef.current = false;
    }
  }
  return (
    <form onSubmit={submit} noValidate aria-busy={pending}>
      <p className="form-note">{f.labels.required}</p>
      <div className="form-grid">
        {field("name", true)}
        {field("email", true, "email")}
        {field("phone", false, "tel")}
        {field("facebook", false, "url")}
        {["type", "service", "age"].map((name) => (
          <div className="field" key={name}>
            <label htmlFor={name}>
              {f.labels[name]}
              {(name === "type" ||
                (name === "service" && values.type === "lesson-inquiry")) &&
                " *"}
            </label>
            <select
              id={name}
              name={name}
              value={values[name]}
              onChange={change}
              aria-invalid={!!errors[name]}
              aria-describedby={errors[name] ? `${name}-error` : undefined}
              required={
                name === "type" ||
                (name === "service" && values.type === "lesson-inquiry")
              }
            >
              {name === "service" && (
                <option value="">{f.servicePlaceholder}</option>
              )}
              {(name === "type"
                ? f.types
                : name === "service"
                  ? d.services.map((s) => ({ id: s.id, label: s.name }))
                  : f.ageOptions
              ).map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </select>
            {errors[name] && (
              <p id={`${name}-error`} className="field-error">
                {errors[name]}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="field">
        <label htmlFor="message">{f.labels.message} *</label>
        <textarea
          id="message"
          name="message"
          rows="5"
          value={values.message}
          maxLength={limits.message}
          onChange={change}
          required
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message && (
          <p id="message-error" className="field-error">
            {errors.message}
          </p>
        )}
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">{f.labels.honeypot}</label>
        <input
          tabIndex="-1"
          id="website"
          name="website"
          value={values.website}
          onChange={change}
          autoComplete="off"
        />
      </div>
      {f.privacy.required && (
        <div className="field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              id="privacy"
              name="privacy"
              checked={values.privacy}
              required={f.privacy.required}
              aria-invalid={!!errors.privacy}
              onChange={change}
              aria-describedby={errors.privacy ? "privacy-error" : undefined}
            />
            {f.labels.privacy}
          </label>
          <a href={f.privacy.noticeUrl}>{f.labels.privacyLink}</a>
          {errors.privacy && (
            <p className="field-error" id="privacy-error">
              {errors.privacy}
            </p>
          )}
        </div>
      )}
      <p className="form-note">{d.pages.contact.notice}</p>
      <button ref={submitButton} className="button" disabled={pending} type="submit">
        {pending ? f.messages.submitting : d.buttons.send}
        <span aria-hidden="true">{d.ui.arrow}</span>
      </button>
      <dialog
        ref={statusDialog}
        className={`inquiry-modal${outcome === "error" ? " inquiry-modal-error" : ""}`}
        aria-labelledby="inquiry-modal-title"
        aria-describedby="inquiry-modal-description"
        onClose={() => { setStatus(""); setOutcome(null); }}
        onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}
      >
        <div className="inquiry-modal-content">
          <span className="inquiry-modal-icon" aria-hidden="true">
            {outcome === "success" ? "✓" : "!"}
          </span>
          <h2 id="inquiry-modal-title">{outcome === "success" ? f.messages.successTitle : f.messages.errorTitle}</h2>
          <p id="inquiry-modal-description">{status}</p>
          <button ref={dialogButton} className="button" type="button" onClick={() => statusDialog.current.close()}>
            {outcome === "success" ? f.messages.done : f.messages.backToForm}
          </button>
        </div>
      </dialog>
    </form>
  );
}
function Contact() {
  const p = d.pages.contact;
  return (
    <>
      <PageHead title={p.title} intro={p.intro} />
      <section className="section contact-layout">
        <div>
          <h2>{p.formTitle}</h2>
          <InquiryForm />
        </div>
        <aside>
          <h2>{p.detailsTitle}</h2>
          <ContactDetails />
          <SocialLinks />
        </aside>
      </section>
      <section className="section privacy" id="privacy-notice">
        <h2>{p.privacyTitle}</h2>
        <p>
          {d.forms.inquiry.privacy.approved
            ? d.forms.inquiry.privacy.noticeText
            : p.privacyDraft}
        </p>
      </section>
    </>
  );
}
function SocialLinks() {
  return (
    <div className="social-links">
      {d.socialLinks
        .filter((x) => /^https:\/\//.test(x.url))
        .map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
          >
            {s.label}
            <span aria-hidden="true"> ↗</span>
          </a>
        ))}
    </div>
  );
}
function ContactDetails() {
  return (
    <dl className="contact-details">
      {["email", "phone", "serviceArea", "hours"].map((k) => (
        <div key={k}>
          <dt>{d.contact.labels[k]}</dt>
          <dd>
            {k === "serviceArea" ? <ServiceAreas /> : k === "email" &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact.email) ? (
              <a href={`mailto:${d.contact.email}`}>{d.contact.email}</a>
            ) : k === "phone" && /^\+?[\d ()-]{7,}$/.test(d.contact.phone) ? (
              <a href={`tel:${d.contact.phone.replace(/[^\d+]/g, "")}`}>
                {d.contact.phone}
              </a>
            ) : (
              d.contact[k] || d.contact.placeholders[k]
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
export default function App() {
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  const pathname = loc.pathname.replace(/\/+$/, "") || "/";
  const menuButton = useRef(null);
  const main = useRef(null);
  const firstRoute = useRef(true);
  useEffect(() => {
    if (!menu) return;
    const escape = (e) => {
      if (e.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [menu]);
  useEffect(() => {
    setMenu(false);
    const nav = d.navigation.find((n) => n.path === pathname);
    const seo = d.seo.pages[nav?.id || "notFound"];
    document.title = seo.title;
    for (const [selector, value] of [
      ["meta[name=description]", seo.description],
      ['meta[property="og:title"]', seo.title],
      ['meta[property="og:description"]', seo.description],
    ]) {
      const meta = document.querySelector(selector);
      if (meta) meta.content = value;
    }
    const canonical = document.querySelector("link[rel=canonical]");
    if (canonical) {
      canonical.href = new URL(nav?.path || "/", canonical.href).href;
      const og = document.querySelector('meta[property="og:url"]');
      if (og) og.content = canonical.href;
    }
    window.scrollTo(0, 0);
    if (firstRoute.current) firstRoute.current = false;
    else main.current?.focus({ preventScroll: true });
  }, [loc.pathname]);
  const page =
    pathname === "/" ? (
      <Home />
    ) : pathname === "/about" ? (
      <About />
    ) : pathname === "/services" ? (
      <Services />
    ) : pathname === "/faq" ? (
      <FAQPage />
    ) : pathname === "/student-gallery" ? (
      <StudentGallery />
    ) : pathname === "/contact" ? (
      <Contact />
    ) : (
      <section className="page-head">
        <h1>{d.pages.notFound.title}</h1>
        <p>{d.pages.notFound.text}</p>
        <Link className="button" to="/">
          {d.buttons.back}
        </Link>
      </section>
    );
  return (
    <>
      <a className="skip-link" href="#main">
        {d.ui.skip}
      </a>
      <header>
        <Link to="/" className="nav-brand">
          <img src={d.brand.logo.src} alt="" aria-hidden="true" />
          <span>{d.brand.name}</span>
        </Link>
        <button
          ref={menuButton}
          className="menu-button"
          aria-expanded={menu}
          aria-controls="main-nav"
          onClick={() => setMenu(!menu)}
        >
          {menu ? d.ui.closeMenu : d.ui.menu}
          <span aria-hidden="true">{menu ? "−" : "+"}</span>
        </button>
        <nav
          id="main-nav"
          aria-label={d.ui.navLabel}
          className={menu ? "is-open" : ""}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setMenu(false);
              menuButton.current?.focus();
            }
          }}
        >
          {d.navigation.map((n) => (
            <NavLink key={n.id} to={n.path} end onClick={() => setMenu(false)}>
              {n.label}
            </NavLink>
          ))}
          <Action />
        </nav>
      </header>
      <main id="main" ref={main} tabIndex="-1">
        {page}
      </main>
      <footer>
        <div className="footer-top">
          <div>
            <Link className="footer-logo-link" to="/" aria-label={d.brand.name}>
              <Image image={d.brand.logo} className="footer-logo" />
            </Link>
            <p>{d.footer.line}</p>
          </div>
          <nav aria-label={d.ui.footerNav}>
            {d.navigation.map((n) => (
              <Link key={n.id} to={n.path}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div>
            <h2>{d.footer.socialHeading}</h2>
            <SocialLinks />
            <p><a href={`mailto:${d.contact.email}`}>{d.contact.email}</a></p>
            <p><a href={`tel:${d.contact.phone}`}>{d.contact.phone}</a></p>
            <ServiceAreas />
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            {d.ui.copyrightSymbol} {new Date().getFullYear()}{" "}
            {d.footer.copyright}
          </p>
          <p>{d.brand.tagline}</p>
        </div>
      </footer>
    </>
  );
}
