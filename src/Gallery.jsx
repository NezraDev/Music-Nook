import React, { useEffect, useMemo, useRef, useState } from "react";
import { siteData as d } from "./data";
import { approvedMedia } from "./shared";
import { Image } from "./App";

export default function Gallery({ preview = false }) {
  const photos = useMemo(() => approvedMedia(d.gallery), []);
  const albums = useMemo(() => {
    const grouped = new Map();
    for (const photo of photos) {
      const clientId = photo.clientId || photo.id;
      if (!grouped.has(clientId)) {
        grouped.set(clientId, {
          clientId,
          name: photo.caption,
          photos: [],
        });
      }
      grouped.get(clientId).photos.push(photo);
    }
    return [...grouped.values()];
  }, [photos]);

  const [category, setCategory] = useState("all");
  const [activeClientId, setActiveClientId] = useState(null);
  const [slide, setSlide] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const dialog = useRef(null);
  const opener = useRef(null);
  const close = useRef(null);
  const duration = d.pages.studentGallery.slideDurationMs;

  const visibleAlbums = useMemo(() => {
    const matching =
      category === "all"
        ? albums
        : albums.filter((album) =>
            album.photos.some((photo) => photo.category === category),
          );
    return preview ? matching.slice(0, 3) : matching;
  }, [albums, category, preview]);
  const activeAlbum = albums.find((album) => album.clientId === activeClientId);
  const activePhoto = activeAlbum?.photos[slide];
  const position = activeAlbum
    ? d.ui.slidePosition
        .replace("{current}", String(slide + 1))
        .replace("{total}", String(activeAlbum.photos.length))
    : "";
  const shouldPlay =
    Boolean(activeAlbum) &&
    activeAlbum.photos.length > 1 &&
    !reducedMotion &&
    pageVisible;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    const node = dialog.current;
    if (!activeAlbum || !node) return undefined;
    if (!node.open) node.showModal();
    close.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      if (node.open) node.close();
      document.body.style.overflow = previousOverflow;
      opener.current?.focus();
    };
  }, [activeAlbum]);

  useEffect(() => {
    if (!shouldPlay) return undefined;
    const timer = window.setInterval(() => {
      setSlide((current) => (current + 1) % activeAlbum.photos.length);
    }, duration);
    return () => window.clearInterval(timer);
  }, [activeAlbum, duration, shouldPlay]);

  useEffect(() => {
    if (!activeAlbum || activeAlbum.photos.length < 2) return;
    const nextPhoto = activeAlbum.photos[(slide + 1) % activeAlbum.photos.length];
    const preload = new window.Image();
    preload.src = nextPhoto.src;
  }, [activeAlbum, slide]);

  const openAlbum = (album, cover, event) => {
    opener.current = event.currentTarget;
    setSlide(album.photos.indexOf(cover));
    setActiveClientId(album.clientId);
  };

  const dismiss = () => setActiveClientId(null);
  const moveSlide = (direction) => {
    if (!activeAlbum) return;
    setSlide(
      (current) =>
        (current + direction + activeAlbum.photos.length) %
        activeAlbum.photos.length,
    );
  };

  const handleDialogKeyDown = (event) => {
    if (event.key === "Tab") {
      const focusable = [
        ...dialog.current.querySelectorAll(
          'button,[href],input,select,textarea,[tabindex="0"]',
        ),
      ];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      moveSlide(event.key === "ArrowRight" ? 1 : -1);
    }
  };

  return (
    <>
      {!preview && albums.length > 0 && (
        <div className="filters" role="group" aria-label={d.ui.filter}>
          {d.pages.studentGallery.categories.map((item) => (
            <button
              key={item.id}
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {visibleAlbums.length > 0 ? (
        <div className="gallery-grid">
          {visibleAlbums.map((album) => {
            const matchingPhotos =
              category === "all"
                ? album.photos
                : album.photos.filter((photo) => photo.category === category);
            const cover =
              matchingPhotos.find((photo) => photo.height > photo.width) ||
              matchingPhotos[0] ||
              album.photos[0];
            const label = d.ui.openAlbum
              .replace("{name}", album.name)
              .replace("{count}", String(album.photos.length));
            const count = d.ui.photoCount.replace(
              "{count}",
              String(album.photos.length),
            );

            return (
              <figure className="gallery-album" key={album.clientId}>
                <button
                  className="gallery-image"
                  style={{ aspectRatio: "3 / 4" }}
                  onClick={(event) => openAlbum(album, cover, event)}
                  aria-label={label}
                >
                  <img
                    src={cover.thumbnail || cover.src}
                    width={cover.thumbnailWidth || cover.width}
                    height={cover.thumbnailHeight || cover.height}
                    alt={cover.alt}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: "center center" }}
                    onError={(event) => {
                      event.currentTarget.removeAttribute("srcset");
                      event.currentTarget.src = d.brand.logo.src;
                      event.currentTarget.alt = d.ui.imageFallback;
                    }}
                  />
                </button>
                <figcaption>
                  <span className="gallery-client-name">{album.name}</span>
                  <span className="gallery-photo-count">{count}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : (
        <div className="gallery-empty">
          <div className="empty-frame" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2>{d.pages.studentGallery.emptyTitle}</h2>
          <p>{d.pages.studentGallery.empty}</p>
        </div>
      )}

      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={
          activeAlbum
            ? d.ui.galleryDialog.replace("{name}", activeAlbum.name)
            : d.ui.galleryDialog
        }
        onCancel={(event) => {
          event.preventDefault();
          dismiss();
        }}
        onKeyDown={handleDialogKeyDown}
        onClick={(event) => {
          if (event.target === dialog.current) dismiss();
        }}
      >
        <button ref={close} className="lightbox-close" onClick={dismiss}>
          {d.ui.close}
        </button>
        {activeAlbum && activePhoto && (
          <>
            <figure
              className="lightbox-figure"
              aria-label={`${position}: ${activePhoto.caption}`}
            >
              <div className="lightbox-carousel">
                {activeAlbum.photos.length > 1 && (
                  <button
                    className="lightbox-nav lightbox-prev"
                    aria-label={d.ui.previousPhoto}
                    onClick={() => moveSlide(-1)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                )}
                <div className="lightbox-image-frame">
                  <Image image={activePhoto} className="lightbox-image" />
                </div>
                {activeAlbum.photos.length > 1 && (
                  <button
                    className="lightbox-nav lightbox-next"
                    aria-label={d.ui.nextPhoto}
                    onClick={() => moveSlide(1)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                )}
              </div>
              <figcaption>{activePhoto.caption}</figcaption>
            </figure>
            <p className="visually-hidden" aria-live="polite" aria-atomic="true">
              {position}: {activePhoto.caption}
            </p>
            <div
              className="slide-indicators"
              role="group"
              aria-label={d.ui.slideIndicator}
            >
              {activeAlbum.photos.map((photo, index) => (
                <span className="slide-indicator" key={photo.id}>
                  <span
                    key={`${photo.id}-${slide}`}
                    className={`slide-indicator-fill${index < slide ? " is-complete" : ""}${index === slide ? ` is-current${shouldPlay ? " is-running" : " is-still"}` : ""}`}
                    style={{
                      "--slide-duration": `${duration}ms`,
                      animationPlayState: shouldPlay ? "running" : "paused",
                    }}
                  />
                </span>
              ))}
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
