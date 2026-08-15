import React, { useEffect } from "react";
import { useLocation } from "wouter";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  pageType?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage" | "ItemPage";
  breadcrumbs?: Array<{ name: string; path: string }>;
  structuredData?: Record<string, any>;
}

const DEFAULT_TITLE = "New Saraswati Vidya Mandir Secondary School — BDM-12, Airy, Kanchanpur | newsaraswati";
const DEFAULT_DESC = "Official website of New Saraswati Vidya Mandir Secondary School (NSVM), BDM-12 Airy, Kanchanpur, Sudurpashchim, Nepal. Established 2060 B.S. offering Montessori to Grade 12 (+2 Management). Search newsaraswati for admissions, notices, results, and faculty.";
const DEFAULT_KEYWORDS = "newsaraswati, new saraswati, newsaraswatividyamandir, new saraswati vidya mandir, new saraswati secondary school, new saraswati school, new saraswati kanchanpur, new saraswati airy, nsvm, nsvm kanchanpur, nsvm mahendranagar, nsvm airy, nsvm.edu.np, newsaraswati.edu.np, न्यू सरस्वती, न्यू सरस्वती विद्या मन्दिर, न्यू सरस्वती माध्यमिक विद्यालय, Best School in Kanchanpur, +2 Management Kanchanpur, SEE School Kanchanpur, Sudurpashchim School";
const SITE_URL = "https://nsvm.edu.np";

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESC,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogImage = `${SITE_URL}/images/gallery/school-background.jpg`,
  pageType = "WebPage",
  breadcrumbs,
  structuredData,
}) => {
  const [location] = useLocation();

  useEffect(() => {
    // Construct page title with top priority for "New Saraswati Vidya Mandir" and "newsaraswati"
    const pageTitle = title
      ? `${title} | New Saraswati Vidya Mandir (newsaraswati)`
      : DEFAULT_TITLE;

    document.title = pageTitle;

    // Helper to update or insert meta tag
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Combine default and custom keywords to ensure "newsaraswati" is always indexed
    const fullKeywords = keywords.includes("newsaraswati")
      ? keywords
      : `newsaraswati, new saraswati, ${keywords}`;

    // Standard Meta Tags
    updateMeta("description", description);
    updateMeta("keywords", fullKeywords);
    updateMeta("author", "New Saraswati Vidya Mandir Secondary School");
    updateMeta("publisher", "New Saraswati Vidya Mandir");
    updateMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

    // Geo Meta Tags
    updateMeta("geo.region", "NP-FW");
    updateMeta("geo.placename", "Airy, Kanchanpur");
    updateMeta("geo.position", "28.956700;80.181011");
    updateMeta("ICBM", "28.956700, 80.181011");

    // Canonical Link
    const pageCanonical = canonical ? `${SITE_URL}${canonical}` : `${SITE_URL}${location === "/" ? "" : location}`;
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", pageCanonical);

    // Open Graph / Facebook Meta
    updateMeta("og:site_name", "New Saraswati Vidya Mandir Secondary School (newsaraswati)", true);
    updateMeta("og:type", "website", true);
    updateMeta("og:title", pageTitle, true);
    updateMeta("og:description", description, true);
    updateMeta("og:url", pageCanonical, true);
    updateMeta("og:image", ogImage, true);
    updateMeta("og:locale", "en_US", true);
    updateMeta("og:locale:alternate", "ne_NP", true);

    // Twitter Card Meta
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", pageTitle);
    updateMeta("twitter:description", description);
    updateMeta("twitter:image", ogImage);

    // Dynamic Page JSON-LD Schema
    const scriptId = "dynamic-page-schema";
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
        "@type": pageType,
        "@id": `${pageCanonical}#webpage`,
        "url": pageCanonical,
        "name": pageTitle,
        "description": description,
        "isPartOf": {
          "@id": `${SITE_URL}/#website`
        },
        "about": {
          "@id": `${SITE_URL}/#organization`
        },
        "inLanguage": ["en", "ne"]
      }
    ];

    // Add Breadcrumb schema if provided or derived
    const breadcrumbList = breadcrumbs || [
      { name: "Home", path: "/" },
      ...(location !== "/" ? [{ name: title || "Page", path: location }] : [])
    ];

    if (breadcrumbList.length > 1) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbList.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": `${SITE_URL}${item.path === "/" ? "" : item.path}`
        }))
      });
    }

    if (structuredData) {
      schemas.push({
        "@context": "https://schema.org",
        ...structuredData
      });
    }

    scriptEl.textContent = JSON.stringify(schemas);

  }, [title, description, keywords, canonical, ogImage, pageType, breadcrumbs, structuredData, location]);

  return null;
};

export default SEO;
