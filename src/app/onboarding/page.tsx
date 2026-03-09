import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/react";

export function OnboardingPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ firstName, lastName }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      await user?.reload();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="text-zinc-500">Loading...</span>
      </div>
    );
  }

  const metadata = user.publicMetadata as { onboardingComplete?: boolean };
  if (metadata?.onboardingComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <Link
        to="/"
        className="absolute left-6 top-6 text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
      >
        ← Back
      </Link>

      <div className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900">
          Let&apos;s get to know you
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label
              htmlFor="firstName"
              className="mb-1 block text-sm font-medium text-zinc-900"
            >
              First name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-1 block text-sm font-medium text-zinc-900"
            >
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter your last name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-900">
              Email
            </label>
            <input
              type="email"
              value={user.primaryEmailAddress?.emailAddress ?? ""}
              readOnly
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
