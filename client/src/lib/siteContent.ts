import { useEffect, useState } from "react";
import type { NoticeDocument } from "@/components/NoticeViewerModal";
import { isSupabaseConfigured } from "./supabase";
import { fetchGalleryFromSupabase, fetchNoticesFromSupabase, fetchFullSiteContentFromSupabase } from "./supabaseApi";
import { ImagePreloadManager } from "./imagePreloadManager";
import { getAssetUrl } from "./assets";

export type GalleryCategory = "all" | "campus" | "learning" | "activities" | "events";

export interface GalleryItem {
  id: string;
  src: string;
  category: Exclude<GalleryCategory, "all">;
  title: string;
  desc: string;
}

export interface SchoolStaffMember {
  id: string;
  name: string;
  designation: string;
  expertise?: string;
  officialRole: string;
  image: string;
}

export interface SchoolStaffCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  members: SchoolStaffMember[];
}

export interface SecondaryStaffMember {
  id: string;
  name: string;
  expertise: string;
  image: string;
}

export interface SecondaryDepartment {
  id: string;
  title: string;
  summary: string;
  icon: string;
  members: SecondaryStaffMember[];
}

export interface FacultyContent {
  schoolStaffCategories: SchoolStaffCategory[];
  secondaryDepartments: SecondaryDepartment[];
}

export interface SiteContent {
  site: {
    schoolName: string;
    tagline: string;
    location: string;
    contact: string;
    email: string;
    admissionCta: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    highlights: Array<{
      label: string;
      value: string;
      note: string;
    }>;
  };
  gallery: GalleryItem[];
  notices: NoticeDocument[];
  faculty: FacultyContent;
  updatedAt?: string;
}

