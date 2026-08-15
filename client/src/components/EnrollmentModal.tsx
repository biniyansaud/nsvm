import { Calendar, MapPin, Phone, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SCHOOL } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";

import { isSupabaseConfigured } from "@/lib/supabase";
import { submitOnlineApplicationToSupabase } from "@/lib/supabaseApi";

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: string;
    title: string;
    grades: string;
  } | null;
}

export default function EnrollmentModal({
  isOpen,
  onClose,
  course,
}: EnrollmentModalProps) {
  const { t } = useLanguage();
  const [formData, setForm] = useState({
    parentName: "",
    phone: "",
    studentName: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !course) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parentName || !formData.phone || !formData.studentName) {
      toast.error(t("Please fill in all required fields."));
      return;
    }
    setSubmitting(true);
    try {
      if (isSupabaseConfigured) {
        await submitOnlineApplicationToSupabase({
          full_name: formData.studentName,
          parent_name: formData.parentName,
          phone: formData.phone,
          program: course.title,
          statement: formData.notes,
        });
      }
      toast.success(
        `Success! Enrollment inquiry for ${course.title} has been submitted. Our admissions desk will contact you soon.`
      );
      setForm({ parentName: "", phone: "", studentName: "", notes: "" });
      onClose();
    } catch (err) {
      toast.error("Failed to submit inquiry. Please try calling the school office directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-[#faf6ee] rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden border border-secondary/10 flex flex-col anim-fade-up">
        {/* Header */}
        <div
          className="relative pt-[10px] pb-3 px-5 text-white flex flex-col justify-between shrink-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-2.5 right-3 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-white/10 border border-white/20 text-white w-fit">
              <Sparkles className="h-2.5 w-2.5 text-secondary animate-pulse" />
              {t("Admission Inquiry")}
            </span>
            <h2
              className="font-display font-bold text-lg leading-tight tracking-tight text-white mt-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("Enroll in")} {t(course.title)}
            </h2>
            <p className="text-white/80 text-[11px] font-sans">
              {t("Target Level:")} {t(course.grades)} | {t("Code")}: {course.id}
            </p>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="p-4 flex-1 overflow-y-auto bg-[#faf6ee]">
          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            {/* Student Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
                {t("Student Name *")}
              </label>
              <input
                type="text"
                required
                value={formData.studentName}
                onChange={(e) =>
                  setForm({ ...formData, studentName: e.target.value })
                }
                placeholder="e.g., Aarav Bhatta"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-xs bg-slate-50/50"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Parent Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
                {t("Parent / Guardian Name *")}
                </label>
                <input
                  type="text"
                  required
                  value={formData.parentName}
                  onChange={(e) =>
                    setForm({ ...formData, parentName: e.target.value })
                  }
                  placeholder="e.g., Ramesh Bhatta"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-xs bg-slate-50/50"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
                {t("Contact Phone *")}
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setForm({ ...formData, phone: e.target.value })
                  }
                  placeholder="e.g., 98XXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-xs bg-slate-50/50"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
                {t("Additional Notes / Queries")}
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setForm({ ...formData, notes: e.target.value })
                }
                placeholder="Ask about school bus, hostel, fees, uniform, etc."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-xs bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-gold shine w-full justify-center py-3.5 text-xs font-bold rounded-xl mt-4"
            >
              {submitting ? (
                t("Submitting Application...")
              ) : (
                <>
                  {t("Submit Enrollment Inquiry")} <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Support info */}
          <div className="grid sm:grid-cols-2 gap-2.5 mt-4 text-xs text-slate-600 font-sans">
            <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-secondary shrink-0" />
              <div>
                <span className="block text-[9px] text-slate-400 font-bold uppercase">{t("Call Admissions")}</span>
                <a href={`tel:${SCHOOL.contact.replace(/\s/g, "")}`} className="text-primary font-bold hover:underline">
                  {SCHOOL.contact}
                </a>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-secondary shrink-0" />
              <div>
                <span className="block text-[9px] text-slate-400 font-bold uppercase">{t("Campus Visit")}</span>
                <span className="text-primary font-bold">{t("MNR, Kanchanpur")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
