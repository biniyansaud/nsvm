import { ASSETS, SCHOOL, LEADERSHIP } from "@/const";
import { defaultGalleryItems, highResolutionGalleryItems, defaultFacultyContent } from "@/lib/siteContent";
import { getAssetUrl } from "@/lib/assets";

// Prioritized tiers for intelligent progressive preloading
export const PRELOAD_TIERS = {
  // Tier 1: Critical, above-the-fold assets to preload immediately
  high: [
    SCHOOL.logo,
    ASSETS.hero,
    ASSETS.principal,
  ],
  // Tier 2: Mid-priority secondary page assets to load after initial interactive state
  medium: [
    ASSETS.vp,
    ASSETS.admin,
    ASSETS.classroom,
    ASSETS.campus,
    ASSETS.campusLife,
    ASSETS.admissionBanner,
  ],
  // Tier 3: Background deferred queue containing all gallery, staff, & activity images
  low: [
    ASSETS.earlyLearning,
    ASSETS.primaryLearning,
    ASSETS.labLearning,
    ASSETS.assembly,
    ASSETS.activity,
    ASSETS.activity2,
    ASSETS.activity3,
    ASSETS.event,
    ASSETS.notice,
    // Add all high-res gallery items
    ...highResolutionGalleryItems.map((g) => g.src),
    // Add all standard gallery items
    ...defaultGalleryItems.map((g) => g.src),
    // Add all faculty staff images
    ...defaultFacultyContent.schoolStaffCategories.flatMap((c) => c.members.map((m) => m.image)),
    ...defaultFacultyContent.secondaryDepartments.flatMap((d) => d.members.map((m) => m.image)),
  ],
};

// Map routes to their associated images for contextual viewport preloading
export const ROUTE_ASSETS: Record<string, string[]> = {
  "/": [
    ASSETS.hero,
    SCHOOL.logo,
    ASSETS.principal,
    ASSETS.vp,
    ASSETS.admin,
    ASSETS.campus,
    ASSETS.campusLife,
  ],
  "/about": [
    ASSETS.principal,
    ASSETS.vp,
    ASSETS.admin,
    ASSETS.campusLife,
    ASSETS.campus,
  ],
  "/courses": [
    ASSETS.earlyLearning,
    ASSETS.primaryLearning,
    ASSETS.labLearning,
    ASSETS.classroom,
  ],
  "/gallery": [
    ...highResolutionGalleryItems.map((g) => g.src),
    ...defaultGalleryItems.slice(0, 12).map((g) => g.src),
  ],
  "/notices": [
    ASSETS.notice,
    ASSETS.admissionBanner,
  ],
  "/contact": [
    ASSETS.campus,
  ],
  "/secondary-level-staffs": [
    ...defaultFacultyContent.secondaryDepartments.flatMap((d) => d.members.map((m) => m.image)),
  ],
  "/school-staffs": [
    ...defaultFacultyContent.schoolStaffCategories.flatMap((c) => c.members.map((m) => m.image)),
  ],
};

// Track preloaded image URLs to avoid duplicate network requests
const preloadedCache = new Set<string>();
// Background queue for dynamic images registered at runtime
const backgroundQueue = new Set<string>();

/**
 * Checks network type and data-saver mode to adapt preloading aggressiveness on mobile
 */
function isLowMemoryOrSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (conn) {
    if (conn.saveData) return true;
    if (conn.effectiveType === "2g" || conn.effectiveType === "slow-2g") return true;
  }
  return false;
}

/**
 * Low-level utility to load a single image via browser Image constructor
 */
export function preloadImage(rawSrc: string, priority: "high" | "low" = "low"): Promise<void> {
  const src = getAssetUrl(rawSrc);
  if (!src || preloadedCache.has(src)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();
    
    // Leverage the modern HTML fetchpriority attribute for smart bandwidth utilization
    if (priority === "high") {
      (img as any).fetchPriority = "high";
    } else {
      (img as any).fetchPriority = "low";
    }

    img.src = src;
    img.onload = () => {
      preloadedCache.add(src);
      resolve();
    };
    img.onerror = () => {
      // Do NOT add to preloadedCache on error so DOM component re-fetches cleanly
      resolve();
    };
  });
}

/**
 * Dynamically injects a <link rel="preload"> tag into <head> for fast, early HTTP request dispatch
 */
export function injectPreloadLink(rawSrc: string): void {
  const src = getAssetUrl(rawSrc);
  if (!src || typeof document === "undefined") return;
  
  const existing = document.querySelector(`link[href="${src}"][rel="preload"]`);
  if (existing) return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = src;
  (link as any).fetchPriority = "high";
  document.head.appendChild(link);
}

/**
 * Intelligent queue scheduler using requestIdleCallback or fallback setTimeout
 */
