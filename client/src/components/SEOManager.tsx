import React, { useEffect } from "react";
import { useLocation } from "wouter";

export interface RouteMeta {
  title: string;
  description: string;
  keywords?: string;
  pageType?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage" | "ItemPage";
  ogImage?: string;
  breadcrumbs?: Array<{ name: string; path: string }>;
  noIndex?: boolean;
}

const SITE_URL = "https://nsvm.edu.np";
const DEFAULT_BRAND = "New Saraswati Vidya Mandir (newsaraswati)";
const DEFAULT_KEYWORDS =
  "newsaraswati, new saraswati, newsaraswatividyamandir, new saraswati vidya mandir, new saraswati secondary school, new saraswati school, new saraswati kanchanpur, new saraswati airy, nsvm, nsvm kanchanpur, nsvm mahendranagar, nsvm airy, nsvm.edu.np, newsaraswati.edu.np, न्यू सरस्वती, न्यू सरस्वती विद्या मन्दिर, न्यू सरस्वती माध्यमिक विद्यालय, Best School in Kanchanpur, +2 Management Kanchanpur, SEE School Kanchanpur, Sudurpashchim School";

// Comprehensive route-to-metadata registry
const ROUTE_METADATA_MAP: Record<string, RouteMeta> = {
  "/": {
    title: "New Saraswati Vidya Mandir Secondary School — BDM-12, Airy, Kanchanpur | newsaraswati",
    description:
      "Official website of New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM), BDM-12 Airy, Kanchanpur, Sudurpashchim, Nepal. Established in 2060 B.S. (2000 A.D.), offering Montessori to Grade 12 with NEB Management stream, modern science & IT labs, experienced faculty, and online admissions.",
    keywords:
      "newsaraswati, new saraswati, newsaraswatividyamandir, new saraswati vidya mandir, new saraswati secondary school, new saraswati school, new saraswati kanchanpur, new saraswati airy, nsvm, nsvm kanchanpur, nsvm mahendranagar, nsvm.edu.np, newsaraswati.edu.np, न्यू सरस्वती, Best School in Kanchanpur, +2 Management Kanchanpur",
    pageType: "WebPage",
    ogImage: `${SITE_URL}/images/gallery/school-background.jpg`,
    breadcrumbs: [{ name: "Home", path: "/" }],
  },
  "/about": {
    title: "About Us — History, Mission & Academic Legacy | New Saraswati Vidya Mandir (newsaraswati)",
    description:
      "Learn about New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM) established in 2060 B.S. in BDM-12 Airy, Kanchanpur. Discover our mission, core values, academic achievements, and school leadership.",
    keywords:
      "About New Saraswati, newsaraswati, new saraswati vidya mandir, History New Saraswati Vidya Mandir, NSVM Leadership, Principal Amraj Bhatt, School Management Committee, BDM-12 Airy",
    pageType: "AboutPage",
    ogImage: `${SITE_URL}/images/staff/principal-AMRAJ-BHATT-SIR.webp`,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "About Us", path: "/about" },
    ],
  },
  "/courses": {
    title: "Academic Programs & Courses — Montessori to Grade 12 Management | New Saraswati Vidya Mandir",
    description:
      "Explore academic offerings at New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM) from Montessori to Grade 10 SEE preparation and Grade 11-12 NEB Management stream in Kanchanpur.",
    keywords:
      "New Saraswati Courses, newsaraswati, newsaraswatividyamandir, New Saraswati Vidya Mandir Programs, +2 Management Kanchanpur, NSVM Montessori Grade 12, SEE Courses New Saraswati, NEB Management Airy",
    pageType: "CollectionPage",
    ogImage: `${SITE_URL}/images/gallery/food-fest-and-science-exchibition-gal.jpg`,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Academic Programs", path: "/courses" },
    ],
  },
  "/apply": {
    title: "Online Student Admission 2082 B.S. — Apply Online | New Saraswati Vidya Mandir",
    description:
      "Apply online for admission at New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM), BDM-12 Airy, Kanchanpur. Simple online admission registration form for Montessori to Grade 12 (+2 Management).",
    keywords:
      "New Saraswati Admission, newsaraswati, newsaraswatividyamandir, Apply New Saraswati Vidya Mandir, NSVM Admission Form Kanchanpur, Online Admission 2082 BS, newsaraswati admission form",
    pageType: "WebPage",
    ogImage: `${SITE_URL}/images/gallery/cover-page1.jpg`,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Online Admission", path: "/apply" },
    ],
  },
  "/notices": {
    title: "Official Notices, Routines & Announcements | New Saraswati Vidya Mandir (newsaraswati)",
    description:
      "Stay informed with official school notices, exam routines, vacation notices, result publications, and event announcements from New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM), Kanchanpur.",
    keywords:
      "New Saraswati Notices, newsaraswati, newsaraswatividyamandir, New Saraswati Vidya Mandir Exam Routine, NSVM Notices Kanchanpur, School Announcements BDM-12 Airy, Result Publication",
    pageType: "CollectionPage",
    ogImage: `${SITE_URL}/images/branding/school-logo.jpg`,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Notices & Announcements", path: "/notices" },
    ],
  },
  "/contact": {
    title: "Contact Us & Location Map — BDM-12, Airy, Kanchanpur | New Saraswati Vidya Mandir",
    description:
      "Get in touch with New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM) in BDM-12 Airy, Kanchanpur, Nepal. Phone: +977-099-525169, Email: info@nsvm.edu.np. Google Maps directions and admissions help.",
    keywords:
      "Contact New Saraswati, newsaraswati, newsaraswatividyamandir, New Saraswati Vidya Mandir Location, NSVM Kanchanpur Phone, New Saraswati School Address Airy Kanchanpur",
    pageType: "ContactPage",
    ogImage: `${SITE_URL}/images/gallery/school-background.jpg`,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Contact Us", path: "/contact" },
    ],
  },
  "/school-staffs": {
    title: "School Staff Directory & Faculty Members | New Saraswati Vidya Mandir",
    description:
      "Meet our dedicated primary, lower-secondary, and administrative teachers at New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM) in BDM-12 Airy, Kanchanpur.",
    keywords:
      "New Saraswati Staff, newsaraswati, newsaraswatividyamandir, New Saraswati Vidya Mandir Teachers, NSVM Faculty Kanchanpur, School Staff Airy Kanchanpur",
    pageType: "CollectionPage",
    ogImage: `${SITE_URL}/images/staff/principal-AMRAJ-BHATT-SIR.webp`,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "School Staffs", path: "/school-staffs" },
    ],
  },
  "/secondary-staffs": {
    title: "Secondary & +2 Management Faculty Department | New Saraswati Vidya Mandir",
    description:
      "Meet the secondary level teachers and +2 Management subject department lecturers at New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM), Kanchanpur.",
    keywords:
      "New Saraswati Secondary Faculty, newsaraswati, newsaraswatividyamandir, New Saraswati +2 Teachers, NSVM Management Teachers, Secondary School Faculty Kanchanpur",
    pageType: "CollectionPage",
    ogImage: `${SITE_URL}/images/staff/principal-AMRAJ-BHATT-SIR.webp`,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Secondary Level Staffs", path: "/secondary-staffs" },
    ],
  },
  "/gallery": {
    title: "Campus Life & Event Photo Gallery | New Saraswati Vidya Mandir (newsaraswati)",
    description:
      "Browse high-resolution photos of campus infrastructure, classroom activities, sports meets, cultural days, prize distribution, and educational tours at New Saraswati Vidya Mandir Secondary School.",
    keywords:
      "New Saraswati Gallery, newsaraswati, newsaraswatividyamandir, New Saraswati Vidya Mandir Photos, NSVM Campus Pictures, School Events Kanchanpur",
    pageType: "CollectionPage",
    ogImage: `${SITE_URL}/images/gallery/school-background.jpg`,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Photo Gallery", path: "/gallery" },
    ],
  },
  "/virtual-tour": {
    title: "Interactive 3D Virtual Campus Tour — 360° Walkthrough | New Saraswati Vidya Mandir",
    description:
      "Experience an interactive 3D virtual tour of New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM) campus, classrooms, computer labs, science labs, and playgrounds in BDM-12 Airy, Kanchanpur.",
    keywords:
      "New Saraswati Virtual Tour, newsaraswati, newsaraswatividyamandir, New Saraswati Vidya Mandir 3D Campus, NSVM Interactive Tour Kanchanpur",
    pageType: "WebPage",
    ogImage: `${SITE_URL}/images/gallery/school-background.jpg`,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Virtual Tour", path: "/virtual-tour" },
    ],
  },
  "/admin": {
    title: "Admin Portal | New Saraswati Vidya Mandir",
    description: "Administrative control panel for New Saraswati Vidya Mandir Secondary School.",
    noIndex: true,
  },
  "/404": {
    title: "404 - Page Not Found | New Saraswati Vidya Mandir (newsaraswati)",
    description: "The requested page could not be found on New Saraswati Vidya Mandir Secondary School website.",
    noIndex: true,
  },
};

