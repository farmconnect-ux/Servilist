"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, Maximize2, X } from "lucide-react";

/**
 * Image gallery (docs/UI_UX_SPEC.md sections 16 and 65): a large primary image
 * shown whole, thumbnails, an image counter, and a fullscreen view that closes
 * with Escape. Works with the keyboard as well as touch.
 */
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const count = images.length;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (fullscreen && !element.open) element.showModal();
    if (!fullscreen && element.open) element.close();
  }, [fullscreen]);

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-card border border-line bg-surface-muted text-disabled">
        <ImageOff className="size-10" aria-hidden="true" />
        <span className="sr-only">No photos</span>
      </div>
    );
  }

  const step = (by: number) => setIndex((current) => (current + by + count) % count);
  const arrow =
    "absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-pill border border-line bg-surface text-ink shadow-sm hover:border-line-strong";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-line bg-surface-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={count > 1 ? `${title}, photo ${index + 1} of ${count}` : title}
          className="size-full object-contain"
        />
        {count > 1 ? (
          <>
            <button type="button" onClick={() => step(-1)} className={`${arrow} left-3`} aria-label="Previous photo">
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => step(1)} className={`${arrow} right-3`} aria-label="Next photo">
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 left-3 rounded-pill bg-ink/80 px-2.5 py-1 text-xs font-medium text-white">
              {index + 1} / {count}
            </span>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute right-3 bottom-3 flex size-11 items-center justify-center rounded-pill border border-line bg-surface text-ink shadow-sm hover:border-line-strong"
          aria-label="View photo full screen"
        >
          <Maximize2 className="size-5" aria-hidden="true" />
        </button>
      </div>

      {count > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, position) => (
            <li key={url + position} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(position)}
                aria-label={`Show photo ${position + 1}`}
                aria-current={position === index ? "true" : undefined}
                className={`block size-20 overflow-hidden rounded-input border-2 bg-surface-muted ${
                  position === index ? "border-primary-600" : "border-line hover:border-line-strong"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* The native dialog traps focus and closes on Escape */}
      <dialog
        ref={dialog}
        onClose={() => setFullscreen(false)}
        aria-label={`${title}, full screen`}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink p-0 backdrop:bg-ink"
      >
        <div className="relative flex size-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[index]} alt={title} className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-pill bg-surface text-ink"
            aria-label="Close full screen"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          {count > 1 ? (
            <>
              <button type="button" onClick={() => step(-1)} className={`${arrow} left-4`} aria-label="Previous photo">
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => step(1)} className={`${arrow} right-4`} aria-label="Next photo">
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-pill bg-surface px-3 py-1 text-sm font-medium text-ink">
                {index + 1} / {count}
              </span>
            </>
          ) : null}
        </div>
      </dialog>
    </div>
  );
}
