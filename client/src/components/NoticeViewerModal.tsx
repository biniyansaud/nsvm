import { useEffect, useState, useRef } from "react";
import {
  X,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  FileText,
  Calendar,
} from "lucide-react";

export interface NoticeDocument {
  id: number;
  title: string;
  category: string;
  date: string;
  refNo: string;
  publishedDate: string;
  content: {
    salutation?: string;
    introduction: string;
    body?: string;
    bulletPoints?: string[];
    instructionsTitle?: string;
    instructions?: string[];
    closing?: string;
    signatoryName: string;
    signatoryTitle: string;
    contactEmail?: string;
    attachmentUrl?: string;
    attachmentName?: string;
  };
}

const PERMANENT_SIGNATORY = {
  name: "Am Raj Bhatt",
  title: "Principal, NSVM",
  school: "New Saraswati Vidya Mandir Secondary School",
};

interface NoticeViewerModalProps {
  notice: NoticeDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NoticeViewerModal({
  notice,
  isOpen,
  onClose,
}: NoticeViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [isOpen]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 80));
  };

  const handlePrint = () => {
    if (!notice) return;

    const printContent = printRef.current?.innerHTML;
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${notice.title}</title>
              <style>
                body {
                  font-family: 'Plus Jakarta Sans', sans-serif;
                  padding: 40px;
                  color: #1e293b;
                  background: white;
                }
                .header {
                  text-align: center;
                  border-bottom: 2px solid #1e3a8a;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
                }
                .school-name {
                  font-size: 24px;
                  font-weight: bold;
                  color: #1e3a8a;
                  text-transform: uppercase;
                }
                .school-details {
                  font-size: 12px;
                  color: #1e293b;
                }
                .notice-title-box {
                  text-align: center;
                  margin: 20px 0;
                }
                .notice-title {
                  font-size: 18px;
                  font-weight: bold;
                  text-decoration: underline;
                  color: #1e3a8a;
                }
                .meta-info {
                  display: flex;
                  justify-content: space-between;
                  font-size: 13px;
                  margin-bottom: 25px;
                  font-weight: 500;
                }
                .content {
                  line-height: 1.6;
                  font-size: 14px;
                }
                .bullet-list {
                  margin: 15px 0;
                  padding-left: 20px;
                }
                .bullet-list li {
                  margin-bottom: 8px;
                }
                .signature-section {
                  margin-top: 50px;
                  border-top: 1px dashed #cbd5e1;
                  padding-top: 20px;
                }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (!isOpen || !notice) return null;

  return (
    <div
      className="notice-viewer-overlay fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-viewer-modal-title"
    >
      {/* Document Viewer Frame */}
      <div
        className="notice-viewer-frame w-full max-w-4xl bg-[#1B3A6B] rounded-none sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-[85vh] max-h-[100dvh] sm:max-h-[85vh] anim-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Toolbar */}
        <div className="notice-viewer-toolbar bg-[#142C52] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 border-b border-white/5 shrink-0 select-none">
          <div className="notice-viewer-title-wrap min-w-0 flex items-center gap-2.5 sm:gap-3 text-white">
            <FileText className="h-5 w-5 text-secondary shrink-0" aria-hidden="true" />
            <h3 id="notice-viewer-modal-title" className="notice-viewer-title font-display font-bold text-sm sm:text-base text-white truncate max-w-[calc(100vw-132px)] sm:max-w-md">
              {notice.title}
            </h3>
          </div>

          {/* Action Controls */}
          <div className="notice-viewer-actions shrink-0 flex items-center gap-1.5 sm:gap-3 text-white/90">
            {/* Zoom */}
            <div className="hidden sm:flex items-center bg-white/10 rounded-full px-2 py-1 border border-white/20">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-full transition focus-visible:ring-2 focus-visible:ring-white"
                title="Zoom Out"
                aria-label="Zoom Out Document"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs font-sans font-semibold px-2 min-w-[40px] text-center text-white" aria-live="polite">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-full transition focus-visible:ring-2 focus-visible:ring-white"
                title="Zoom In"
                aria-label="Zoom In Document"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="notice-viewer-icon-button notice-viewer-print-button p-2 hover:text-white hover:bg-white/20 rounded-full transition border border-white/20 bg-white/10 text-white focus-visible:ring-2 focus-visible:ring-white"
              title="Print Notice"
              aria-label="Print Notice"
            >
              <Printer className="h-4 w-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="notice-viewer-icon-button notice-viewer-close-button p-2 bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 hover:text-white rounded-full transition border border-rose-400/40 focus-visible:ring-2 focus-visible:ring-rose-300"
              title="Close Viewer"
              aria-label="Close Notice Viewer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Container containing the Paper Sheet */}
        <div className="notice-viewer-scroll flex-1 overflow-auto p-2.5 sm:p-6 md:p-8 flex justify-center bg-slate-900/40">
          {/* Paper Document (solid background enclosing all content) */}
          <div
            ref={printRef}
            className="notice-paper-sheet w-full bg-[#FAF6EE] text-slate-800 rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200/40 p-4 sm:p-10 md:p-12 transition-all duration-200 font-sans flex flex-col h-fit"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              maxWidth: "800px",
              width: zoom !== 100 ? `${10000 / zoom}%` : "100%",
            }}
          >
            {/* School Letterhead */}
            <div className="text-center border-b-2 border-primary/30 pb-4 sm:pb-6 mb-6 sm:mb-8 relative">
              <h2 className="font-display font-extrabold text-base sm:text-2xl md:text-3xl text-primary tracking-wide leading-snug">
                 New Saraswati Vidya Mandir
              </h2>
              <p className="text-xs sm:text-sm font-sans font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                BDM-12, Airy, Kanchanpur, Nepal
              </p>
              <p className="text-[10px] sm:text-xs font-sans text-slate-400 mt-0.5">
                Affiliated to NEB | Govt. Approved Community School
              </p>
              <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-24 h-[2px] bg-secondary" />
            </div>

            {/* Document Metadata (Ref No, Date) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 mb-6 sm:mb-8 pb-3 border-b border-slate-200/50">
              <div>
                <span className="text-slate-400 font-medium">Ref No:</span>{" "}
                {notice.refNo}
              </div>
              <div>
                <span className="text-slate-400 font-medium">Date:</span>{" "}
                {notice.date}
              </div>
            </div>

            {/* Document Subject */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="font-display font-bold text-sm sm:text-xl text-primary inline-block border-b-2 border-primary pb-1 uppercase tracking-wide leading-snug">
                SUBJECT: {notice.title}
              </h1>
            </div>

            {/* Document Content Body */}
            <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-700 font-sans">
              {notice.content.salutation && (
                <p className="font-bold text-slate-800">
                  {notice.content.salutation}
                </p>
              )}

              {(notice.content.body || notice.content.introduction)
                .split("\n")
                .filter((paragraph) => paragraph.trim())
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}

              {/* Bullet Points */}
              {notice.content.bulletPoints && notice.content.bulletPoints.length > 0 && (
                <ul className="list-disc pl-6 space-y-2.5 my-4 text-slate-700">
                  {notice.content.bulletPoints.map((point, idx) => (
                    <li key={idx} className="pl-1">
                      {point}
                    </li>
                  ))}
                </ul>
              )}

              {/* Special Instructions */}
              {notice.content.instructions && notice.content.instructions.length > 0 && (
                <div className="mt-6 p-4 sm:p-5 bg-slate-100 rounded-xl border border-slate-200/60">
                  <h4 className="font-bold text-primary mb-3 text-sm sm:text-base uppercase tracking-wider">
                    {notice.content.instructionsTitle || "Important Instructions:"}
                  </h4>
                  <ol className="list-decimal pl-5 space-y-2 text-slate-600 text-xs sm:text-sm">
                    {notice.content.instructions.map((inst, idx) => (
                      <li key={idx} className="pl-1">
                        {inst}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {notice.content.closing && (
                <p className="mt-6">{notice.content.closing}</p>
              )}

              {notice.content.attachmentUrl ? (
                <div className="mt-6 rounded-xl border border-primary/15 bg-white/60 p-4">
                  <a
                    href={notice.content.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary underline-offset-4 hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    {notice.content.attachmentName || "Open attached notice file"}
                  </a>
                </div>
              ) : null}
            </div>

            {/* Signature Section */}
            <div className="mt-14 pt-7 border-t border-slate-200/60 flex flex-col items-end text-right">
              <div className="w-72 max-w-full text-left">
                <div className="h-14 flex items-center justify-center text-[#c9d8e8] italic font-serif text-base font-semibold">
                  Official Stamp & Sign
                </div>
                <div className="border-t border-slate-400/80 w-full mb-3" />
                <h4 className="font-display font-black text-slate-800 text-base sm:text-lg tracking-[0.01em]">
                  {notice.content.signatoryName || PERMANENT_SIGNATORY.name}
                </h4>
                <p className="text-sm text-slate-600 font-medium mt-0.5">
                  {notice.content.signatoryTitle || PERMANENT_SIGNATORY.title}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {PERMANENT_SIGNATORY.school}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="notice-viewer-status bg-[#142C52] px-4 sm:px-6 py-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 shrink-0 select-none text-[11px] sm:text-xs text-white/50 font-sans">
          <div className="min-w-0 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span className="truncate">Published: {notice.publishedDate}</span>
          </div>
          <div className="uppercase font-bold tracking-wider text-secondary">
            {notice.category}
          </div>
        </div>
      </div>
    </div>
  );
}
