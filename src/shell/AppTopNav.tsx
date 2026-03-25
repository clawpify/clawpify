import { Link } from "react-router-dom";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/react";

export function AppTopNav() {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-600 pb-4">
      <Link to="/" className="text-blue-500 hover:underline">
        Home
      </Link>
      <Link to="/app" className="text-blue-500 hover:underline">
        App
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
          <UserButton afterSignOutUrl="/" />
        </div>
      </Show>
    </nav>
  );
}
