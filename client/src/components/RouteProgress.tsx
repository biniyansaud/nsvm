import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function RouteProgress() {
  const [location] = useLocation();
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRunning(true);
    const timer = window.setTimeout(() => setRunning(false), 380);
    return () => window.clearTimeout(timer);
  }, [location]);

  return (
    <div
      aria-hidden
      className={`route-progress ${running ? "is-running" : ""}`}
    />
  );
}
