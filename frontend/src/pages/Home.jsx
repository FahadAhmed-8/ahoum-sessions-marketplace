import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import SessionCard from "../components/SessionCard.jsx";
import EmptyState from "../components/EmptyState.jsx";

const FILTERS = [
  { key: "all", label: "All Sessions" },
  { key: "free", label: "Free" },
  { key: "paid", label: "Paid" },
];

export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [ordering, setOrdering] = useState("start_time");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ordering };
      if (search) params.search = search;
      if (filter !== "all") params.price = filter;
      const { data } = await api.get("/sessions", { params });
      setSessions(data.results || data);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [search, filter, ordering]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border-base bg-surface-subtle px-lg py-huge">
        <div className="mx-auto max-w-container-max text-center">
          <h1 className="mx-auto mb-lg max-w-2xl text-[32px] font-bold leading-tight text-on-background md:text-headline-xl">
            Book sessions that move you forward
          </h1>
          <p className="mx-auto mb-lg max-w-xl text-body-lg text-secondary">
            Browse spiritual & wellness sessions from trusted creators.
          </p>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-md md:flex-row">
            <div className="relative w-full flex-grow">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-secondary">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sessions, topics, or creators..."
                className="h-[52px] w-full rounded-lg border border-border-base bg-background pl-[48px] pr-md text-body-lg shadow-ambient outline-none transition-all focus:border-primary-container focus:ring-1 focus:ring-primary-container"
              />
            </div>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="h-[52px] w-full rounded-lg border border-border-base bg-background px-md text-body-lg outline-none md:w-auto"
            >
              <option value="start_time">Date (upcoming first)</option>
              <option value="price">Price (low to high)</option>
              <option value="-price">Price (high to low)</option>
            </select>
          </div>
          <div className="mt-lg flex flex-wrap justify-center gap-md">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-md py-xs text-body-sm transition-colors ${
                  filter === f.key
                    ? "border-primary-container/20 bg-primary-fixed text-on-primary-fixed-variant"
                    : "border-border-base bg-background text-secondary hover:bg-surface-subtle"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-container-max px-lg py-huge">
        {loading ? (
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border-base">
                <div className="skeleton aspect-[16/9] w-full" />
                <div className="space-y-3 p-lg">
                  <div className="skeleton h-4 w-1/3 rounded" />
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-9 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon="search_off"
            title="No sessions found"
            subtitle="Try adjusting your search or filters."
          />
        ) : (
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
