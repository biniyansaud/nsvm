import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import RouteProgress from "./RouteProgress";
import ScrollToTop from "./ui/ScrollToTop";
import { useReveal } from "@/hooks/useReveal";

export default function Layout({ children }: { children: ReactNode }) {
  // Global scroll-reveal: any element with .reveal / .reveal-up / .stagger etc.
  // becomes visible once it enters the viewport.
  useReveal();

  return (
    <div className="min-h-screen flex flex-col animate-fade-in duration-300">
      <RouteProgress />
      <Header />
      <main className="site-main flex-1">{children}</main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
