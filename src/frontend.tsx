import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.tsx";

const elem = document.getElementById("root")!;

const app = (
  <StrictMode>
    {/* ClerkProvider auto-reads VITE_CLERK_PUBLISHABLE_KEY from env at runtime */}
    {/* @ts-expect-error - publishableKey is required by types but ClerkProvider reads from env when omitted */}
    <ClerkProvider afterSignOutUrl="/">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);

if (import.meta.hot) {
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app); 
} else {
  createRoot(elem).render(app);
}