export const defaultGalleryItems: GalleryItem[] = [
  { id: "campus-building", src: "/images/gallery/school-background-highres.jpg", category: "campus", title: "School Campus", desc: "The New Saraswati Vidya Mandir campus where everyday learning and school life begin." },
  { id: "morning-assembly", src: "/images/gallery/GAL16.jpg", category: "campus", title: "Morning Assembly", desc: "Students gathered in disciplined rows for assembly, routine, and shared school values." },
  { id: "admission-cover", src: "/images/gallery/admission-campaign.jpg", category: "campus", title: "Admission Campaign", desc: "A school admission banner highlighting the complete academic pathway at NSVM." },
  { id: "campus-cover-2", src: "/images/gallery/cover-gal.jpg", category: "campus", title: "Campus Cover", desc: "A campus cover photo from school life at NSVM." },
  { id: "campus-cover-3", src: "/images/gallery/cover-gal-2.jpg", category: "campus", title: "Campus Moments", desc: "Another view of campus life and school activities." },
  { id: "campus-cover-4", src: "/images/gallery/cover-gal-3.jpg", category: "campus", title: "School Community", desc: "Students and the school community together on campus." },
  { id: "campus-cover-5", src: "/images/gallery/cover-gal-4.jpg", category: "campus", title: "School Gathering", desc: "A lively campus gathering captured for the school gallery." },
  { id: "campus-tour-group", src: "/images/gallery/tour-group-campus.jpg", category: "campus", title: "Campus Visit Group", desc: "Students and teachers together during an educational visit and group learning moment." },
  { id: "principal-gallery", src: "/images/staff/principal-sir-gal.jpg", category: "campus", title: "Principal at School Event", desc: "Principal Amraj Bhatt during a school program and community moment." },
  { id: "learning-exhibition", src: "/images/gallery/GAL13.jpg", category: "learning", title: "Food Fest & Science Exhibition", desc: "A practical exhibition table connecting science, presentation, and student participation." },
  { id: "learning-project", src: "/images/gallery/food-science-exhibition.jpg", category: "learning", title: "Project Work Display", desc: "Student-made project material showing hands-on learning beyond the textbook." },
  { id: "learning-drawing", src: "/images/gallery/drawing-gal.jpg", category: "learning", title: "Student Drawing", desc: "Creative drawing work that gives students space for observation, imagination, and expression." },
  { id: "learning-drawing-2", src: "/images/gallery/drawing-gal2.jpg", category: "learning", title: "Art Gallery", desc: "More student artwork from the school drawing and arts activities." },
  { id: "activity-game", src: "/images/gallery/game-gal.jpg", category: "activities", title: "Game Time", desc: "Students participating in a school game activity on campus." },
  { id: "activity-game-2", src: "/images/gallery/game-gal-2.jpg", category: "activities", title: "Sports & Games", desc: "Team energy and outdoor participation during school games." },
  { id: "activity-game-3", src: "/images/gallery/game-gal-3.jpg", category: "activities", title: "Playground Activity", desc: "Students enjoying playground games and physical activity." },
  { id: "activity-game-4", src: "/images/gallery/game-gal-4.jpg", category: "activities", title: "Game Day Memory", desc: "A cheerful game-day memory from campus sports." },
  { id: "activity-tour", src: "/images/gallery/educational-tour.jpg", category: "activities", title: "Educational Tour", desc: "A tour-day moment with students ready for exposure, travel, and learning outside class." },
  { id: "activity-tour-2", src: "/images/gallery/tour-group-campus.jpg", category: "activities", title: "Tour Group", desc: "Students and teachers on an educational tour together." },
  { id: "activity-tour-5", src: "/images/gallery/tour-group-memory.jpg", category: "activities", title: "Tour Memory", desc: "A shared travel memory from an educational tour." },
  { id: "activity-tour-15", src: "/images/gallery/tour-gal-15.jpg", category: "activities", title: "Tour Day", desc: "Another highlight from a school educational tour." },
  { id: "event-program", src: "/images/gallery/program-gal.jpg", category: "events", title: "School Program", desc: "A formal school program with students, guests, and the NSVM community." },
  { id: "event-program-2", src: "/images/gallery/annual-program-stage.jpg", category: "events", title: "Annual Program Stage", desc: "Stage moments from the annual school program." },
  { id: "event-program-3", src: "/images/gallery/evening-program.jpg", category: "events", title: "Evening Program", desc: "A special school program preserved as a warm community memory." },
  { id: "event-program-4", src: "/images/gallery/program-gal-4.jpg", category: "events", title: "Cultural Program", desc: "Students performing and celebrating during a school cultural program." },
  { id: "event-cultural", src: "/images/gallery/festival-gal.jpg", category: "events", title: "Festival Celebration", desc: "Students celebrating festival culture and tradition at school." },
  { id: "event-dashain", src: "/images/gallery/dashain-gal-2.jpg", category: "events", title: "Dashain Ceremony", desc: "A festival moment showing blessings, respect, and school-family togetherness." },
  { id: "event-prize", src: "/images/gallery/prize-gal.jpg", category: "events", title: "Prize Distribution", desc: "Students receiving recognition for achievement and participation." },
  { id: "event-prize-2", src: "/images/gallery/prize-gal-2.jpg", category: "events", title: "Award Ceremony", desc: "An award-day memory from the school stage and community gathering." },
  { id: "event-prize-3", src: "/images/gallery/prize-gal-3.jpg", category: "events", title: "Prize Day", desc: "Celebrating student success during prize distribution." },
  { id: "event-prize-distribution", src: "/images/gallery/prize-distribution-gal.jpg", category: "events", title: "Prize Distribution Day", desc: "Formal prize distribution with students and school leadership." },
  { id: "event-prize-distribution-2", src: "/images/gallery/prize-distribution-gal-2.jpg", category: "events", title: "Achievement Day", desc: "Another moment from prize distribution and student recognition." },
  { id: "event-salutation", src: "/images/gallery/saluation-gal.jpg", category: "events", title: "Guest Felicitation", desc: "A formal felicitation moment during a school program." },
  { id: "event-salutation-2", src: "/images/gallery/saluation-gal-2.jpg", category: "events", title: "Salutation Ceremony", desc: "Respect and welcome moments during a school ceremony." },
  { id: "gal-1", src: "/images/gallery/gal-1.jpg", category: "campus", title: "School Life", desc: "A candid moment from everyday school life at NSVM." },
  { id: "gal-2", src: "/images/gallery/gal-2.jpg", category: "campus", title: "Campus Life", desc: "Students and campus energy captured in the school gallery." },
  { id: "gal-3", src: "/images/gallery/gal-3.jpg", category: "activities", title: "Activity Snapshot", desc: "Students engaged in school activities and learning experiences." },
  { id: "gal-4", src: "/images/gallery/gal-4.jpg", category: "events", title: "Event Memory", desc: "A memorable school event shared with the community." },
  { id: "gal-5", src: "/images/gallery/gal-5.jpg", category: "campus", title: "NSVM Gallery", desc: "A gallery highlight from New Saraswati Vidya Mandir." },
  { id: "gal-8", src: "/images/gallery/gal-8.jpg", category: "learning", title: "Learning Moment", desc: "Students learning and participating in school programs." },
  { id: "gal-9", src: "/images/gallery/gal-9.jpg", category: "activities", title: "Student Activity", desc: "Active participation and school spirit on campus." },
  { id: "gal-10", src: "/images/gallery/gal-10.jpg", category: "events", title: "Program Day", desc: "A program-day memory from the school calendar." },
  { id: "gal-11", src: "/images/gallery/gal-11.jpg", category: "campus", title: "School Community", desc: "The NSVM community together in a school setting." },
  { id: "gal-12", src: "/images/gallery/gal-12.jpg", category: "activities", title: "Together at NSVM", desc: "Students and teachers sharing a school activity moment." },
  { id: "gal-13", src: "/images/gallery/gal-13.jpg", category: "events", title: "Celebration", desc: "Celebration and joy during a school gathering." },
  { id: "gal-14", src: "/images/gallery/gal-14.jpg", category: "campus", title: "Campus View", desc: "Another view of campus life and student presence." },
  { id: "gal-15", src: "/images/gallery/gal-15.jpg", category: "learning", title: "Classroom Spirit", desc: "Learning spirit captured outside formal lessons." },
  { id: "gal-16", src: "/images/gallery/gal-16.jpg", category: "activities", title: "Group Activity", desc: "Group activity and teamwork among students." },
  { id: "gal-18", src: "/images/gallery/gal-18.jpg", category: "events", title: "Special Day", desc: "A special school-day memory for students and staff." },
  { id: "gal-20", src: "/images/gallery/gal-20.jpg", category: "campus", title: "School Day", desc: "Everyday school-day energy at NSVM." },
  { id: "gal-23", src: "/images/gallery/gal-23.jpg", category: "activities", title: "Outdoor Activity", desc: "Outdoor participation and student engagement." },
  { id: "gal-44", src: "/images/gallery/gal-44.jpg", category: "events", title: "Gallery Highlight", desc: "A standout moment from the school photo archive." },
  { id: "gal-99", src: "/images/gallery/gal-99.jpg", category: "campus", title: "NSVM Memory", desc: "A lasting memory from New Saraswati Vidya Mandir." },
  { id: "gal-mid", src: "/images/gallery/gal-in-mid.jpg", category: "campus", title: "Midday Campus", desc: "Campus life captured in the middle of a school day." },
  { id: "gal-random", src: "/images/gallery/gal-random.jpg", category: "activities", title: "Random School Moment", desc: "An unscripted school moment full of student energy." },
  { id: "gal-only", src: "/images/gallery/galonly.jpg", category: "events", title: "School Gallery", desc: "A featured gallery photo from school programs and events." },
  { id: "gal-main", src: "/images/gallery/gal.jpg", category: "campus", title: "School Photo", desc: "A main gallery image representing school life at NSVM." },
];

