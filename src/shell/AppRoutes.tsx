import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/react";
import { LandingPage } from "../app/landing";
import { AboutPage } from "../app/about/page";
import { PrivacyPage } from "../app/privacy/page";
import {
  WorkspaceLayout,
  HomePage,
  ProductsLayout,
  ProductsPage,
  ConsignorsPage,
  ContractsPage,
} from "../app/app";
import { WritingPage } from "../app/writing";
import { WritingPostPage } from "../app/writing/components/post";
import { AuthPageLayout } from "./AuthPageLayout";
import { WritingSlugRedirect } from "./WritingSlugRedirect";

/** Only allow same-origin `/app` paths as post-login redirects (no open redirects). */
function safeAppReturnPath(from: unknown): string | undefined {
  if (typeof from !== "string" || !from.startsWith("/")) return undefined;
  if (from.startsWith("//")) return undefined;
  if (!from.startsWith("/app")) return undefined;
  return from;
}

function SignInRoute() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const fallbackRedirectUrl = safeAppReturnPath(from) ?? "/app";
  return (
    <AuthPageLayout>
      <SignIn fallbackRedirectUrl={fallbackRedirectUrl} signUpUrl="/sign-up" />
    </AuthPageLayout>
  );
}

function SignUpRoute() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const fallbackRedirectUrl = safeAppReturnPath(from) ?? "/app";
  return (
    <AuthPageLayout>
      <SignUp fallbackRedirectUrl={fallbackRedirectUrl} signInUrl="/sign-in" />
    </AuthPageLayout>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/blog" element={<WritingPage />} />
      <Route path="/blog/:slug" element={<WritingPostPage />} />
      <Route path="/writing" element={<Navigate to="/blog" replace />} />
      <Route path="/writing/:slug" element={<WritingSlugRedirect />} />
      <Route path="/app" element={<WorkspaceLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsLayout />}>
          <Route index element={<ProductsPage />} />
          <Route path=":listingId" element={<ProductsPage />} />
        </Route>
        <Route path="consignors" element={<ConsignorsPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="listings" element={<Navigate to="/app/products" replace />} />
      </Route>
      <Route path="/sign-in" element={<SignInRoute />} />
      <Route path="/sign-up" element={<SignUpRoute />} />
    </Routes>
  );
}