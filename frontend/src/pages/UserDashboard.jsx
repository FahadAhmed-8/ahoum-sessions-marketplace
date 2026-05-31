import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import Avatar from "../components/Avatar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Spinner from "../components/Spinner.jsx";
import { formatDate, formatTime } from "../lib/format.js";

export default function UserDashboard({ tab = "bookings" }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-container-max flex-col gap-lg px-lg py-lg md:flex-row">
      {/* Sidebar */}
      <aside className="md:w-[220px] md:flex-shrink-0">
        <nav className="flex gap-xs md:flex-col">
          <SideLink active={tab === "bookings"} to="/dashboard" icon="event">
            My Bookings
          </SideLink>
          <SideLink active={tab === "profile"} to="/dashboard/profile" icon="person">
            Profile
          </SideLink>
          {user?.role !== "creator" && (
            <Link
              to="/become-creator"
              className="flex items-center gap-xs rounded-lg bg-info-bg px-md py-2 text-body-sm font-bold text-primary-container transition-colors hover:bg-primary-fixed"
            >
              <span className="material-symbols-outlined text-[20px]">add_business</span>
              Become a Creator
            </Link>
          )}
        </nav>
      </aside>

      <div className="flex-grow">
        {tab === "profile" ? <ProfilePanel /> : <BookingsPanel />}
      </div>
    </div>
  );
}

function SideLink({ active, to, icon, children }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-xs rounded-lg px-md py-2 text-body-sm transition-colors ${
        active
          ? "bg-primary-fixed font-bold text-on-primary-fixed-variant"
          : "text-secondary hover:bg-surface-subtle"
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      {children}
    </Link>
  );
}

function BookingsPanel() {
  const { push } = useToast();
  const [tab, setTab] = useState("upcoming");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/bookings/mine", { params: { status: tab } });
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [tab]);

  async function cancel(id) {
    try {
      await api.patch(`/bookings/${id}/cancel`);
      push("Booking cancelled.");
      load();
    } catch {
      push("Could not cancel booking.", "error");
    }
  }

  return (
    <div>
      <h1 className="mb-lg text-headline-lg text-on-surface">My Bookings</h1>
      <div className="mb-lg flex gap-lg border-b border-border-base">
        {["upcoming", "past"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-2 text-body-lg capitalize transition-colors ${
              tab === t
                ? "border-primary font-bold text-primary"
                : "border-transparent text-secondary hover:text-on-surface"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading bookings…" />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="event_busy"
          title={`No ${tab} bookings`}
          subtitle="When you book a session, it'll show up here."
          ctaLabel="Browse sessions"
          ctaTo="/"
        />
      ) : (
        <div className="space-y-md">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} onCancel={cancel} active={tab === "upcoming"} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingRow({ booking, onCancel, active }) {
  const s = booking.session;
  const cancelled = booking.status === "cancelled";
  return (
    <div className="flex items-center gap-md rounded-xl border border-border-base bg-background p-md shadow-ambient">
      <div className="hidden h-20 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-info-bg to-primary-fixed sm:flex">
        <span className="material-symbols-outlined text-[28px] text-primary-container">
          self_improvement
        </span>
      </div>
      <div className="min-w-0 flex-grow">
        <Link to={`/sessions/${s.id}`} className="text-headline-md text-on-surface hover:text-primary">
          {s.title}
        </Link>
        <p className="text-body-sm text-secondary">with {s.creator?.name}</p>
        <p className="mt-1 flex items-center gap-xs text-body-sm text-secondary">
          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
          {formatDate(s.start_time)} • {formatTime(s.start_time)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatusBadge cancelled={cancelled} active={active} />
        {active && !cancelled && (
          <button
            onClick={() => onCancel(booking.id)}
            className="text-body-sm font-bold text-danger hover:underline"
          >
            Cancel
          </button>
        )}
        {!active && (
          <Link to={`/sessions/${s.id}`} className="text-body-sm font-bold text-primary hover:underline">
            Book again
          </Link>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ cancelled, active }) {
  if (cancelled)
    return (
      <span className="rounded-full bg-danger-bg px-sm py-[2px] text-label-caps text-danger">
        Cancelled
      </span>
    );
  if (active)
    return (
      <span className="rounded-full bg-success-bg px-sm py-[2px] text-label-caps text-success">
        Confirmed
      </span>
    );
  return (
    <span className="rounded-full bg-surface-variant px-sm py-[2px] text-label-caps text-secondary">
      Past
    </span>
  );
}

function ProfilePanel() {
  const { user, setUser } = useAuth();
  const { push } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar_url || "");
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/me", { name, avatar_url: avatar });
      setUser(data);
      push("Profile updated.");
    } catch {
      push("Could not save profile.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-lg text-headline-lg text-on-surface">Profile Settings</h1>
      <form onSubmit={save} className="space-y-lg rounded-xl border border-border-base bg-background p-lg shadow-ambient">
        <div className="flex items-center gap-md">
          <Avatar src={avatar} name={name} size={72} />
          <div className="flex-grow">
            <label className="mb-1 block text-label-caps uppercase text-secondary">
              Avatar URL
            </label>
            <input
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-border-base px-md py-2 text-body-sm outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-label-caps uppercase text-secondary">Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border-base px-md py-3 text-body-lg outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
          />
        </div>

        <div>
          <label className="mb-1 block text-label-caps uppercase text-secondary">
            Email Address
          </label>
          <input
            value={user?.email || "Not shared by provider"}
            readOnly
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-border-base bg-surface-subtle px-md py-3 text-body-lg text-secondary"
          />
          <p className="mt-1 text-body-sm text-secondary">
            From your {user?.oauth_provider} account — can't be changed here.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-lg py-3 text-body-lg font-bold text-on-primary transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
