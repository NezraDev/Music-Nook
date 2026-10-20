import React, { useEffect, useRef, useState } from "react";
import { siteData as d } from "./data";
import { validCoordinates } from "./shared";
export default function LocationMap() {
  const box = useRef(null),
    canvas = useRef(null);
  const [requested, setRequested] = useState(false),
    [status, setStatus] = useState("");
  const valid =
    validCoordinates(d.map.center) && validCoordinates(d.map.marker);
  useEffect(() => {
    if (!valid || !box.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRequested(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(box.current);
    return () => observer.disconnect();
  }, [valid]);
  useEffect(() => {
    if (!requested || !valid) return;
    let map,
      cancelled = false;
    setStatus(d.map.loading);
    Promise.all([
      import("maplibre-gl"),
      import("maplibre-gl/dist/maplibre-gl.css"),
    ])
      .then(([lib]) => {
        if (cancelled) return;
        map = new lib.Map({
          container: canvas.current,
          locale: d.map.locale,
          style:
            d.map.styleUrl +
            (import.meta.env.VITE_CARTO_BASEMAP_KEY
              ? "?key=" +
                encodeURIComponent(import.meta.env.VITE_CARTO_BASEMAP_KEY)
              : ""),
          center: d.map.center,
          zoom: d.map.zoom,
          scrollZoom: false,
          cooperativeGestures: true,
          attributionControl: true,
        });
        map.addControl(new lib.NavigationControl({ showCompass: false }));
        const popup = new lib.Popup().setText(d.map.markerText);
        new lib.Marker({ color: "#236F70" })
          .setLngLat(d.map.marker)
          .setPopup(popup)
          .addTo(map);
        map.on("load", () => setStatus(""));
        map.on("error", () => setStatus(d.map.error));
      })
      .catch(() => setStatus(d.map.error));
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [requested, valid]);
  return (
    <div ref={box} className="location-map">
      {valid ? (
        <>
          <button className="text-link" onClick={() => setRequested(true)}>
            {d.map.load}
          </button>
          <div
            ref={canvas}
            className="map-canvas"
            role="region"
            aria-label={d.map.label}
          />
          <p role="status">{status}</p>
          <p className="map-attribution">
            <a href="https://maplibre.org/">MapLibre</a> ·{" "}
            <a href="https://carto.com/attributions">CARTO</a> ·{" "}
            <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>
          </p>
        </>
      ) : (
        <p className="map-placeholder">{d.map.placeholder}</p>
      )}
      {d.contact.serviceArea && <p>{d.contact.serviceArea}</p>}
      {/^https:\/\//.test(d.map.directionsUrl) && (
        <a href={d.map.directionsUrl} target="_blank" rel="noopener noreferrer">
          {d.buttons.directions}
        </a>
      )}
    </div>
  );
}
