import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthenticatedFetch } from "../../../../lib/api";
import { copy } from "../../utils/copy";

type AgentActivity = {
  id: string;
  org_id: string;
  store_id: string | null;
  agent_name: string;
  action_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

const AVAILABLE_AGENTS = [
  {
    id: "citation-auditor",
    name: copy.agents.citationAuditor,
    desc: copy.agents.citationAuditorDesc,
    href: "/audit",
  },
];

export function AgentsContent() {
  const fetchAuth = useAuthenticatedFetch();
  const [activity, setActivity] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAuth("/api/agent-activity");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load activity");
        if (!cancelled) {
          setActivity(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) setActivity([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAuth]);

  const formatDate = (s: string) => {
    const d = new Date(s);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex-1 overflow-auto px-6 py-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">
            {copy.agents.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{copy.agents.desc}</p>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">
            {copy.agents.availableAgents}
          </h2>
          <ul className="mt-3 space-y-2">
            {AVAILABLE_AGENTS.map((agent) => (
              <li
                key={agent.id}
                className="flex items-center justify-between rounded-md border border-gray-100 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {agent.name}
                  </p>
                  <p className="text-xs text-gray-500">{agent.desc}</p>
                </div>
                <Link
                  to={agent.href}
                  className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900">
            {copy.agents.activityFeed}
          </h2>
          {loading ? (
            <p className="mt-3 text-sm text-gray-500">Loading...</p>
          ) : activity.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              {copy.agents.noActivity}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between border-b border-gray-50 py-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {a.agent_name} — {a.action_type}
                    </p>
                    {a.payload && (
                      <p className="text-xs text-gray-500">
                        {JSON.stringify(a.payload).slice(0, 80)}...
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(a.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
