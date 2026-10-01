/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState, type SyntheticEvent, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import AssetIcon from "@/components/ui/AssetIcon";
import { useLanguage } from "@/context/LanguageContext";

const FALLBACK_IMAGE = "/images/no-photo.svg";

const onImageError = (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_IMAGE;
};

/** Horizontal swipe of more than 40px calls back with -1 (to the right) or 1 (to the left). */
function useSwipe(onSwipe: (direction: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (event: TouchEvent) => {
      const t = event.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (event: TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const t = event.changedTouches[0];
      const dx = t.clientX - s.x;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(t.clientY - s.y)) onSwipe(dx < 0 ? 1 : -1);
    },
  };
}

/**
 * Listing photos: a large photo with arrows and a counter, a grid of thumbnails under it,
 * and a full-screen viewer (arrows, keyboard, swipe, click to zoom).
 */
export default function ListingGallery({ images, title }: { images: string[]; title: string }) {
  const { tr } = useLanguage();
  const photos = images.length ? images : [FALLBACK_IMAGE];
  const count = photos.length;
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const go = (step: number) => setIndex((i) => (i + step + count) % count);
  const swipe = useSwipe(go);
  const labels = {
    prev: tr("Previous photo", "Ankstesnė nuotrauka", "Предыдущее фото"),
    next: tr("Next photo", "Kita nuotrauka", "Следующее фото"),
    open: tr("Open photo", "Atidaryti nuotrauką", "Открыть фото"),
  };

  return (
    <div>
      <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-border" {...swipe}>
        <button type="button" onClick={() => setViewerOpen(true)} aria-label={labels.open} className="absolute inset-0 h-full w-full cursor-zoom-in">
          <img src={photos[index]} alt={`${title} ${index + 1}`} className="h-full w-full object-cover" onError={onImageError} />
        </button>
        {count > 1 && (
          <>
            <ArrowButton side="left" label={labels.prev} onClick={() => go(-1)} />
            <ArrowButton side="right" label={labels.next} onClick={() => go(1)} />
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-1.5 grid grid-cols-5 gap-1.5">
          {photos.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${tr("Photo", "Nuotrauka", "Фото")} ${i + 1}`}
              aria-current={i === index}
              className={`relative aspect-[4/3] overflow-hidden rounded-lg bg-muted transition ${
                i === index ? "ring-2 ring-accent" : "opacity-80 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" onError={onImageError} />
            </button>
          ))}
        </div>
      )}

      {viewerOpen && <PhotoViewer photos={photos} title={title} index={index} onIndex={setIndex} onClose={() => setViewerOpen(false)} />}
    </div>
  );
}

function ArrowButton({ side, label, onClick, large = false }: { side: "left" | "right"; label: string; onClick: () => void; large?: boolean }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
      className={`absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/70 ${
        side === "left" ? (large ? "left-4" : "left-3") : large ? "right-4" : "right-3"
      } ${large ? "h-12 w-12" : "h-10 w-10 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"}`}
    >
      <AssetIcon name={side === "left" ? "chevron-left" : "chevron-right"} size={large ? 26 : 22} />
    </button>
  );
}

function PhotoViewer({
  photos,
  title,
  index,
  onIndex,
  onClose,
}: {
  photos: string[];
  title: string;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const { tr } = useLanguage();
  const count = photos.length;
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const go = (step: number) => {
    setZoom(null);
    onIndex((index + step + count) % count);
  };
  const swipe = useSwipe((direction) => {
    if (!zoom) go(direction);
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    stripRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [index]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[130] flex flex-col bg-black text-white">
      <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3">
        <span className="min-w-0 truncate text-sm text-white/70">
          {title} · {index + 1} / {count}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={tr("Close", "Uždaryti", "Закрыть")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <AssetIcon name="close" size={20} />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
        {...swipe}
      >
        <img
          src={photos[index]}
          alt={`${title} ${index + 1}`}
          onError={onImageError}
          onClick={(event) => {
            if (zoom) return setZoom(null);
            const rect = event.currentTarget.getBoundingClientRect();
            setZoom({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
          }}
          onMouseMove={(event) => {
            if (!zoom) return;
            const rect = event.currentTarget.getBoundingClientRect();
            setZoom({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
          }}
          style={zoom ? { transform: "scale(2.2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          className={`max-h-full max-w-full select-none object-contain transition-transform duration-200 ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          draggable={false}
        />
        {count > 1 && !zoom && (
          <>
            <ArrowButton large side="left" label={tr("Previous photo", "Ankstesnė nuotrauka", "Предыдущее фото")} onClick={() => go(-1)} />
            <ArrowButton large side="right" label={tr("Next photo", "Kita nuotrauka", "Следующее фото")} onClick={() => go(1)} />
          </>
        )}
      </div>

      {count > 1 && (
        <div ref={stripRef} className="flex shrink-0 gap-1.5 overflow-x-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 [scrollbar-width:none]">
          {photos.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              data-index={i}
              onClick={() => {
                setZoom(null);
                onIndex(i);
              }}
              aria-label={`${tr("Photo", "Nuotrauka", "Фото")} ${i + 1}`}
              aria-current={i === index}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-md transition md:h-16 md:w-24 ${i === index ? "ring-2 ring-accent" : "opacity-50 hover:opacity-100"}`}
            >
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" onError={onImageError} />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
