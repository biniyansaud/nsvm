import { useState, useEffect } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Bookmark,
  Calendar,
  FileText,
  Megaphone,
  Phone,
  Sparkles,
} from "lucide-react";
import { ASSETS, SCHOOL } from "@/const";
import NoticeViewerModal, { NoticeDocument } from "@/components/NoticeViewerModal";
import SEO from "@/components/SEO";
import { useSiteContent } from "@/lib/siteContent";
import { toast } from "sonner";

const BOOKMARKS_STORAGE_KEY = "nsvm_saved_notices";

export default function Notices() {
  const [filter, setFilter] = useState<"all" | "notice" | "exam" | "event">("all");
  const [selectedNotice, setSelectedNotice] = useState<NoticeDocument | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const { content } = useSiteContent();

  const handleBookmarkToggle = (e: React.MouseEvent, notice: NoticeDocument) => {
    e.stopPropagation();
    const noticeIdStr = String(notice.id);
    setBookmarkedIds((prev) => {
      let updated: string[];
      if (prev.includes(noticeIdStr)) {
        updated = prev.filter((id) => id !== noticeIdStr);
        toast.info("Notice removed from saved items.");
      } else {
        updated = [...prev, noticeIdStr];
        toast.success(`Saved "${notice.title.slice(0, 30)}..." to your device.`);
      }
      try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn("Error saving bookmarks to localStorage:", err);
      }
      return updated;
    });
  };

  // High-fidelity structured notice documents matching the reference design
  const fallbackNotices: NoticeDocument[] = [
    {
      id: 1,
      title: "Admission open for academic session 2082 BS",
      category: "notice",
      date: "2082-04-12",
      refNo: "SBSS/ADM/2082/001",
      publishedDate: "Baishakh 12, 2082 BS",
      content: {
        salutation: "To all Parents, Guardians, and Aspiring Students,",
        introduction: "New Saraswati Vidya Mandir Secondary School is pleased to announce that online and physical admission registration for the upcoming academic session 2082 B.S. is open. We offer quality education from Montessori to Grade X, with NEB Management at Grades XI and XII.",
        bulletPoints: [
          "Montessori & Primary (Grades 1-5): Foundational cognitive skills, language literacy, and arts.",
          "Lower Secondary (Grades 6-8): Computer science, physical sciences, and local social studies.",
          "Secondary School (Grades 9-10): Government approved curriculum for the SEE Board Track.",
          "Management Stream (Grades XI-XII): Accounting, economics, business studies, and computer science.",
        ],
        instructionsTitle: "Admission Procedure & Documents Required:",
        instructions: [
          "Collect the official Admission Form from the school administration desk or submit an inquiry online.",
          "Submit the filled form along with a copy of the student's Birth Certificate and two passport-sized photos.",
          "Provide the original Transfer Certificate (TC) and previous school's character certificate (Grades 2-10).",
          "Entrance evaluation exams will be held on a rolling basis every Friday at 10:00 AM.",
        ],
        closing: "For further details regarding fee structures and scholarships, please visit the administration block or contact the admission cell directly.",
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
        introduction: "This is to inform everyone concerned that the First-Term Examination for the Academic Session 2082 B.S. has been scheduled to commence from Ashad 15, 2082. All examinations will be conducted in the morning shift to avoid the afternoon monsoon heat.",
        bulletPoints: [
          "Grades 1 to 5 (Primary): 7:30 AM to 9:30 AM (Oral evaluations and basic written tests).",
          "Grades 6 to 8 (Lower Secondary): 7:30 AM to 10:00 AM (Written exams).",
          "Grades 9 to 10 (Secondary SEE): 7:30 AM to 10:30 AM (Full board-standard examinations).",
          "+2 Science and Management (NEB): 7:00 AM to 10:00 AM (Comprehensive terminal papers).",
        ],
        instructionsTitle: "Crucial Exam Guidelines & Instructions:",
        instructions: [
          "All students must collect their official Admit Cards from their respective class teachers by Ashad 12.",
          "Students must arrive at the examination hall at least 20 minutes before the scheduled time.",
          "Bringing mobile phones, smartwatches, or any unauthorized paper slips is strictly prohibited.",
          "Parents are highly encouraged to support their children's revision schedules at home.",
        ],
        closing: "Regular classes will remain suspended during the examination period. Normal schedule resumes on Ashad 25.",
        signatoryName: "Harish Prasad Bhatta",
        signatoryTitle: "Examination Committee Chairperson",
      },
    },
    {
      id: 3,
      title: "Annual cultural programme — New SaraswatiAnnual Programme",
      category: "event",
      date: "2082-03-05",
      refNo: "SBSS/EVE/2082/012",
      publishedDate: "Ashad 05, 2082 BS",
      content: {
        salutation: "To the Entire BDM-12, Airy, Kanchanpur Community, Guardians, and Well-wishers,",
        introduction: "We are thrilled to invite guardians and well-wishers to the New Saraswati Annual Programme 2082. This event showcases the diverse cultural heritage, artistic talents, and creative expressions of students through dance, drama, poetry, quiz, debate, and scientific exhibitions.",
        bulletPoints: [
          "Traditional Dance Performances: Showcasing Tharu, Deuda, and local folk dance forms.",
          "Drama & Skits: Thought-provoking plays on social awareness and environmental conservation.",
          "Science & Arts Exhibition: Interactive models and canvas paintings created by junior and senior houses.",
          "Food & Craft Stalls: Managed entirely by our secondary level students to build entrepreneurship.",
        ],
        instructionsTitle: "Event Details & Security Protocol:",
        instructions: [
          "Date & Time: Ashad 20, 2082, starting from 11:00 AM onwards at the main school ground.",
          "Entry is free for all parents, guardians, and local residents holding an official school invitation card.",
          "Please park your vehicles in the designated area near the outer gate to ensure a smooth flow of traffic.",
          "All guests are requested to be seated by 10:45 AM to welcome the chief guest.",
        ],
        closing: "Let us come together to support and encourage our children's creative achievements. We look forward to seeing you!",
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
        salutation: "To all Students, House Captains, and Physical Instructors,",
        introduction: "Following three days of intense competition, outstanding sportsmanship, and raw athletic display, the Annual Inter-House Athletics Meet 2082 has concluded. We extend our heartiest congratulations to all participants who gave their absolute best on the field.",
        bulletPoints: [
          "Overall Champion Trophy: New SaraswatiHouse (Blue House) with a total of 142 points.",
          "Runner-Up Trophy: Laliguras House (Red House) with a total of 128 points.",
          "Best Male Athlete: Master Rohan Chaudhary (Class 10) - 3 Gold Medals (100m, 200m, Long Jump).",
          "Best Female Athlete: Miss Aarati Joshi (Class 9) - 2 Gold Medals, 1 Silver (400m, High Jump, Shot Put).",
        ],
        instructionsTitle: "Post-Sports Meet Directives:",
        instructions: [
          "House captains must return all athletic gear, flags, and bibs to the PE storeroom by Friday afternoon.",
          "A special assembly will be held on Monday at 8:00 AM to distribute medals, certificates, and trophies.",
          "We express sincere gratitude to the local sports club and referees for their fair play supervision.",
        ],
        closing: "Keep practicing, stay active, and remember that sportsmanship is the ultimate victory!",
        signatoryName: "Ramesh Bahadur Rawal",
        signatoryTitle: "Sports Department In-Charge",
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
        salutation: "To all Faculty Members, Administrative Staff, and Students,",
        introduction: "This is to officially inform you that New Saraswati Vidya Mandir will remain closed on May 1 (Baishakh 18) on the auspicious occasion of International Workers' Day (Majdoor Divas / Labor Day).",
        bulletPoints: [
          "There will be no physical or online classes conducted on this day.",
          "The administrative and admission inquiry office will also remain closed.",
          "All scheduled unit tests or assignments are postponed and will be rescheduled by class teachers.",
        ],
        instructionsTitle: "Important Guidelines for Teachers & Students:",
        instructions: [
          "Students are advised to use this mid-week holiday to complete their ongoing science journals and project works.",
          "Classes will resume as per the regular timetable on Baishakh 19, 2082, at 10:00 AM sharp.",
          "Transport services will operate on their standard morning and afternoon routes from tomorrow.",
        ],
        closing: "We wish all our dedicated staff and teachers a peaceful and happy Workers' Day!",
        signatoryName: "Am Raj Bhatt",
        signatoryTitle: "Principal",
      },
    },
  ];

  const notices = content.notices;

  const filteredNotices = notices.filter(
    (n) => filter === "all" || n.category === filter
  );

  const categoryCards = [
    {
      title: "General",
      copy: "School-wide announcements and circulars",
      icon: Megaphone,
      filter: "notice" as const,
    },
    {
      title: "Examinations",
      copy: "Schedules, routines, and result updates",
      icon: Calendar,
      filter: "exam" as const,
    },
    {
      title: "Academic",
      copy: "Admissions, courses, and registration",
      icon: BookOpen,
      filter: "notice" as const,
    },
    {
      title: "Events",
      copy: "Programs, sports, and celebrations",
      icon: Bell,
      filter: "event" as const,
    },
  ];

  const handleOpenNotice = (notice: NoticeDocument) => {
    setSelectedNotice(notice);
    setIsModalOpen(true);
  };

  return (
    <>
      <SEO
        title="Official Notices & Announcements — Exams, Holidays & Events"
        description="Stay updated with official school notices, exam routines, vacation notices, event schedules, and announcements from New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM), Kanchanpur."
        keywords="New Saraswati Notices, newsaraswati, newsaraswatividyamandir, New Saraswati Vidya Mandir Exam Routine, NSVM Notices Kanchanpur, School Announcements BDM-12 Airy"
        canonical="/notices"
        pageType="CollectionPage"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Notices & Circulars", path: "/notices" },
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
            backgroundImage: `url(${ASSETS.hero})`,
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
            <Sparkles className="h-3 w-3 text-secondary animate-pulse" />
            Official Bulletins
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
            Notice <span className="text-shimmer" style={{ backgroundSize: "200% 100%" }}>Board</span>
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
            Stay updated with official school announcements, holiday circulars,
            examination routines, and cultural event details straight from our administrative office.
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

      {/* Notice Categories */}
      <section className="notice-categories-section">
        <div className="container">
          <div className="notice-category-grid">
            {categoryCards.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setFilter(item.filter)}
                  className="notice-category-card"
                >
                  <span className="notice-category-icon">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="notice-category-title">{item.title}</span>
                  <span className="notice-category-copy">{item.copy}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Notice Board Section */}
      <section className="notice-updates-section">
        <div className="container">
          <div className="notice-section-heading">
            <span className="notice-kicker">Latest Updates</span>
            <h2>
              All <em>Announcements</em>
            </h2>
            <p>
              Filter by category to find relevant notices, or browse all recent
              announcements below.
            </p>
          </div>

          <div className="notice-filter-row" aria-label="Notice filters">
            <button onClick={() => setFilter("all")} data-active={filter === "all"} className="notice-filter-pill">
              All Notices
            </button>
            <button onClick={() => setFilter("exam")} data-active={filter === "exam"} className="notice-filter-pill">
              Exams
            </button>
            <button onClick={() => setFilter("notice")} data-active={filter === "notice"} className="notice-filter-pill">
              General
            </button>
            <button onClick={() => setFilter("event")} data-active={filter === "event"} className="notice-filter-pill">
              Events
            </button>
          </div>

          <div className="notice-list-grid">
            {filteredNotices.length > 0 ? (
              filteredNotices.map((n) => {
                const [year, monthNum, dayStr] = n.date.split("-");
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const monthName = monthNames[parseInt(monthNum) - 1] || "Baishakh";

                return (
                  <article
                    key={n.id}
                    onClick={() => handleOpenNotice(n)}
                    className="notice-card notice-board-card group"
                  >
                    <div className="notice-card-topline">
                      <div className="notice-date notice-page-date shrink-0 select-none">
                        <span className="d-day">{dayStr}</span>
                        <span className="d-month">{monthName}</span>
                        <span className="notice-year">{year} BS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="notice-tag">{n.category}</span>
                        <button
                          type="button"
                          onClick={(e) => handleBookmarkToggle(e, n)}
                          title={bookmarkedIds.includes(String(n.id)) ? "Remove Bookmark" : "Save Notice"}
                          className={`p-1.5 rounded-lg border transition ${
                            bookmarkedIds.includes(String(n.id))
                              ? "bg-amber-100 border-amber-300 text-amber-700"
                              : "bg-slate-100/80 border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                          }`}
                        >
                          <Bookmark className={`h-4 w-4 ${bookmarkedIds.includes(String(n.id)) ? "fill-amber-600" : ""}`} />
                        </button>
                      </div>
                    </div>

                    <div className="notice-card-content">
                      <h3>{n.title}</h3>
                      <p>{n.content.introduction}</p>
                    </div>

                    <div className="notice-card-footer">
                      <span className="notice-ref">
                        <FileText className="h-4 w-4" />
                        {n.refNo}
                      </span>
                      <span className="notice-open-button" aria-hidden="true">
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="notice-empty-state">
                <Megaphone className="h-10 w-10" />
                <p>No announcements available in this category. Check back soon.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="notice-support-section">
        <div className="notice-support-bg" aria-hidden />
        <div className="container relative z-10">
          <div className="notice-support-heading">
            <span className="notice-kicker">Need Help?</span>
            <h2>Contact the relevant department directly.</h2>
          </div>

          <div className="notice-support-grid">
            <a href={`tel:${SCHOOL.contact.replace(/\s/g, "")}`} className="notice-support-card">
              <span><Phone className="h-5 w-5" /></span>
              <strong>School Office</strong>
              <small>{SCHOOL.contact}</small>
            </a>
            <a href={`mailto:${SCHOOL.email}`} className="notice-support-card">
              <span><FileText className="h-5 w-5" /></span>
              <strong>Administration</strong>
              <small>{SCHOOL.email}</small>
            </a>
          </div>
        </div>
      </section>

      {/* High-Fidelity Paper Document Notice Viewer Modal */}
      <NoticeViewerModal
        notice={selectedNotice}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNotice(null);
        }}
      />
    </>
  );
}
