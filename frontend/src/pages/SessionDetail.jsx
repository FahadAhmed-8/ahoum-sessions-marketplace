import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import Avatar from "../components/Avatar.jsx";
import Modal from "../components/Modal.jsx";
import Spinner from "../components/Spinner.jsx";
import { formatDate, formatTime, priceLabel } from "../lib/format.js";

export default function SessionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [working, setWorking] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/sessions/${id}`);
      setSession(data);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [id]);

  async function confirmBooking() {
    setWorking(true);
    try {
      await api.post("/bookings", { session: session.id });
      push("Booking confirmed!");
      setShowModal(false);
      await load();
    } catch (e) {
      push(e.response?.data?.detail || "Could not book this session.", "error");
      setShowModal(false);
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <Spinner full label="Loading session…" />;
  if (!session)
    return (
      <div className="mx-auto max-w-container-max px-lg py-huge text-center">
        <p className="text-secondary">Session not found.</p>
        <Link to="/" className="text-primary-container">
          ← Back to sessions
        </Link>
      </div>
    );

  const full = session.spots_left <= 0;
  const free = Number(session.price) === 0;
  const booked = session.is_booked_by_me;

  function onBookClick() {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/sessions/${id}` } } });
      return;
    }
    setShowModal(true);
  }

  return (
    <div className="mx-auto min-h-screen max-w-container-max px-lg pb-huge pt-lg">
      <Link
        to="/"
        className="group mb-lg inline-flex items-center text-body-sm text-secondary transition-colors hover:text-primary"
      >
        <span className="material-symbols-outlined mr-xs text-[18px] transition-transform group-hover:-translate-x-1">
          arrow_back
        </span>
        Back to Sessions
      </Link>

      <div className="grid grid-cols-1 items-start gap-gutter md:grid-cols-12">
        {/* Left */}
        <div className="space-y-xl md:col-span-7">
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-border-base shadow-ambient">
            {session.cover_url ? (
              <img src={session.cover_url} alt={session.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-info-bg to-primary-fixed">
                <span className="material-symbols-outlined text-[64px] text-primary-container">
                  self_improvement
                </span>
              </div>
            )}
          </div>

          <div>
            <h1 className="mb-md text-headline-xl text-on-surface">{session.title}</h1>
            <div className="mb-lg flex items-center gap-md border-b border-border-base pb-lg">
              <Avatar src={session.creator?.avatar_url} name={session.creator?.name} size={48} />
              <div>
                <p className="text-body-lg font-bold text-on-surface">
                  {session.creator?.name}
                </p>
                <p className="text-body-sm text-secondary">Creator</p>
              </div>
            </div>

            <div className="mb-lg flex flex-wrap gap-sm">
              <Pill icon="calendar_today">{formatDate(session.start_time)}</Pill>
              <Pill icon="schedule">
                {formatTime(session.start_time)} ({session.duration_minutes} min)
              </Pill>
              <Pill icon="group">
                {full ? "Fully booked" : `${session.spots_left} spots left`}
              </Pill>
            </div>

            <div className="space-y-md whitespace-pre-line text-body-lg text-secondary">
              {session.description || "No description provided."}
            </div>
          </div>
        </div>

        {/* Right: sticky booking card */}
        <div className="md:col-span-5">
          <div className="sticky top-[88px] rounded-xl border border-border-base bg-background p-lg shadow-ambient">
            <div className="mb-md">
              {free ? (
                <span className="text-headline-xl font-bold text-on-surface">Free</span>
              ) : (
                <span className="text-headline-xl font-bold text-on-surface">
                  {priceLabel(session.price)}
                </span>
              )}
            </div>
            <div className="mb-lg space-y-sm">
              <Row label="Date" value={formatDate(session.start_time)} />
              <Row label="Time" value={formatTime(session.start_time)} />
              <Row
                label="Availability"
                value={full ? "Fully booked" : `${session.spots_left} spots left`}
                danger={full}
              />
            </div>

            {booked ? (
              <div className="space-y-sm">
                <div className="flex w-full items-center justify-center gap-xs rounded-lg bg-success-bg py-3 text-body-lg font-bold text-success">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Booked
                </div>
                <Link
                  to="/dashboard"
                  className="block w-full rounded-lg py-2 text-center text-body-sm font-bold text-primary hover:bg-surface-subtle"
                >
                  View in my bookings
                </Link>
              </div>
            ) : (
              <button
                onClick={onBookClick}
                disabled={full}
                className="flex w-full items-center justify-center gap-xs rounded-lg bg-primary py-3 text-body-lg font-bold text-on-primary transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-border-base disabled:text-secondary"
              >
                {full ? "Fully booked" : user ? "Book Now" : "Log in to book"}
                {!full && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
              </button>
            )}

            <p className="mt-sm flex items-center justify-center gap-xs text-center text-body-sm text-secondary">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              Free cancellation anytime
            </p>
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="mb-lg text-center">
          <div className="mx-auto mb-md flex h-16 w-16 items-center justify-center rounded-full bg-info-bg">
            <span className="material-symbols-outlined text-[32px] text-primary">event_available</span>
          </div>
          <h2 className="mb-xs text-headline-lg text-on-surface">Confirm Booking</h2>
          <p className="text-body-sm text-secondary">
            You are about to book {session.title}.
          </p>
        </div>
        <div className="mb-lg space-y-xs rounded-lg border border-border-base bg-surface-subtle p-md">
          <Row label="Date" value={formatDate(session.start_time)} />
          <Row label="Time" value={formatTime(session.start_time)} />
          <Row label="Price" value={free ? "Free" : priceLabel(session.price)} />
        </div>
        <div className="flex gap-md">
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 rounded-lg py-3 text-body-lg font-bold text-primary transition-colors hover:bg-surface-subtle"
          >
            Cancel
          </button>
          <button
            onClick={confirmBooking}
            disabled={working}
            className="flex-1 rounded-lg bg-primary py-3 text-body-lg font-bold text-on-primary transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {working ? "Booking…" : "Confirm Booking"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Pill({ icon, children }) {
  return (
    <div className="flex items-center gap-xs rounded-full border border-border-base bg-surface-subtle px-4 py-2 text-body-sm text-on-surface">
      <span className="material-symbols-outlined text-[18px] text-secondary">{icon}</span>
      {children}
    </div>
  );
}

function Row({ label, value, danger }) {
  return (
    <div className="flex justify-between text-body-sm">
      <span className="text-secondary">{label}</span>
      <span className={`font-bold ${danger ? "text-danger" : "text-on-surface"}`}>{value}</span>
    </div>
  );
}
