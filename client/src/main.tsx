import { createRoot } from "react-dom/client";
import "./index.css";

const rootElement = document.getElementById("root");

function showStartupError(error: unknown) {
  if (!rootElement) return;

  const message = error instanceof Error ? error.message : String(error);
  rootElement.replaceChildren();

  const panel = document.createElement("main");
  panel.style.cssText = "min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8fafc;color:#17221f;font-family:system-ui,sans-serif";
  panel.innerHTML = "<section style=\"max-width:640px;width:100%;padding:32px;border:1px solid #dbe5e1;border-radius:20px;background:#fff;box-shadow:0 12px 32px rgba(18,54,47,.1)\"><h1 style=\"margin:0 0 12px;font-size:24px\">Unable to start the website</h1><p style=\"margin:0 0 16px;color:#52615b\">The startup error is shown below so it can be fixed.</p><pre style=\"margin:0;white-space:pre-wrap;overflow-wrap:anywhere;padding:14px;border-radius:10px;background:#f1f5f3;color:#9f1239\"></pre></section>";
  panel.querySelector("pre")!.textContent = message;
  rootElement.appendChild(panel);
}

if (!rootElement) {
  throw new Error('The page is missing the "root" element.');
}

void import("./App")
  .then(({ default: App }) => {
    createRoot(rootElement).render(<App />);
  })
  .catch(showStartupError);
