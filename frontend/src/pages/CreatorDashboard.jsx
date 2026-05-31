import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import Avatar from "../components/Avatar.jsx";
import Modal from "../components/Modal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Spinner from "../components/Spinner.jsx";
import { formatDate, formatTime, priceLabel } from "../lib/format.js";

const BLANK = {
  title: "",
  description: "",
  start_time: "",
  duration_minutes: 60,
  price: "0",
  capacity: 10,
  is_active: true,
};

export default function CreatorDashboard() {
  const [tab, setTab] = useState("sessions");

  return (
    <div className="mx-auto flex max-w-container-max flex-col gap-lg px-lg py-lg md:flex-row">
      <aside className="md:w-[220px] md:flex-shrink-0">
        <nav className="flex gap-xs md:flex-col">
          <Side active={tab === "sessions"} onClick={() => setTab("sessions")} icon="calendar_view_month">
            My Sessions
          </Side>
          <Side active={tab === "overview"} onClick={() => setTab("overview")} icon="insights">
            Bookings Overview
          </Side>
        </nav>
      </aside>
      <div className="flex-grow">
        {tab === "sessions" ? <SessionsPanel /> : <OverviewPanel />}
      </div>
    </div>
  );
}

function Side({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-xs rounded-lg px-md py-2 text-body-sm transition-colors ${
        active
          ? "bg-primary-fixed font-bold text-on-primary-fixed-variant"
          : "text-secondary hover:bg-surface-subtle"
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      {children}
    </button>
  );
}

function SessionsPanel() {
  const { push } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/sessions/mine");
      setSessions(data.results || data);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(s) {
    setEditing(s);
    setModalOpen(true);
  }

  async function remove(s) {
    if (!confirm(`Delete "${s.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/sessions/${s.id}`);
      push("Session deleted.");
      load();
    } catch {
      push("Could not delete session.", "error");
    }
  }

  async function togglePublish(s) {
    try {
      await api.patch(`/sessions/${s.id}`, { is_active: !s.is_active });
      load();
    } catch {
      push("Could not update session.", "error");
    }
  }

  return (
    <div>
      <div className="mb-lg flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg text-on-surface">My Sessions</h1>
          <p className="text-body-sm text-secondary">Manage your offerings and track bookings.</p>
        </div>
        <button
          onClick={openNew}
          className="flex h-[44px] items-center gap-xs rounded-lg bg-primary px-lg text-body-lg font-bold text-on-primary transition-colors hover:bg-accent-hover"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Session
        </button>
      </div>

      {loading ? (
        <Spinner label="Loading sessions…" />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon="event_note"
          title="You haven't created any sessions yet"
          subtitle="Create your first session to start taking bookings."
        />
      ) : (
        <div className="space-y-md">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-md rounded-xl border border-border-base bg-background p-md shadow-ambient sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-grow">
                <div className="flex items-center gap-sm">
                  <h3 className="text-headline-md text-on-surface">{s.title}</h3>
                  <span
                    className={`rounded-full px-sm py-[2px] text-label-caps ${
                      s.is_active
                        ? "bg-success-bg text-success"
                        : "bg-surface-variant text-secondary"
                    }`}
                  >
                    {s.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-xs text-body-sm text-secondary">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {formatDate(s.start_time)} • {formatTime(s.start_time)} · {s.duration_minutes} min
                </p>
                <div className="mt-2">
                  <div className="mb-1 flex justify-between text-body-sm text-secondary">
                    <span>{priceLabel(s.price)}</span>
                    <span>
                      {s.booked_count}/{s.capacity} booked
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                    <div
                      className="h-full rounded-full bg-primary-container"
                      style={{
                        width: `${Math.min(100, (s.booked_count / s.capacity) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-xs">
                <button
                  onClick={() => togglePublish(s)}
                  title={s.is_active ? "Unpublish" : "Publish"}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-base text-secondary hover:bg-surface-subtle"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {s.is_active ? "visibility_off" : "visibility"}
                  </span>
                </button>
                <button
                  onClick={() => openEdit(s)}
                  className="flex h-9 items-center rounded-lg border border-primary-container px-md text-body-sm font-bold text-primary-container hover:bg-surface-subtle"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(s)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-danger hover:bg-danger-bg"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SessionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSaved={() => {
          setModalOpen(false);
          load();
        }}
      />
    </div>
  );
}

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function SessionFormModal({ open, onClose, editing, onSaved }) {
  const { push } = useToast();
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description || "",
        start_time: toLocalInput(editing.start_time),
        duration_minutes: editing.duration_minutes,
        price: String(editing.price),
        capacity: editing.capacity,
        is_active: editing.is_active,
      });
    } else {
      setForm(BLANK);
    }
  }, [editing, open]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price: form.price === "" ? "0" : form.price,
      start_time: new Date(form.start_time).toISOString(),
    };
    try {
      if (editing) {
        await api.patch(`/sessions/${editing.id}`, payload);
        push("Session updated.");
      } else {
        await api.post("/sessions", payload);
        push("Session created.");
      }
      onSaved();
    } catch (err) {
      const detail = err.response?.data;
      push(
        typeof detail === "object" ? Object.values(detail)[0] : "Could not save session.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg">
      <div className="mb-lg flex items-center justify-between">
        <h2 className="text-headline-md text-on-surface">
          {editing ? "Edit Session" : "Create New Session"}
        </h2>
        <button onClick={onClose} className="text-secondary hover:text-on-surface">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onSubmit={submit} className="space-y-md">
        <Field label="Session Title">
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Intro to Meditation"
            className="input"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="input resize-none"
          />
        </Field>
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <Field label="Date & Time">
            <input
              required
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => set("start_time", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Duration">
            <select
              value={form.duration_minutes}
              onChange={(e) => set("duration_minutes", Number(e.target.value))}
              className="input"
            >
              {[30, 45, 60, 90, 120].map((d) => (
                <option key={d} value={d}>
                  {d} Minutes
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price (USD)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="0.00"
              className="input"
            />
          </Field>
          <Field label="Capacity">
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => set("capacity", Number(e.target.value))}
              className="input"
            />
          </Field>
        </div>
        <label className="flex items-center gap-sm text-body-sm text-on-surface">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="h-4 w-4 rounded border-border-base text-primary-container"
          />
          Publish immediately
        </label>

        <div className="flex justify-end gap-md pt-sm">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-lg py-2 text-body-lg font-bold text-secondary hover:bg-surface-subtle"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-lg py-2 text-body-lg font-bold text-on-primary transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : editing ? "Save Changes" : "Create Session"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-label-caps uppercase text-secondary">{label}</label>
      {children}
    </div>
  );
}

function OverviewPanel() {
  const [sessions, setSessions] = useState([]);
  const [rows, setRows] = useState([]);
  const [sel, setSel] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/sessions/mine");
        const list = data.results || data;
        setSessions(list);
        const all = [];
        for (const s of list) {
          const r = await api.get(`/sessions/${s.id}/bookings`);
          r.data.forEach((b) => all.push({ ...b, sessionTitle: s.title, sessionId: s.id }));
        }
        setRows(all);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = sel === "all" ? rows : rows.filter((r) => r.sessionId === Number(sel));
  const confirmed = filtered.filter((r) => r.status === "confirmed");
  const upcoming = confirmed.filter((r) => !r.is_past);

  if (loading) return <Spinner label="Loading bookings…" />;

  return (
    <div>
      <h1 className="mb-lg text-headline-lg text-on-surface">Bookings Overview</h1>

      <div className="mb-lg grid grid-cols-2 gap-md sm:grid-cols-3">
        <Stat label="Total bookings" value={confirmed.length} />
        <Stat label="Upcoming" value={upcoming.length} />
        <Stat label="Sessions" value={sessions.length} />
      </div>

      <select
        value={sel}
        onChange={(e) => setSel(e.target.value)}
        className="mb-md rounded-lg border border-border-base px-md py-2 text-body-sm outline-none"
      >
        <option value="all">All sessions</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>

      {filtered.length === 0 ? (
        <EmptyState icon="group_off" title="No bookings yet" subtitle="Bookings will appear here." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-base">
          <table className="w-full text-left text-body-sm">
            <thead className="bg-surface-subtle text-secondary">
              <tr>
                <th className="px-md py-3">Attendee</th>
                <th className="px-md py-3">Session</th>
                <th className="px-md py-3">Date</th>
                <th className="px-md py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-t border-border-base">
                  <td className="px-md py-3">
                    <div className="flex items-center gap-sm">
                      <Avatar src={b.user?.avatar_url} name={b.user?.name} size={28} />
                      {b.user?.name}
                    </div>
                  </td>
                  <td className="px-md py-3">{b.sessionTitle}</td>
                  <td className="px-md py-3 text-secondary">{formatDate(b.session.start_time)}</td>
                  <td className="px-md py-3">
                    <span
                      className={`rounded-full px-sm py-[2px] text-label-caps ${
                        b.status === "cancelled"
                          ? "bg-danger-bg text-danger"
                          : b.is_past
                          ? "bg-surface-variant text-secondary"
                          : "bg-success-bg text-success"
                      }`}
                    >
                      {b.status === "cancelled" ? "Cancelled" : b.is_past ? "Past" : "Confirmed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-surface-subtle p-md">
      <p className="text-body-sm text-secondary">{label}</p>
      <p className="text-headline-lg text-on-surface">{value}</p>
    </div>
  );
}
