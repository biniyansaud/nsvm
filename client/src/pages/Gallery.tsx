import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ASSETS } from "@/const";
import { defaultGalleryItems, useSiteContent } from "@/lib/siteContent";
import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import SEO from "@/components/SEO";
import { ImagePreloadManager, preloadImage } from "@/lib/imagePreloadManager";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  X,
} from "lucide-react";

type GalleryCategory = "all" | "campus" | "learning" | "activities" | "events";

interface GalleryItem {
  id: number | string;
  src: string;
  category: GalleryCategory;
  title: string;
  desc: string;
}

export default function Gallery() {
  const [filter, setFilter] = useState<GalleryCategory>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { content } = useSiteContent();

  const fallbackGalleryItems: GalleryItem[] = defaultGalleryItems;
  const galleryItems = content.gallery.length ? content.gallery : fallbackGalleryItems;

  // Background preload all gallery images immediately when component mounts or content updates
  useEffect(() => {
    if (galleryItems.length > 0) {
      ImagePreloadManager.registerImages(galleryItems.map((item) => item.src));
    }
  }, [galleryItems]);

  const filteredItems = galleryItems.filter(
    (item) => filter === "all" || item.category === filter
  );

  // Preload adjacent images when Lightbox is active
  useEffect(() => {
    if (lightboxIndex !== null && filteredItems.length > 0) {
      ImagePreloadManager.preloadAdjacentImages(
        lightboxIndex,
        filteredItems.length,
        (idx) => filteredItems[idx]?.src
      );
    }
  }, [lightboxIndex, filteredItems]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex === 0 ? filteredItems.length - 1 : lightboxIndex - 1
    );
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex === filteredItems.length - 1 ? 0 : lightboxIndex + 1
    );
  };

  return (
    <>
      <SEO
        title="Photo & Campus Event Gallery"
        description="Browse photos, campus facilities, classroom activities, sports meets, and cultural programs at New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM), Kanchanpur."
        keywords="New Saraswati Gallery, newsaraswati, newsaraswatividyamandir, New Saraswati Vidya Mandir Photos, NSVM Campus Pictures, School Events Kanchanpur"
        canonical="/gallery"
        pageType="CollectionPage"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Photo Gallery", path: "/gallery" },
        ]}
      />
      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${ASSETS.classroom})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.18,
            mixBlendMode: "overlay",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(197,155,39,0.20) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(30,95,160,0.30) 0%, transparent 55%)",
          }}
        />

        <div className="container relative z-10 py-20 sm:py-24 md:py-32 lg:py-36 text-center">
          <span className="eyebrow-pill">
            <Camera className="h-3 w-3 text-secondary animate-pulse" />
            School Memories
          </span>
          <h1
            className="text-white mt-6 anim-fade-up font-display font-extrabold"
            style={{
              fontSize: "clamp(2.1rem, 1.4rem + 3.6vw, 4.5rem)",
              lineHeight: 1.06,
              letterSpacing: "-0.01em",
              animationDelay: "80ms",
            }}
          >
            Our <span className="text-shimmer" style={{ backgroundSize: "200% 100%" }}>Gallery</span>
          </h1>
          <p
            className="mx-auto mt-6 max-w-2xl text-white/85 anim-fade-up"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(0.98rem, 0.88rem + 0.4vw, 1.125rem)",
              lineHeight: 1.65,
              animationDelay: "160ms",
            }}
          >
            A visual chronicle of academic focus, practical learning, co-curricular activities,
            and campus life at New Saraswati Vidya Mandir.
          </p>
        </div>

        {/* Curved bottom transition */}
        <svg
          className="absolute bottom-[-1px] left-0 w-full"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          style={{ height: "60px", display: "block" }}
          aria-hidden
        >
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#fafbfc" />
        </svg>
      </section>

      {/* Gallery Main Section */}
      <section className="container pt-8 pb-16 md:py-28" data-no-reveal>
        {/* Category Filters */}
        <div className="flex flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center gap-2 mb-10 sm:mb-14 border-b border-slate-200/60 pb-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: "all", label: "All Memories" },
            { id: "campus", label: "Campus Life" },
            { id: "learning", label: "Learning" },
            { id: "activities", label: "Activities" },
            { id: "events", label: "Events" },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as GalleryCategory)}
                className={`relative px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider font-sans transition-all duration-300 flex items-center gap-2 shrink-0 active:scale-95 ${
                  isActive
                    ? "text-primary z-10"
                    : "text-slate-400 hover:text-slate-700 bg-transparent"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeGalleryTab"
                    className="absolute inset-0 bg-secondary/20 border border-secondary/30 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`h-2 w-2 rounded-full transition-all duration-300 ${isActive ? "bg-secondary scale-110" : "bg-slate-300"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="gallery-card group relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl hover-lift transition-all duration-300 cursor-pointer"
                onClick={() => setLightboxIndex(index)}
                onMouseEnter={() => preloadImage(item.src, "high")}
                onTouchStart={() => preloadImage(item.src, "high")}
              >
                {/* Image Container */}
                <div className="gallery-image-wrap relative overflow-hidden bg-slate-100 rounded-t-3xl">
                  <ImageWithSkeleton
                    src={item.src}
                    alt={item.title}
                    preset="gallery"
                    loading={index < 6 ? "eager" : "lazy"}
                    fetchPriority={index < 3 ? "high" : "auto"}
                    decoding="async"
                    aspectRatio="aspect-[4/3]"
                    className="gallery-image w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="h-11 w-11 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <Eye className="h-5 w-5 text-secondary" />
                    </div>
                  </div>
                  {/* Category Tag */}
                  <span className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-[9px] font-bold uppercase tracking-wider text-primary font-sans shadow-sm">
                    {item.category === "campus" && "Campus"}
                    {item.category === "learning" && "Learning"}
                    {item.category === "activities" && "Activity"}
                    {item.category === "events" && "Event"}
                  </span>
                </div>

                {/* Text Area */}
                <div className="p-6 space-y-2">
                  <h3 className="font-display font-black text-base text-primary group-hover:text-secondary transition-colors duration-200">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-xs font-sans leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Camera className="h-12 w-12 text-slate-300 mx-auto mb-4 animate-bounce" />
            <h3 className="font-display font-bold text-lg text-primary">No memories found</h3>
            <p className="text-slate-400 text-sm font-sans mt-1">
              Try switching filters to view other school life categories.
            </p>
          </div>
        )}
      </section>

      {/* Full Screen Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[10000] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 select-none"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Lightbox Top Controls */}
            <div className="flex items-center justify-between text-white shrink-0 py-2">
              <div>
                <span className="text-xs uppercase tracking-widest text-slate-400 font-sans">
                  Memories · {lightboxIndex + 1} of {filteredItems.length}
                </span>
                <h4 className="font-display font-bold text-lg mt-0.5 text-white">
                  {filteredItems[lightboxIndex].title}
                </h4>
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lightbox Center Image & Nav */}
            <div className="flex-1 flex items-center justify-center relative w-full h-full min-h-0 my-2">
              {/* Prev Button */}
              <button
                onClick={handlePrev}
                className="absolute left-2 md:left-6 z-10 h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 hover:bg-slate-900/85 hover:scale-105 flex items-center justify-center text-white transition-all active:scale-95"
                title="Previous image"
              >
                <ChevronLeft className="h-5 w-5 sm:h-7 sm:w-7" />
              </button>

              {/* Main Image Frame */}
              <div
                className="relative max-w-5xl w-full h-full max-h-[72vh] md:max-h-[78vh] flex items-center justify-center p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={lightboxIndex}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    src={filteredItems[lightboxIndex].src}
                    alt={filteredItems[lightboxIndex].title}
                    loading="eager"
                    decoding="async"
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10 select-none"
                  />
                </AnimatePresence>
              </div>

              {/* Next Button */}
              <button
                onClick={handleNext}
                className="absolute right-2 md:right-6 z-10 h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 hover:bg-slate-900/85 hover:scale-105 flex items-center justify-center text-white transition-all active:scale-95"
                title="Next image"
              >
                <ChevronRight className="h-5 w-5 sm:h-7 sm:w-7" />
              </button>
            </div>

            {/* Lightbox Bottom Description */}
            <div
              className="text-center text-white shrink-0 py-4 max-w-xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm text-slate-300 font-sans leading-relaxed">
                {filteredItems[lightboxIndex].desc}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


