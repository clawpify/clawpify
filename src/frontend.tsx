import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.tsx";
import { clerkAppearance } from "./lib/clerk-appearance.ts";

const elem = document.getElementById("root")!;
const pk = process.env.BUN_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

const app = (
  <StrictMode>
    <ClerkProvider
      publishableKey={pk}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      appearance={clerkAppearance}
    >
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
