import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SEOManager from "./components/SEOManager";
import { ImagePreloadManager } from "@/lib/imagePreloadManager";

// Lazy-loaded routes for code splitting & faster initial bundle size
const About = lazy(() => import("./pages/About"));
const Admin = lazy(() => import("./pages/Admin"));
const Contact = lazy(() => import("./pages/Contact"));
const Courses = lazy(() => import("./pages/Courses"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Notices = lazy(() => import("./pages/Notices"));
const Apply = lazy(() => import("./pages/Apply"));
const SchoolStaffs = lazy(() => import("./pages/SchoolStaffs"));
const SecondaryLevelStaffs = lazy(() => import("./pages/SecondaryLevelStaffs"));
const VirtualTour = lazy(() => import("./pages/VirtualTour"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);
  return null;
}

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-50/50">
      <div className="w-10 h-10 border-3 border-teal-200 border-t-teal-700 rounded-full animate-spin mb-4" />
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 animate-pulse">
        Loading New Saraswati...
      </span>
    </div>
  );
}

function Router() {
  const [location] = useLocation();

  useEffect(() => {
    ImagePreloadManager.preloadRouteAssets(location);
  }, [location]);

  if (location === "/admin") {
    return (
      <Suspense fallback={<PageFallback />}>
        <SEOManager />
        <ScrollToTop />
        <Admin />
      </Suspense>
    );
  }

  return (
    <Layout>
      <SEOManager />
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/about"} component={About} />
          <Route path={"/courses"} component={Courses} />
          <Route path={"/gallery"} component={Gallery} />
          <Route path={"/notices"} component={Notices} />
          <Route path={"/contact"} component={Contact} />
          <Route path={"/apply"} component={Apply} />
          <Route path={"/secondary-level-staffs"} component={SecondaryLevelStaffs} />
          <Route path={"/2-staffs"} component={SecondaryLevelStaffs} />
          <Route path={"/school-staffs"} component={SchoolStaffs} />
          <Route path={"/faculty/school-staffs"} component={SchoolStaffs} />
          <Route path={"/tour"} component={VirtualTour} />
          <Route path={"/virtual-tour"} component={VirtualTour} />
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    ImagePreloadManager.init();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "var(--color-paper)",
                  color: "var(--color-ink)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  fontFamily: "var(--font-sans)",
                },
              }}
            />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
