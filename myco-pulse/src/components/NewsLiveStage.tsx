import React, { useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import { useNewsProgram } from "../hooks/useNewsProgram";

/** Full-bleed program video — YouTube iframe or NAS MP4 from `/api/news/program`. */
export function NewsLiveStage({ className }: { className?: string }) {
  const {
    playbackUrl,
    mediaUrl,
    graphicUrl,
    bumperUrl,
    label,
    isNasPlayback,
    showBumper,
  } = useNewsProgram();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !mediaUrl) return;
    el.load();
    void el.play().catch(() => {
      /* autoplay policy */
    });
  }, [mediaUrl]);

  if (showBumper && bumperUrl) {
    return (
      <div
        className={cn(
          "absolute inset-0 z-[1] overflow-hidden bg-black",
          className,
        )}
      >
        <img
          src={bumperUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          aria-hidden
        />
        {graphicUrl ? (
          <img
            src={graphicUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-contain pointer-events-none z-[2]"
            aria-hidden
          />
        ) : null}
      </div>
    );
  }

  if (!playbackUrl) {
    return (
      <div
        className={cn("absolute inset-0 z-[1] bg-black", className)}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        "absolute inset-0 z-[1] overflow-hidden bg-black",
        className,
      )}
    >
      {isNasPlayback && mediaUrl ? (
        <video
          ref={videoRef}
          key={mediaUrl}
          src={mediaUrl}
          className="absolute inset-0 h-full w-full object-cover bg-black pointer-events-none"
          autoPlay
          muted
          playsInline
          loop={false}
          aria-label={label}
        />
      ) : (
        <iframe
          key={playbackUrl}
          title={label}
          src={playbackUrl}
          className="absolute inset-0 h-full w-full border-0 bg-black pointer-events-none"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={-1}
        />
      )}

      {graphicUrl ? (
        <img
          src={graphicUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-contain pointer-events-none z-[2]"
          aria-hidden
        />
      ) : null}

      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_55%,#000_100%)] opacity-40 z-[3]"
        aria-hidden
      />
    </div>
  );
}
