import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

const BENEFITS = [
  "Create and publish your own sessions",
  "Manage bookings from one dashboard",
  "Reach seekers looking for what you offer",
];

export default function BecomeCreator() {
  const { user, setUser } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [working, setWorking] = useState(false);

  if (user?.role === "creator") {
    navigate("/creator", { replace: true });
    return null;
  }

  async function become() {
    setWorking(true);
    try {
      const { data } = await api.post("/me/become-creator");
      setUser(data);
      push("You're now a creator!");
      navigate("/creator", { replace: true });
    } catch {
      push("Could not upgrade your account.", "error");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-lg py-huge">
      <div className="w-full max-w-[480px] rounded-xl border border-border-base bg-background p-xl text-center shadow-ambient">
        <div className="mx-auto mb-md flex h-16 w-16 items-center justify-center rounded-full bg-info-bg">
          <span className="material-symbols-outlined text-[32px] text-primary-container">
            add_business
          </span>
        </div>
        <h1 className="mb-xs text-headline-lg text-on-surface">Start hosting sessions</h1>
        <p className="mb-lg text-body-sm text-secondary">
          Upgrade your account to a creator and start sharing your work.
        </p>

        <ul className="mb-xl space-y-sm text-left">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-sm text-body-sm text-on-surface">
              <span className="material-symbols-outlined text-[20px] text-primary-container">
                check_circle
              </span>
              {b}
            </li>
          ))}
        </ul>

        <button
          onClick={become}
          disabled={working}
          className="w-full rounded-lg bg-primary py-3 text-body-lg font-bold text-on-primary transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {working ? "Upgrading…" : "Become a creator"}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="mt-sm w-full rounded-lg py-2 text-body-sm font-bold text-secondary hover:text-primary"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
