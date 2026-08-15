import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Sparkles,
} from "lucide-react";
import { ASSETS, SCHOOL } from "@/const";
import SEO from "@/components/SEO";
import { toast } from "sonner";

export default function Contact() {
  const [formData, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Thank you! Your message has been sent successfully. Our team will get back to you within 24 hours.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    }, 1000);
  };

  return (
    <>
      <SEO
        title="Contact Us & School Location — BDM-12, Airy, Kanchanpur"
        description="Contact New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM) in BDM-12 Airy, Kanchanpur, Nepal. Phone: +977-099-525169, Email: info@nsvm.edu.np. Google Maps directions & admissions inquiry."
        keywords="Contact New Saraswati, newsaraswati, newsaraswatividyamandir, New Saraswati Vidya Mandir Location, NSVM Kanchanpur Phone, New Saraswati School Address Airy Kanchanpur, New Saraswati Contact"
        canonical="/contact"
        pageType="ContactPage"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Contact Us", path: "/contact" },
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
            Contact Office · BDM-12, Airy, Kanchanpur
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
            Get in <span className="text-shimmer" style={{ backgroundSize: "200% 100%" }}>Touch</span>
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
            Whether you have questions about admissions, programs, or campus life — our team is here to help.
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

      {/* Main Content split like reference */}
      <section className="container py-20 md:py-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Contact Details (Visit, Call, Email, Office Hours) */}
          <div className="lg:col-span-5 space-y-10 reveal-left">
            <div>
              <span className="text-xs font-bold text-secondary tracking-widest uppercase block mb-2">
                Contact Information
              </span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-primary leading-tight">
                How to reach us
              </h2>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                Multiple ways to connect with New Saraswati Vidya Mandir.
              </p>
            </div>

            {/* Information Cards Stack */}
            <div className="space-y-5">
              {/* Visit Us */}
              <div className="soft-card p-6 flex gap-5 items-start hover-lift border border-slate-100/80">
                <div className="p-3 bg-primary/5 rounded-xl text-secondary border border-secondary/10 shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-primary text-base">Visit Us</h4>
                  <p className="text-slate-500 text-sm mt-1.5 leading-relaxed font-sans">
                    BDM-12, Airy, Kanchanpur<br />
                    Sudurpashchim Province, Nepal
                  </p>
                </div>
              </div>

              {/* Call Us */}
              <div className="soft-card p-6 flex gap-5 items-start hover-lift border border-slate-100/80">
                <div className="p-3 bg-primary/5 rounded-xl text-secondary border border-secondary/10 shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-primary text-base">Call Us</h4>
                  <p className="text-slate-500 text-sm mt-1.5 leading-relaxed font-sans font-semibold">
                    <a href={`tel:${SCHOOL.contact.replace(/\s/g, "")}`} className="text-secondary hover:text-primary transition-colors block">
                      {SCHOOL.contact}
                    </a>
                    <span className="text-slate-400 text-xs font-medium block mt-0.5">Administration Office Desk</span>
                  </p>
                </div>
              </div>

              {/* Email Us */}
              <div className="soft-card p-6 flex gap-5 items-start hover-lift border border-slate-100/80">
                <div className="p-3 bg-primary/5 rounded-xl text-secondary border border-secondary/10 shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-primary text-base">Email Us</h4>
                  <p className="text-slate-500 text-sm mt-1.5 leading-relaxed font-sans font-semibold">
                    <a href={`mailto:${SCHOOL.email}`} className="text-secondary hover:text-primary transition-colors block">
                      {SCHOOL.email}
                    </a>
                    <span className="text-slate-400 text-xs font-medium block mt-0.5">nsvm.edu.np</span>
                  </p>
                </div>
              </div>

              {/* Office Hours */}
              <div className="soft-card p-6 flex gap-5 items-start hover-lift border border-slate-100/80">
                <div className="p-3 bg-primary/5 rounded-xl text-secondary border border-secondary/10 shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-primary text-base">Office Hours</h4>
                  <p className="text-slate-500 text-sm mt-1.5 leading-relaxed font-sans">
                    Sun – Fri: 10:00 AM – 4:00 PM<br />
                    <span className="text-rose-500 font-bold">Saturday: Closed</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="soft-card p-5 sm:p-10 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-gold" />

              <div className="mb-8">
                <span className="text-xs font-bold text-secondary tracking-widest uppercase block mb-2">
                  Send a Message
                </span>
                <h3 className="font-display font-bold text-2xl sm:text-3xl text-primary">
                  Have a question?
                </h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  Fill out the form and our team will get back to you within 24 hours. For urgent matters, please call us directly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setForm({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setForm({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setForm({ ...formData, phone: e.target.value })}
                      placeholder="+977-98XXXXXXXX"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50"
                    />
                  </div>

                  {/* Subject Dropdown */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                      Subject *
                    </label>
                    <select
                      required
                      value={formData.subject}
                      onChange={(e) => setForm({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50 cursor-pointer appearance-none"
                    >
                      <option value="" disabled>Select subject</option>
                      <option value="Admission Inquiry">Admission Inquiry</option>
                      <option value="Academic Information">Academic Information</option>
                      <option value="Fees & Scholarships">Fees & Scholarships</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Complaint / Feedback">Complaint / Feedback</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setForm({ ...formData, message: e.target.value })}
                    placeholder="Type your message here..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full justify-center py-3.5 rounded-xl shadow-md shadow-secondary/10 hover:shadow-lg transition duration-300 font-bold"
                >
                  {loading ? (
                    "Sending Message..."
                  ) : (
                    <>
                      Send Message <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Map Location Section */}
        <div className="mt-20 md:mt-28">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold text-secondary tracking-widest uppercase block mb-2">
              Find Us
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-primary leading-tight">
              Our Location
            </h2>
            <p className="text-slate-500 text-sm mt-3 leading-relaxed">
              New Saraswati Vidya Mandir is located in BDM-12, Airy, Kanchanpur, Nepal.
            </p>
          </div>

          {/* Map Frame */}
          <div className="soft-card p-1.5 sm:p-2 border border-slate-100 overflow-hidden h-[300px] sm:h-[450px] rounded-2xl sm:rounded-3xl shadow-xl hover-lift">
            <iframe
              title="New Saraswati Vidya Mandir Map"
              src={SCHOOL.mapEmbed}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-2xl"
            />
          </div>
        </div>
      </section>
    </>
  );
}