/** Full-resolution school photography for the public gallery and lightbox. */
export const highResolutionGalleryItems: GalleryItem[] = [
  { id: "campus-assembly-hd", src: "/images/gallery/GAL16.jpg", category: "campus", title: "Morning Assembly", desc: "Students gathered at New Saraswati Vidya Mandir for the school assembly." },
  { id: "campus-garden-hd", src: "/images/gallery/GAL1.jpg", category: "campus", title: "Green School Activity", desc: "Students learning responsibility and teamwork through hands-on campus gardening." },
  { id: "campus-building-hd", src: "/images/gallery/school-background-highres.jpg", category: "campus", title: "School Campus", desc: "The New Saraswati Vidya Mandir campus where everyday learning begins." },
  { id: "learning-classwork-hd", src: "/images/gallery/focused-classwork.jpg", category: "learning", title: "Focused Classwork", desc: "A quiet, focused classroom moment during everyday learning." },
  { id: "learning-science-hd", src: "/images/gallery/GAL13.jpg", category: "learning", title: "Science Exhibition", desc: "Students presenting practical science work and project learning." },
  { id: "learning-art-hd", src: "/images/gallery/GAL14.jpg", category: "learning", title: "Creative Arts", desc: "Creative expression and careful observation through student artwork." },
  { id: "learning-smart-class-hd", src: "/images/gallery/smart-classroom-highres.jpg", category: "learning", title: "Smart Classroom", desc: "Digital learning resources supporting an engaging classroom experience." },
  { id: "activity-tour-hd", src: "/images/gallery/GAL18.jpg", category: "activities", title: "Educational Tour", desc: "Students together for an educational outing and shared learning experience." },
  { id: "activity-garden-hd", src: "/images/gallery/green-school-activity.jpg", category: "activities", title: "Hands-on Learning", desc: "Outdoor learning that builds responsibility, teamwork, and care for the environment." },
  { id: "event-award-hd", src: "/images/gallery/GAL17.jpg", category: "events", title: "Annual Award Ceremony", desc: "Celebrating student achievement with the New Saraswati Vidya Mandir community." },
  { id: "event-stage-hd", src: "/images/gallery/annual-program-stage.jpg", category: "events", title: "Annual Programme", desc: "A memorable stage moment from a school programme." },
  { id: "event-community-hd", src: "/images/gallery/cover-gal-3.jpg", category: "events", title: "School Community", desc: "Teachers and the school community gathered for a special event." },
];

