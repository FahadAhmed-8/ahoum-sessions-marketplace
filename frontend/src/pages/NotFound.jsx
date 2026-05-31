import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-md px-lg text-center">
      <h1 className="text-headline-xl text-on-surface">404</h1>
      <p className="text-body-lg text-secondary">This page doesn't exist.</p>
      <Link
        to="/"
        className="rounded-lg bg-primary px-lg py-2 text-body-lg font-bold text-on-primary"
      >
        Go home
      </Link>
    </div>
  );
}
