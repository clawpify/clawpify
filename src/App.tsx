import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  SignIn,
  SignUp,
  OrganizationSwitcher,
} from "@clerk/react";
import "./index.css";

import { LandingPage } from "./app/landing";
import { AuditPage } from "./app/audit";
import { WebSearchInfo } from "./app/audit/components/WebSearchInfo";
import { AboutPage } from "./app/about/page";
import {
  WorkspaceLayout,
  HomePage,
  AgentsPage,
  StoresPage,
  ContentPage,
  SearchPage,
  ReportsPage,
  AiVisibilityPage,
} from "./app/app";
import { DashboardPage } from "./app/dashboard/page";
import { RadarPage } from "./app/radar/page";
import { ShieldPage } from "./app/shield/page";
import { SettingsPage } from "./app/settings/page";
import { OnboardingPage } from "./app/onboarding/page";
import { WritingPage } from "./app/writing";
import { WritingPostPage } from "./app/writing/post";
import { OrgGate } from "./components/OrgGate";
import { OnboardingGate } from "./components/OnboardingGate";

export function App() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const isAudit =
    location.pathname === "/audit" || location.pathname.startsWith("/audit/");
  const isAbout = location.pathname === "/about";
  const isWriting =
    location.pathname === "/blog" ||
    location.pathname.startsWith("/blog/") ||
    location.pathname === "/writing" ||
    location.pathname.startsWith("/writing/");
  const isAuthPage =
    location.pathname === "/sign-in" || location.pathname === "/sign-up";
  const isOnboarding = location.pathname === "/onboarding";
  const isWorkspace =
    location.pathname === "/app" || location.pathname.startsWith("/app/");
  const showNav =
    !isLanding && !isAudit && !isAbout && !isWriting && !isAuthPage && !isOnboarding && !isWorkspace;

  return (
    <div
      className={
        isLanding || isAudit || isAbout || isWriting || isAuthPage || isOnboarding || isWorkspace
          ? "min-h-screen bg-[#f2f3f1]"
          : "min-h-screen bg-[#f2f3f1] p-6"
      }
    >
      {showNav && (
        <nav className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-600 pb-4">
          <Link to="/" className="text-blue-500 hover:underline">
            Home
          </Link>
          <Link to="/app" className="text-blue-500 hover:underline">
            Dashboard
          </Link>
          <Link to="/radar" className="text-blue-500 hover:underline">
            Radar
          </Link>
          <Link to="/shield" className="text-blue-500 hover:underline">
            Shield
          </Link>
          <Link to="/settings" className="text-blue-500 hover:underline">
            Settings
          </Link>
          <Show when="signed-out">
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
              <SignInButton />
              <SignUpButton />
            </div>
          </Show>
          <Show when="signed-in">
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <OrganizationSwitcher afterCreateOrganizationUrl="/app" />
              <UserButton />
            </div>
          </Show>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<WritingPage />} />
        <Route path="/blog/:slug" element={<WritingPostPage />} />
        <Route path="/writing" element={<Navigate to="/blog" replace />} />
        <Route path="/writing/:slug" element={<Navigate to={`/blog/${location.pathname.split("/").pop() ?? ""}`} replace />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/audit/web-search" element={<WebSearchInfo />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/app"
          element={
            <OrgGate>
              <OnboardingGate>
                <WorkspaceLayout />
              </OnboardingGate>
            </OrgGate>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="ai-visibility" element={<AiVisibilityPage />} />
        </Route>
        <Route
          path="/sign-in"
          element={
            <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#f2f3f1] p-6">
              <Link
                to="/"
                className="absolute left-6 top-6 font-mono text-sm font-medium uppercase text-zinc-600 transition hover:text-zinc-900"
              >
                ← Back
              </Link>
              <SignIn
                fallbackRedirectUrl="/app"
                signUpUrl="/sign-up"
              />
            </div>
          }
        />
        <Route
          path="/sign-up"
          element={
            <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#f2f3f1] p-6">
              <Link
                to="/"
                className="absolute left-6 top-6 font-mono text-sm font-medium uppercase text-zinc-600 transition hover:text-zinc-900"
              >
                ← Back
              </Link>
              <SignUp
                fallbackRedirectUrl="/app"
                signInUrl="/sign-in"
              />
            </div>
          }
        />
        <Route
          path="/dashboard"
          element={
            <OrgGate>
              <DashboardPage />
            </OrgGate>
          }
        />
        <Route
          path="/radar"
          element={
            <OrgGate>
              <RadarPage />
            </OrgGate>
          }
        />
        <Route
          path="/shield"
          element={
            <OrgGate>
              <ShieldPage />
            </OrgGate>
          }
        />
        <Route
          path="/settings"
          element={
            <OrgGate>
              <SettingsPage />
            </OrgGate>
          }
        />
      </Routes>
    </div>
  );
}

export default App;