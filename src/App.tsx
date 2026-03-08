import { Routes, Route, Link } from "react-router-dom";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import "./index.css";

import { DashboardPage } from "./app/dashboard/page";
import { RadarPage } from "./app/radar/page";
import { ShieldPage } from "./app/shield/page";

function HomePage() {
  return (
    <div>
      <h1>Clawpify</h1>
      <p>Welcome. Use the nav to explore.</p>
    </div>
  );
}

export function App() {
  return (
    <div className="min-h-screen p-6">
      <nav className="mb-6 flex items-center gap-4 border-b pb-4">
        <Link to="/" className="text-blue-500 hover:underline">Home</Link>
        <Link to="/dashboard" className="text-blue-500 hover:underline">Dashboard</Link>
        <Link to="/radar" className="text-blue-500 hover:underline">Radar</Link>
        <Link to="/shield" className="text-blue-500 hover:underline">Shield</Link>
        <div className="ml-auto flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton />
            <SignUpButton />
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/radar" element={<RadarPage />} />
        <Route path="/shield" element={<ShieldPage />} />
      </Routes>
    </div>
  );
}

export default App;