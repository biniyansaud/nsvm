import { useState, useEffect, useRef } from "react";
import { ImagePreloadManager, getResponsiveSizes } from "@/lib/imagePreloadManager";
import { getAssetUrl } from "@/lib/assets";
import { GraduationCap } from "lucide-react";

/** Local production fallback when a gallery/staff image fails to load. */
const FALLBACK_IMAGE = getAssetUrl("/images/gallery/school-background.jpg");
const LOGO_FALLBACK = getAssetUrl("/images/branding/school-logo.jpg");

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string; // e.g. "aspect-[4/3]", "aspect-[16/9]", "aspect-square", "none"
  containerClassName?: string;
  fetchPriority?: "high" | "low" | "auto";
  /** Optional custom fallback path; defaults to school campus photo or logo */
  fallbackSrc?: string;
  /** Responsive presets: 'gallery' | 'hero' | 'avatar' | 'banner' */
  preset?: "gallery" | "hero" | "avatar" | "banner";
  showPlaceholderIcon?: boolean;
}

export default function ImageWithSkeleton({
  src: rawSrc,
  alt,
  className = "w-full h-full object-cover",
  aspectRatio = "aspect-[4/3]",
  containerClassName = "",
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  fallbackSrc: rawFallbackSrc,
  preset = "gallery",
  showPlaceholderIcon = true,
  sizes,
  onLoad,
  onError,
  ...restProps
}: ImageWithSkeletonProps) {
  const resolvedSrc = getAssetUrl(rawSrc);
  const resolvedFallback = rawFallbackSrc ? getAssetUrl(rawFallbackSrc) : undefined;

  const [isLoaded, setIsLoaded] = useState(() => ImagePreloadManager.isCached(resolvedSrc));
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);
  const [hasFailed, setHasFailed] = useState(false);
  const [isPermanentlyFailed, setIsPermanentlyFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync state when src prop changes
  useEffect(() => {
    setCurrentSrc(resolvedSrc);
    setHasFailed(false);
    setIsPermanentlyFailed(false);
    setRetryCount(0);
    if (ImagePreloadManager.isCached(resolvedSrc)) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [resolvedSrc]);

  // Check if image is already completed in DOM on mount or src change
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
      ImagePreloadManager.preloadBatch([currentSrc]);
    }
  }, [currentSrc]);

  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    ImagePreloadManager.preloadBatch([currentSrc]);
    if (onLoad) onLoad(e);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Retry once with query flag in case of connection drop
    if (retryCount < 1) {
      setRetryCount(1);
      setTimeout(() => {
        if (imgRef.current) {
          const sep = currentSrc.includes("?") ? "&" : "?";
          imgRef.current.src = `${currentSrc}${sep}_retry=1`;
        }
      }, 200);
      return;
    }

    if (!hasFailed) {
      setHasFailed(true);
      const isBranding = /\/images\/branding\//.test(resolvedSrc);
      const next = resolvedFallback || (isBranding ? LOGO_FALLBACK : FALLBACK_IMAGE);

      if (next && next !== currentSrc) {
        setCurrentSrc(next);
        return;
      }
    }

    // Both primary and fallback failed -> show clean styled fallback placeholder card
    setIsPermanentlyFailed(true);
    setIsLoaded(true);
    if (onError) onError(e);
  };

  const defaultSizes = sizes || getResponsiveSizes(preset);
  const isExternal = /^https?:\/\//i.test(currentSrc);

  return (
    <div
      className={`relative overflow-hidden w-full bg-slate-100 ${
        aspectRatio !== "none" ? aspectRatio : ""
      } ${containerClassName}`}
    >
      {/* Skeleton Shimmer Loading Overlay */}
      {!isLoaded && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-slate-200/80 transition-opacity duration-500 pointer-events-none"
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
          {showPlaceholderIcon && (
            <div className="relative z-10 p-2 rounded-full bg-white/40 text-slate-400/80 shadow-sm backdrop-blur-xs">
              <GraduationCap className="h-6 w-6 animate-pulse" />
            </div>
          )}
        </div>
      )}

      {/* Styled Fallback UI Card if image failed completely */}
      {isPermanentlyFailed ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 p-4 text-center select-none">
          <GraduationCap className="h-8 w-8 text-slate-400 mb-1" />
          <span className="text-[11px] font-bold tracking-wide uppercase text-slate-500 truncate max-w-full">
            {alt || "NSVM Media"}
          </span>
        </div>
      ) : (
        /* Actual Image with smooth transition */
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          loading={loading}
          decoding={decoding}
          fetchPriority={fetchPriority}
          {...(isExternal ? { referrerPolicy: "no-referrer" } : {})}
          sizes={defaultSizes}
          onLoad={handleImageLoaded}
          onError={handleImageError}
          className={`${className} transition-all duration-500 ease-out ${
            isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[1.02] blur-xs"
          }`}
          {...restProps}
        />
      )}
    </div>
  );
}
