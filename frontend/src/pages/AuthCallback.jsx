import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Spinner from "../components/Spinner.jsx";

export default function AuthCallback() {
  const { completeLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const err = params.get("error");
    if (err) {
      setError(err);
      return;
    }
    const access = params.get("access");
    const refresh = params.get("refresh");
    if (!access || !refresh) {
      setError("Login did not return tokens.");
      return;
    }
    (async () => {
      await completeLogin({ access, refresh });
      // Clean tokens out of the URL, then go to dashboard.
      window.history.replaceState({}, "", "/auth/callback");
      navigate("/dashboard", { replace: true });
    })();
  }, [completeLogin, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-md bg-surface-subtle px-lg text-center">
        <span className="material-symbols-outlined text-[48px] text-danger">error</span>
        <h1 className="text-headline-md text-on-surface">Sign-in failed</h1>
        <p className="max-w-sm text-body-sm text-secondary">{error}</p>
        <button
          onClick={() => navigate("/login", { replace: true })}
          className="rounded-lg bg-primary px-lg py-2 text-body-lg font-bold text-on-primary"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle">
      <Spinner label="Signing you in…" />
    </div>
  );
}
