import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force landscape orientation when supported
try {
  const orientation = screen.orientation as any;
  if (orientation?.lock) {
    orientation.lock('landscape').catch(() => {});
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
