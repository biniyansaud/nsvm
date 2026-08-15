import { getAssetUrl } from "./lib/assets";

export { getAssetUrl };

export const SCHOOL = {
  name: "New Saraswati Vidya Mandir Secondary School",
  shortName: "NSVM",
  motto: "Quality | Confidence | Character",
  tagline: "QUALITY | CONFIDENCE | CHARACTER",
  established: "2060 B.S.",
  establishedAd: "2000 A.D.",
  location: "BDM-12, Airy, Kanchanpur",
  district: "Kanchanpur, Sudurpashchim",
  contact: "099-525169",
  email: "info@nsvm.edu.np",
  logo: getAssetUrl("/images/branding/school-logo.jpg"),
  mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d257.5926222928584!2d80.12897362629002!3d28.96123380398959!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39a1ac9d7f2e7301%3A0x3b544a0ad65bd869!2sShree%20New%20Saraswati%20Vidya%20Mandir!5e1!3m2!1sen!2snp!4v1783152745049!5m2!1sen!2snp",
};

export const ASSETS = {
  hero: getAssetUrl("/images/gallery/school-background-highres.jpg"),
  classroom: getAssetUrl("/images/gallery/focused-classwork.jpg"),
  campus: getAssetUrl("/images/gallery/school-background-highres.jpg"),
  campusLife: getAssetUrl("/images/gallery/GAL16.jpg"),
  admissionBanner: getAssetUrl("/images/gallery/admission-campaign.jpg"),
  principal: getAssetUrl("/images/staff/principal-AMRAJ-BHATT-SIR.webp"),
  vp: getAssetUrl("/images/staff/vice-principal.jpg"),
  admin: getAssetUrl("/images/staff/jyoti-joshi-accountant.webp"),
  earlyLearning: getAssetUrl("/images/gallery/GAL14.jpg"),
  primaryLearning: getAssetUrl("/images/gallery/GAL13.jpg"),
  labLearning: getAssetUrl("/images/gallery/smart-classroom-highres.jpg"),
  assembly: getAssetUrl("/images/gallery/GAL16.jpg"),
  activity: getAssetUrl("/images/gallery/GAL1.jpg"),
  activity2: getAssetUrl("/images/gallery/GAL18.jpg"),
  activity3: getAssetUrl("/images/gallery/annual-program-stage.jpg"),
  event: getAssetUrl("/images/gallery/GAL17.jpg"),
  notice: getAssetUrl("/images/gallery/admission-campaign.jpg"),
};

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
  children?: Array<{
    label: string;
    href: string;
    external?: boolean;
  }>;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "HOME", href: "/", icon: "Home" },
  {
    label: "ABOUT US",
    href: "/about",
    icon: "Info",
  },
  {
    label: "FACULTY",
    href: "#",
    icon: "Users",
    children: [
      { label: "SECONDARY LEVEL STAFFS", href: "/secondary-level-staffs" },
      { label: "SCHOOL STAFFS", href: "/school-staffs" },
    ],
  },
  {
    label: "COURSES",
    href: "/courses",
    icon: "BookOpen",
    children: [
      { label: "+2", href: "/courses#plus-two" },
      { label: "SCHOOL", href: "/courses#school" },
    ],
  },
  {
    label: "NOTICE",
    href: "/notices",
    icon: "Bell",
  },
  { label: "GALLERY", href: "/gallery", icon: "Camera" },
  { label: "CONTACT", href: "/contact", icon: "Phone" },
];

export const LEADERSHIP = {
  principal: {
    name: "Am Raj Bhatt",
    role: "Principal",
    image: ASSETS.principal,
    quote:
      "I warmly welcome you to the NSVM family. Our commitment is to lead with enthusiasm, work closely with parents, and provide a safe, productive learning environment where every child can grow with confidence.",
  },
  vicePrincipal: {
    name: "Academic Coordinator",
    role: "Academic Team",
    image: ASSETS.vp,
    quote:
      "The strength of our school is built every morning through punctual classrooms, honest feedback, and a steady partnership between teachers, students, and guardians.",
  },
  administrator: {
    name: "Administration Office",
    role: "NSVM Administration",
    image: ASSETS.admin,
    quote:
      "Behind every well-run classroom is a circle of care, coordinating staff, guardians, and resources so that learning never stops at our gate.",
  },
};
