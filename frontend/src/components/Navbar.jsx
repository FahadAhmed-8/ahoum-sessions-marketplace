import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Avatar from "./Avatar.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate("/");
  }

  return (
    <nav className="fixed top-0 z-40 w-full border-b border-border-base bg-background">
      <div className="mx-auto flex h-16 max-w-container-max items-center justify-between px-lg">
        <div className="flex items-center gap-xl">
          <Link to="/" className="text-headline-lg font-bold text-primary">
            Ahoum
          </Link>
          <div className="hidden gap-lg md:flex">
            <Link
              to="/"
              className="rounded-lg border border-border-base px-md py-1.5 text-body-lg text-secondary transition-colors hover:border-primary-container hover:text-accent-hover"
            >
              Browse Sessions
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-md">
          {!user && (
            <Link
              to="/login"
              className="flex h-[44px] items-center justify-center rounded-lg bg-primary-container px-lg text-body-lg font-bold text-on-primary transition-colors hover:bg-accent-hover"
            >
              Sign in
            </Link>
          )}

          {user && (
            <>
              <Link
                to="/dashboard"
                className="hidden h-[40px] items-center gap-xs rounded-lg px-md text-body-sm font-bold text-secondary transition-colors hover:bg-surface-subtle hover:text-primary sm:flex"
              >
                <span className="material-symbols-outlined text-[20px]">event</span>
                My Bookings
              </Link>
              {user.role === "creator" && (
                <Link
                  to="/creator"
                  className="hidden h-[40px] items-center gap-xs rounded-lg border border-primary-container px-md text-body-sm font-bold text-primary-container transition-colors hover:bg-surface-subtle sm:flex"
                >
                  <span className="material-symbols-outlined text-[20px]">dashboard</span>
                  Creator Dashboard
                </Link>
              )}
            </>
          )}

          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-xs rounded-full border border-border-base py-1 pl-1 pr-2 transition-colors hover:bg-surface-subtle"
              >
                <Avatar src={user.avatar_url} name={user.name} size={32} />
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  expand_more
                </span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-56 animate-fade-in-up rounded-xl border border-border-base bg-background py-2 shadow-ambient">
                  <div className="border-b border-border-base px-md pb-2">
                    <p className="truncate text-body-sm font-bold text-on-surface">
                      {user.name || "Account"}
                    </p>
                    <p className="truncate text-[13px] text-secondary">
                      {user.email || "No email"}
                    </p>
                  </div>
                  <MenuLink to="/dashboard" icon="event" onClick={() => setOpen(false)}>
                    My Bookings
                  </MenuLink>
                  <MenuLink
                    to="/dashboard/profile"
                    icon="person"
                    onClick={() => setOpen(false)}
                  >
                    Profile
                  </MenuLink>
                  {user.role === "creator" ? (
                    <MenuLink
                      to="/creator"
                      icon="dashboard"
                      onClick={() => setOpen(false)}
                    >
                      Creator Dashboard
                    </MenuLink>
                  ) : (
                    <MenuLink
                      to="/become-creator"
                      icon="add_business"
                      onClick={() => setOpen(false)}
                    >
                      Become a Creator
                    </MenuLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-xs px-md py-2 text-left text-body-sm text-danger transition-colors hover:bg-surface-subtle"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function MenuLink({ to, icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-xs px-md py-2 text-body-sm text-on-surface transition-colors hover:bg-surface-subtle"
    >
      <span className="material-symbols-outlined text-[20px] text-secondary">{icon}</span>
      {children}
    </Link>
  );
}
