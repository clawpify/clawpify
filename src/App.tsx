import { Routes, Route, Link, useLocation } from "react-router-dom";
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
import { DashboardPage } from "./app/dashboard/page";
import { RadarPage } from "./app/radar/page";
import { ShieldPage } from "./app/shield/page";
import { SettingsPage } from "./app/settings/page";
import { OrgGate } from "./components/OrgGate";

export function App() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div
      className={
        isLanding ? "min-h-screen bg-white" : "min-h-screen p-6"
      }
    >
      {!isLanding && (
        <nav className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-600 pb-4">
          <Link to="/" className="text-blue-500 hover:underline">
            Home
          </Link>
          <Link to="/dashboard" className="text-blue-500 hover:underline">
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
              <OrganizationSwitcher afterCreateOrganizationUrl="/dashboard" />
              <UserButton />
            </div>
          </Show>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/sign-in"
          element={
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <SignIn fallbackRedirectUrl="/" signUpUrl="/sign-up" />
            </div>
          }
        />
        <Route
          path="/sign-up"
          element={
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <SignUp fallbackRedirectUrl="/" signInUrl="/sign-in" />
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