function scheduleIdleWork(callback: () => void, delayMs = 0): void {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as any).requestIdleCallback(() => {
      if (delayMs > 0) {
        setTimeout(callback, delayMs);
      } else {
        callback();
      }
    });
  } else {
    setTimeout(callback, delayMs || 1);
  }
}

/**
 * Responsive Image Helper: Returns recommended sizes attribute based on context
 */
export function getResponsiveSizes(type: "gallery" | "hero" | "avatar" | "banner" = "gallery"): string {
  switch (type) {
    case "hero":
      return "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px";
    case "banner":
      return "(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1024px";
    case "avatar":
      return "(max-width: 640px) 120px, 240px";
    case "gallery":
    default:
      return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px";
  }
}

/**
 * Background Preload Manager orchestrating high, medium, and low tier progressive loading
 */
export class ImagePreloadManager {
  private static initiated = false;
  private static isPreloadingBackground = false;

  public static init(): void {
    if (this.initiated || typeof window === "undefined") return;
    this.initiated = true;

    // Deduplicate Low tier list
    const lowTierUnique = Array.from(new Set(PRELOAD_TIERS.low));

    // 1. Inject head preloads for critical above-the-fold assets
    PRELOAD_TIERS.high.forEach((src) => {
      injectPreloadLink(src);
    });

    // 2. Schedule Tier 2 Mid-priority assets after initial interactive state (approx 1.5s delay)
    scheduleIdleWork(() => {
      this.preloadBatch(PRELOAD_TIERS.medium);
    }, 1500);

    // 3. Defer remaining Tier 3 Low-priority assets (all gallery photos, staff photos) to idle browser ticks
    const isMobileDataSave = isLowMemoryOrSaveData();
    const chunkSize = isMobileDataSave ? 1 : 3;
    const intervalMs = isMobileDataSave ? 1200 : 500;

    scheduleIdleWork(() => {
      this.preloadSequentialChunks(lowTierUnique, chunkSize, intervalMs);
    }, 2500);
  }

  /**
   * Preloads a full list of images concurrently
   */
  public static preloadBatch(srcs: string[]): Promise<void[]> {
    const valid = srcs.filter(Boolean);
    return Promise.all(valid.map((src) => preloadImage(src, "low")));
  }

  /**
   * Register new dynamic images (e.g. from Supabase or dynamic admin changes) to be background preloaded
   */
  public static registerImages(srcs: string[]): void {
    const unvisited = srcs.filter((src) => src && !preloadedCache.has(src) && !backgroundQueue.has(src));
    if (unvisited.length === 0) return;

    unvisited.forEach((src) => backgroundQueue.add(src));

    if (!this.isPreloadingBackground) {
      scheduleIdleWork(() => {
        this.processBackgroundQueue();
      }, 1000);
    }
  }

  /**
   * Process enqueued background images in sequential idle chunks
   */
  private static async processBackgroundQueue(): Promise<void> {
    if (this.isPreloadingBackground || backgroundQueue.size === 0) return;
    this.isPreloadingBackground = true;

    const isMobileDataSave = isLowMemoryOrSaveData();
    const chunkSize = isMobileDataSave ? 1 : 3;
    const intervalMs = isMobileDataSave ? 1000 : 400;

    const list = Array.from(backgroundQueue);
    backgroundQueue.clear();

    await this.preloadSequentialChunks(list, chunkSize, intervalMs);
    this.isPreloadingBackground = false;

    if (backgroundQueue.size > 0) {
      this.processBackgroundQueue();
    }
  }

  /**
   * Contextual Preload based on visited route or hover event
   */
  public static preloadRouteAssets(route: string): void {
    const assets = ROUTE_ASSETS[route];
    if (assets && assets.length > 0) {
      // Preload context-specific assets immediately on request with high priority
      assets.forEach((src) => {
        preloadImage(src, "high");
      });
    }
  }

  /**
   * Lightbox / Slider helper: Preloads adjacent images ahead of time
   */
  public static preloadAdjacentImages(currentIndex: number, total: number, getSrcFn: (idx: number) => string): void {
    if (total <= 1) return;
    const nextIdx = (currentIndex + 1) % total;
    const prevIdx = (currentIndex - 1 + total) % total;

    const nextSrc = getSrcFn(nextIdx);
    const prevSrc = getSrcFn(prevIdx);

    if (nextSrc) preloadImage(nextSrc, "high");
    if (prevSrc) preloadImage(prevSrc, "high");
  }

  /**
   * Loads a large list of images sequentially in small chunks with rest intervals
   */
  private static async preloadSequentialChunks(srcs: string[], chunkSize: number, intervalMs: number): Promise<void> {
    const copy = [...srcs];
    while (copy.length > 0) {
      const chunk = copy.splice(0, chunkSize);
      await Promise.all(chunk.map((src) => preloadImage(src, "low")));
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  /**
   * Returns cache status
   */
  public static isCached(src: string): boolean {
    return preloadedCache.has(src);
  }
}
