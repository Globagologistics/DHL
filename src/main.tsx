
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);

  // Register service worker only in production (avoid dev interference)
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Respect Vite base URL so the service worker path is correct on GitHub Pages
      const swPath = `${import.meta.env.BASE_URL}sw.js`;
      navigator.serviceWorker.register(swPath).then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }).catch((err) => {
        console.warn('ServiceWorker registration failed: ', err);
      });
    });
  }
  