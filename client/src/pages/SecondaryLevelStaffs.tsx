import { ASSETS, SCHOOL } from "@/const";
import { Atom, BadgeCheck, BookOpen, Calculator, FlaskConical, GraduationCap, Leaf, Sparkles } from "lucide-react";
import { useSiteContent } from "@/lib/siteContent";
import SEO from "@/components/SEO";
import ImageWithSkeleton from "@/components/ImageWithSkeleton";

type SecondaryStaff = {
  name: string;
  expertise: string;
  image: string;
};

const departmentIconMap = {
  Atom,
  BadgeCheck,
  BookOpen,
  Calculator,
  FlaskConical,
  GraduationCap,
  Leaf,
};

function FacultyPortrait({ member }: { member: SecondaryStaff }) {
  return (
    <div className="relative bg-[linear-gradient(180deg,#f8fafc_0%,#edf2f7_100%)] p-3 sm:p-4">
      <div className="aspect-[4/3.35] w-full overflow-hidden rounded-md border border-white shadow-sm">
        <ImageWithSkeleton
          src={member.image || SCHOOL.logo}
          alt={member.name}
          aspectRatio="none"
          containerClassName="h-full w-full"
          className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
          loading="lazy"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 250px"
          onError={(event) => {
            event.currentTarget.src = SCHOOL.logo;
            event.currentTarget.className = "h-full w-full object-contain bg-white p-8";
          }}
        />
      </div>
    </div>
  );
}

export default function SecondaryLevelStaffs() {
  const { content } = useSiteContent();
  const departments = content.faculty.secondaryDepartments;
  const totalStaff = departments.reduce((sum, department) => sum + department.members.length, 0);

  return (
    <>
      <SEO
        title="Secondary & +2 Management Faculty Department"
        description="Meet the secondary level and +2 Management subject department lecturers at New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM), Kanchanpur."
        keywords="New Saraswati Secondary Faculty, newsaraswati, newsaraswatividyamandir, New Saraswati +2 Teachers, NSVM Management Teachers, Secondary School Faculty Kanchanpur"
        canonical="/secondary-staffs"
        pageType="CollectionPage"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Secondary Level Staffs", path: "/secondary-staffs" },
        ]}
      />
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0" style={{ background: "var(--gradient-primary)" }} />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${ASSETS.hero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.22,
            mixBlendMode: "overlay",
          }}
        />
        <div className="container relative z-10 py-20 text-center sm:py-24 md:py-32">
          <span className="eyebrow-pill anim-fade-up">
            <Sparkles className="h-3 w-3 text-secondary" />
            FACULTY
          </span>
          <h1
            className="mt-6 font-display font-extrabold text-white anim-fade-up"
            style={{ fontSize: "clamp(2.1rem, 1.4rem + 3.4vw, 4.4rem)", lineHeight: 1.06 }}
          >
            Secondary Level Staffs
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-white/86 anim-fade-up leading-8">
            Department-wise +2 faculty of {SCHOOL.shortName}, with expertise and real staff images from the official New Saraswatisite.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <span className="eyebrow-pill">
                <BadgeCheck className="h-3 w-3 text-secondary" />
                {totalStaff} Faculty Members
              </span>
              <h2 className="section-title mt-5">Department-Wise Faculty</h2>
              <p className="mt-6 max-w-2xl leading-8 text-[var(--muted-foreground)]">
                New Saraswati Vidya Mandir's secondary level faculty is organised by academic department so students can quickly find the right subject experts.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {departments.slice(0, 3).map((department) => {
                const Icon = departmentIconMap[department.icon as keyof typeof departmentIconMap] || GraduationCap;
                return (
                  <div key={department.title} className="soft-card p-5 hover-lift">
                    <Icon className="h-8 w-8 text-primary" />
                    <p className="mt-3 text-2xl font-black text-[var(--color-navy)]">{department.members.length}</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                      {department.title.replace("Department of ", "")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-14 space-y-12">
            {departments.map((department) => {
              const Icon = departmentIconMap[department.icon as keyof typeof departmentIconMap] || GraduationCap;
              return (
                <section key={department.title}>
                  <div className="mb-6 border-b border-slate-200 pb-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-secondary">
                          {department.members.length} Staffs
                        </p>
                        <h3 className="font-display text-2xl font-black text-[var(--color-navy)] sm:text-3xl">
                          {department.title}
                        </h3>
                      </div>
                    </div>
                    <p className="mt-4 max-w-3xl leading-7 text-[var(--muted-foreground)]">{department.summary}</p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {department.members.map((member) => (
                      <article key={`${department.title}-${member.name}`} className="soft-card group flex h-full flex-col overflow-hidden border border-slate-100 hover-lift">
                        <FacultyPortrait member={member} />
                        <div className="flex flex-1 flex-col p-5">
                          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-primary">
                            {department.title.replace("Department of ", "")}
                          </span>
                          <h4 className="mt-4 font-display text-xl font-bold leading-tight text-[var(--color-navy)]">{member.name}</h4>
                          <div className="mt-auto pt-4">
                            <div className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3">
                              <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">Expertise</p>
                              <p className="mt-1 text-sm font-bold leading-6 text-[var(--color-navy)]">{member.expertise}</p>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
