import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.tsx";
import { ClerkShell } from "./ClerkShell.tsx";
import { ToastProvider } from "./lib/toast.tsx";
import "./lib/chartConfig";

const elem = document.getElementById("root")!;

const app = (
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <ClerkShell>
          <App />
        </ClerkShell>
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>
);

if (import.meta.hot) {
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  createRoot(elem).render(app);
}