// Aliases lookup
const ROUTE_ALIASES: Record<string, string> = {
  "/tour": "/virtual-tour",
  "/secondary-level-staffs": "/secondary-staffs",
  "/2-staffs": "/secondary-staffs",
  "/staffs": "/school-staffs",
  "/faculty/school-staffs": "/school-staffs",
};

/**
 * SEOManager Component
 * Dynamically updates document title, meta descriptions, keywords, canonical URLs,
 * OpenGraph, Twitter card tags, and JSON-LD schema graphs on every route change in App.tsx.
 */
export const SEOManager: React.FC = () => {
  const [location] = useLocation();

  useEffect(() => {
    // Normalize path by stripping query strings and matching aliases
    const pathname = location.split("?")[0] || "/";
    const resolvedPath = ROUTE_ALIASES[pathname] || pathname;
    const meta = ROUTE_METADATA_MAP[resolvedPath] || ROUTE_METADATA_MAP["/404"] || {
      title: `${DEFAULT_BRAND} — BDM-12 Airy, Kanchanpur`,
      description: ROUTE_METADATA_MAP["/"].description,
      pageType: "WebPage" as const,
    };

    // 1. Update Document Title
    document.title = meta.title;

    // 2. Helper to update or inject meta tags
    const updateMetaTag = (attribute: "name" | "property", key: string, value: string) => {
      let el = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attribute, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    // 3. Primary Metadata
    updateMetaTag("name", "description", meta.description);
    updateMetaTag("name", "keywords", meta.keywords || DEFAULT_KEYWORDS);
    updateMetaTag("name", "author", "New Saraswati Vidya Mandir Secondary School");
    updateMetaTag("name", "publisher", "New Saraswati Vidya Mandir");

    // 4. Robots Directives
    if (meta.noIndex) {
      updateMetaTag("name", "robots", "noindex, nofollow");
    } else {
      updateMetaTag("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    }

    // 5. Geo Metadata for Local Search Ranking in Kanchanpur, Nepal
    updateMetaTag("name", "geo.region", "NP-FW");
    updateMetaTag("name", "geo.placename", "Airy, Bhimdatta Municipality-12, Kanchanpur, Sudurpashchim, Nepal");
    updateMetaTag("name", "geo.position", "28.956700;80.181011");
    updateMetaTag("name", "ICBM", "28.956700, 80.181011");

    // 6. Canonical URL
    const canonicalHref = `${SITE_URL}${pathname === "/" ? "" : pathname}`;
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", canonicalHref);

    // 7. Open Graph Metadata
    const ogImg = meta.ogImage || `${SITE_URL}/images/gallery/school-background.jpg`;
    updateMetaTag("property", "og:site_name", DEFAULT_BRAND);
    updateMetaTag("property", "og:type", "website");
    updateMetaTag("property", "og:title", meta.title);
    updateMetaTag("property", "og:description", meta.description);
    updateMetaTag("property", "og:url", canonicalHref);
    updateMetaTag("property", "og:image", ogImg);
    updateMetaTag("property", "og:image:secure_url", ogImg);
    updateMetaTag("property", "og:locale", "en_US");
    updateMetaTag("property", "og:locale:alternate", "ne_NP");

    // 8. Twitter Card Metadata
    updateMetaTag("name", "twitter:card", "summary_large_image");
    updateMetaTag("name", "twitter:title", meta.title);
    updateMetaTag("name", "twitter:description", meta.description);
    updateMetaTag("name", "twitter:image", ogImg);

    // 9. Structured Data JSON-LD Schema
    const scriptId = "dynamic-route-schema";
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = scriptId;
      scriptEl.type = "application/ld+json";
      document.head.appendChild(scriptEl);
    }

    const schemas: any[] = [
      {
        "@context": "https://schema.org",
        "@type": meta.pageType || "WebPage",
        "@id": `${canonicalHref}#webpage`,
        url: canonicalHref,
        name: meta.title,
        description: meta.description,
        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },
        about: {
          "@id": `${SITE_URL}/#organization`,
        },
        inLanguage: ["en", "ne"],
      },
    ];

    if (meta.breadcrumbs && meta.breadcrumbs.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: meta.breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
        })),
      });
    }

    scriptEl.textContent = JSON.stringify(schemas);
  }, [location]);

  return null;
};

export default SEOManager;