export const defaultNotices: NoticeDocument[] = [
  {
    id: 1,
    title: "Admission open for academic session 2082 BS",
    category: "notice",
    date: "2082-04-12",
    refNo: "SBSS/ADM/2082/001",
    publishedDate: "Baishakh 12, 2082 BS",
    content: {
      salutation: "To all Parents, Guardians, and Aspiring Students,",
      introduction: " New Saraswati Vidya Mandir is pleased to announce that online and physical admission registration for the upcoming academic session 2082 B.S. is open.",
      bulletPoints: [ 
        "ECD & Primary School focuses on foundational cognitive skills, language literacy, and arts.",
        "Lower Secondary introduces computer science, physical sciences, and local social studies.",
        "Secondary School follows the government approved curriculum for the SEE Board Track.",
        "+2 Management stream open for Grade XI–XII admission.",
      ],
      instructionsTitle: "Admission Procedure & Documents Required:",
      instructions: [
        "Collect the official Admission Form from the administration desk or submit an inquiry online.",
        "Submit the filled form with birth certificate and two passport-sized photos.",
        "Provide transfer certificate and previous school records where applicable.",
      ],
      closing: "For fee structures and scholarships, please contact the admission cell directly.",
      signatoryName: "Am Raj Bhatt",
      signatoryTitle: "Principal, NSVM",
    },
  },
  {
    id: 2,
    title: "First-term examination routine published",
    category: "exam",
    date: "2082-03-28",
    refNo: "SBSS/EXM/2082/045",
    publishedDate: "Ashad 28, 2082 BS",
    content: {
      salutation: "Dear Students, Teachers, and Guardians,",
      introduction: "The First-Term Examination for academic session 2082 B.S. has been scheduled. All students must prepare according to the published routine.",
      bulletPoints: ["Grades 1 to 5: morning oral and written evaluations.", "Grades 6 to 10: written examinations.", "Grade XI–XII Management: terminal papers."],
      instructionsTitle: "Exam Guidelines:",
      instructions: ["Collect admit cards from class teachers.", "Arrive 20 minutes before exam time.", "Mobile phones and unauthorized papers are prohibited."],
      closing: "Normal classes resume after the examination period.",
      signatoryName: "Examination Committee",
      signatoryTitle: "New Saraswati Vidya Mandir",
    },
  },
  {
    id: 3,
    title: "Annual cultural programme",
    category: "event",
    date: "2082-03-05",
    refNo: "SBSS/EVE/2082/012",
    publishedDate: "Ashad 05, 2082 BS",
    content: {
      salutation: "To guardians and well-wishers,",
      introduction: "We are pleased to invite the school community to the Annual Programme 2082.",
      bulletPoints: ["Traditional dance performances.", "Drama, poetry, quiz, and debate.", "Science and arts exhibition."],
      instructionsTitle: "Event Details:",
      instructions: ["Venue: school ground.", "Guests are requested to be seated before the opening ceremony.", "Please follow school security guidance."],
      closing: "We look forward to your presence and support.",
      signatoryName: "Am Raj Bhatt",
      signatoryTitle: "Principal / Festival Coordinator",
    },
  },
  {
    id: 4,
    title: "Inter-house athletics meet results announced",
    category: "event",
    date: "2082-02-18",
    refNo: "SBSS/SPO/2082/008",
    publishedDate: "Jestha 18, 2082 BS",
    content: {
      salutation: "To all students and house captains,",
      introduction: "The Annual Inter-House Athletics Meet 2082 has concluded successfully.",
      bulletPoints: ["Overall champion trophy announced.", "Best athlete awards will be distributed in assembly.", "Certificates will be provided to participating students."],
      instructionsTitle: "Post-Sports Meet Directives:",
      instructions: ["House captains must return sports materials.", "A special assembly will be held for awards."],
      closing: "Congratulations to all participants.",
      signatoryName: "Sports Department",
      signatoryTitle: "New Saraswati Vidya Mandir",
    },
  },
  {
    id: 5,
    title: "Holiday notice on the occasion of Majdoor Divas",
    category: "notice",
    date: "2082-02-01",
    refNo: "SBSS/ADM/2082/032",
    publishedDate: "Baishakh 18, 2082 BS",
    content: {
      salutation: "To all faculty, staff, and students,",
      introduction: "New Saraswati Vidya Mandir will remain closed on International Workers' Day.",
      bulletPoints: ["There will be no physical or online classes.", "The administration office will also remain closed."],
      instructionsTitle: "Important Guidelines:",
      instructions: ["Classes resume as per regular timetable on the next working day.", "Students are advised to complete pending assignments."],
      closing: "We wish everyone a peaceful Workers' Day.",
      signatoryName: "Am Raj Bhatt",
      signatoryTitle: "Principal",
    },
  },
];

export const defaultFacultyContent: FacultyContent = {
  schoolStaffCategories: [
    {
      id: "school-leadership",
      title: "School Leadership",
      description: "The leadership team guides academic planning, school culture, guardian coordination, and daily discipline.",
      icon: "BadgeCheck",
      members: [
        { id: "amraj-bhatt", name: "Amraj Bhatt", designation: "Principal", expertise: "School Leadership", officialRole: "Principal", image: "/images/staff/principal-AMRAJ-BHATT-SIR.webp" },
        { id: "vice-principal", name: "Vice Principal", designation: "Vice Principal", expertise: "Academic Coordination", officialRole: "Vice Principal", image: "/images/staff/vice-principal.jpg" },
        { id: "deep-zenith", name: "Deep Zenith", designation: "Exam Coordinator", expertise: "Examination Coordination", officialRole: "Exam Coordinator", image: "/images/staff/deep-zenith-exam-coordinator.jpg" },
      ],
    },
    {
      id: "teaching-faculty",
      title: "Teaching Faculty",
      description: "Teachers support students through classroom instruction, academic mentoring, activities, and regular guidance.",
      icon: "GraduationCap",
      members: [
        { id: "dipak-joshi", name: "Dipak Joshi", designation: "Teacher", officialRole: "Teaching Faculty", image: "/images/staff/dipak-joshi.jpg" },
        { id: "harendra-pant", name: "Harendra Pant", designation: "Teacher", officialRole: "Teaching Faculty", image: "/images/staff/harendra-pant.webp" },
        { id: "keshab-pant", name: "Keshab Pant", designation: "Teacher", officialRole: "Teaching Faculty", image: "/images/staff/keshab-pant.jpg" },
        { id: "lavdev-joshi", name: "Lavdev Joshi", designation: "Teacher", officialRole: "Teaching Faculty", image: "/images/staff/lavdev-joshi.jpg" },
        { id: "niranjana-rawal", name: "Niranjana Rawal", designation: "Teacher", officialRole: "Teaching Faculty", image: "/images/staff/niranjana-rawal.webp" },
        { id: "padama-pathak", name: "Padama Pathak", designation: "Teacher", officialRole: "Teaching Faculty", image: "/images/staff/padama-pathak.webp" },
        { id: "rewati-joshi-bhatt", name: "Rewati Joshi Bhatt", designation: "Teacher", officialRole: "Teaching Faculty", image: "/images/staff/rewati-joshi-bhatt.webp" },
        { id: "sabina-bhandari", name: "Sabina Bhandari", designation: "Teacher", officialRole: "Teaching Faculty", image: "/images/staff/sabina-bhandari.webp" },
        { id: "shila-acharya", name: "Shila Acharya", designation: "Teacher", officialRole: "Teaching Faculty", image: "/images/staff/shila-acharya.webp" },
        { id: "sunil-pandey", name: "Sunil Pandey", designation: "Teacher", officialRole: "Teaching Faculty", image: "/images/staff/sunil-pandey.png" },
        { id: "suresh-bhandari", name: "Suresh Bhandari", designation: "Teacher", officialRole: "Teaching Faculty", image: "/images/staff/suresh-bhandari.webp" },
      ],
    },
    {
      id: "administration-support",
      title: "Administration & Support",
      description: "The office and support team keep the school day organised, responsive, and welcoming for families.",
      icon: "Landmark",
      members: [
        { id: "jyoti-joshi", name: "Jyoti Joshi", designation: "Accountant", expertise: "Accounts", officialRole: "Accountant", image: "/images/staff/jyoti-joshi-accountant.webp" },
        { id: "janaki-saud", name: "Janaki Saud", designation: "Staff", officialRole: "School Staff", image: "/images/staff/janaki-saud.webp" },
      ],
    },
  ],
  secondaryDepartments: [
    { id: "leadership", title: "Academic Leadership", summary: "Academic leadership and examination coordination for senior students.", icon: "BadgeCheck", members: [
      { id: "amraj-bhatt-secondary", name: "Amraj Bhatt", expertise: "Principal", image: "/images/staff/principal-AMRAJ-BHATT-SIR.webp" },
      { id: "deep-zenith-secondary", name: "Deep Zenith", expertise: "Exam Coordinator", image: "/images/staff/deep-zenith-exam-coordinator.jpg" },
      { id: "vice-principal-secondary", name: "Vice Principal", expertise: "Academic Coordination", image: "/images/staff/vice-principal.jpg" },
      { id: "keshab-pant-coordinator", name: "Keshab Pant", expertise: "School Coordinator", image: "/images/staff/keshab-pant.jpg" },
    ] },
    { id: "faculty", title: "Secondary Faculty", summary: "Faculty members supporting classroom teaching, mentoring, and student progress.", icon: "GraduationCap", members: [
      { id: "dipak-joshi-secondary", name: "Dipak Joshi", expertise: "Teaching Faculty", image: "/images/staff/dipak-joshi.jpg" },
      { id: "harendra-pant-secondary", name: "Harendra Pant", expertise: "Teaching Faculty", image: "/images/staff/harendra-pant.webp" },
      { id: "keshab-pant-secondary", name: "Keshab Pant", expertise: "Teaching Faculty", image: "/images/staff/keshab-pant.jpg" },
      { id: "lavdev-joshi-secondary", name: "Lavdev Joshi", expertise: "Teaching Faculty", image: "/images/staff/lavdev-joshi.jpg" },
      { id: "niranjana-rawal-secondary", name: "Niranjana Rawal", expertise: "Teaching Faculty", image: "/images/staff/niranjana-rawal.webp" },
      { id: "sabina-bhandari-secondary", name: "Sabina Bhandari", expertise: "Teaching Faculty", image: "/images/staff/sabina-bhandari.webp" },
      { id: "sunil-pandey-secondary", name: "Sunil Pandey", expertise: "Teaching Faculty", image: "/images/staff/sunil-pandey.png" },
      { id: "suresh-bhandari-secondary", name: "Suresh Bhandari", expertise: "Teaching Faculty", image: "/images/staff/suresh-bhandari.webp" },
    ] },
  ],
};
export const defaultSiteContent: SiteContent = {
  site: {
    schoolName: "New Saraswati Vidya Mandir Secondary School",
    tagline: "Quality | Confidence | Character",
    location: "BDM-12, Airy, Kanchanpur",
    contact: "099-525169",
    email: "info@nsvm.edu.np",
    admissionCta: "Apply Now",
  },
  home: {
    heroTitle: "A disciplined school community for confident learners.",
    heroSubtitle:
      "New Saraswati Vidya Mandir combines academic focus, practical exposure, and student care in BDM-12, Airy, Kanchanpur.",
    highlights: [
      { label: "Established", value: "2060 B.S.", note: "Serving families since 2000 A.D." },
      { label: "Programs", value: "Montessori to XII", note: "Management at Grades XI–XII" },
      { label: "Focus", value: "Care", note: "Guided academics and co-curricular growth" },
    ],
  },
  gallery: highResolutionGalleryItems,
  notices: defaultNotices,
  faculty: defaultFacultyContent,
};

export function mergeContent(content?: Partial<SiteContent>): SiteContent {
  const isLegacyEmptySeed =
    !content?.faculty &&
    Array.isArray(content?.gallery) &&
    content.gallery.length === 0 &&
    Array.isArray(content?.notices) &&
    content.notices.length === 0;
  const rawGallery =
    Array.isArray(content?.gallery) && !isLegacyEmptySeed
      ? content.gallery
      : highResolutionGalleryItems;

  // A partially readable Supabase payload (for example, categories without
  // members because of a view/RLS permission issue) must not erase the working
  // local faculty directory. Only use a live collection when it includes at
  // least one member.
  const hasMembers = (groups: Array<{ members?: unknown[] }> | undefined): boolean =>
    Array.isArray(groups) && groups.some((group) => Array.isArray(group.members) && group.members.length > 0);

  const rawSchoolStaffCategories = hasMembers(content?.faculty?.schoolStaffCategories)
    ? content!.faculty!.schoolStaffCategories!
    : defaultFacultyContent.schoolStaffCategories;

  const rawSecondaryDepartments = hasMembers(content?.faculty?.secondaryDepartments)
    ? content!.faculty!.secondaryDepartments!
    : defaultFacultyContent.secondaryDepartments;

  return {
    ...defaultSiteContent,
    ...content,
    site: { ...defaultSiteContent.site, ...content?.site },
    home: { ...defaultSiteContent.home, ...content?.home },
    gallery: rawGallery.map((item) => ({
      ...item,
      src: getAssetUrl(item.src),
    })),
    notices:
      Array.isArray(content?.notices) && !isLegacyEmptySeed
        ? content.notices
        : defaultNotices,
    faculty: {
      schoolStaffCategories: rawSchoolStaffCategories.map((cat) => ({
        ...cat,
        members: cat.members.map((mem) => ({
          ...mem,
          image: getAssetUrl(mem.image),
        })),
      })),
      secondaryDepartments: rawSecondaryDepartments.map((dept) => ({
        ...dept,
        members: dept.members.map((mem) => ({
          ...mem,
          image: getAssetUrl(mem.image),
        })),
      })),
    },
  };
}

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadContent() {
      try {
        let loadedData: Partial<SiteContent> | null = null;

        // The application API is the authoritative content source. It provides
        // the complete file-backed directory locally and the server-managed
        // directory in production. Calling Supabase first can return only the
        // visible category headers when its staff views are restricted, which
        // incorrectly replaces the complete faculty list with empty groups.
        try {
          const response = await fetch("/api/content", { cache: "no-store" });
          if (response.ok) {
            const apiData = await response.json();
            if (apiData) loadedData = apiData;
          }
        } catch (apiErr) {
          console.warn("Local API content fetch error, checking Supabase fallback:", apiErr);
        }

        // Supabase is retained as a fallback for deployments without the app API.
        if (!loadedData && isSupabaseConfigured) {
          try {
            const sbData = await fetchFullSiteContentFromSupabase();
            if (sbData) {
              loadedData = sbData;
            }
          } catch (sbErr) {
            console.warn("Supabase load error, checking local fallback:", sbErr);
          }
        }

        // A final API retry covers temporary startup/network timing issues.
        if (!loadedData) {
          try {
            const response = await fetch("/api/content", { cache: "no-store" });
            if (response.ok) {
              const apiData = await response.json();
              if (apiData) loadedData = apiData;
            }
          } catch (apiErr) {
            console.warn("Local API content fetch error:", apiErr);
          }
        }

        if (alive && loadedData) {
          const merged = mergeContent(loadedData);
          setContent(merged);
          if (merged.gallery?.length) {
            ImagePreloadManager.registerImages(merged.gallery.map((g) => g.src));
          }
        }
      } catch (err) {
        if (alive) setContent(defaultSiteContent);
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    loadContent();

    return () => {
      alive = false;
    };
  }, []);

  return { content, isLoading };
}
