import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import { formatDate, formatTime, priceLabel } from "../lib/format.js";

export default function SessionCard({ session }) {
  const full = session.spots_left <= 0;
  const free = Number(session.price) === 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border-base bg-background shadow-ambient transition-colors duration-200 hover:border-primary-fixed">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-variant">
        {session.cover_url ? (
          <img
            src={session.cover_url}
            alt={session.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-info-bg to-primary-fixed">
            <span className="material-symbols-outlined text-[40px] text-primary-container">
              self_improvement
            </span>
          </div>
        )}
        {full && (
          <div className="absolute right-md top-md rounded-full bg-on-surface/80 px-sm py-[2px] text-label-caps text-white">
            Full
          </div>
        )}
      </div>

      <div className="flex flex-grow flex-col p-lg">
        <div className="mb-md flex items-center gap-sm">
          <Avatar src={session.creator?.avatar_url} name={session.creator?.name} size={32} />
          <span className="text-body-sm text-secondary">{session.creator?.name}</span>
        </div>

        <h3 className="mb-sm line-clamp-2 text-headline-md text-on-background">
          {session.title}
        </h3>

        <div className="mb-lg mt-auto flex flex-wrap gap-sm">
          <Pill icon="calendar_today">
            {formatDate(session.start_time)}, {formatTime(session.start_time)}
          </Pill>
          <Pill icon="schedule">{session.duration_minutes} min</Pill>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border-base pt-md">
          {free ? (
            <span className="rounded bg-info-bg px-sm py-[2px] text-label-caps text-primary-container">
              Free
            </span>
          ) : (
            <span className="text-headline-md text-primary-container">
              {priceLabel(session.price)}
            </span>
          )}
          <Link
            to={`/sessions/${session.id}`}
            className="flex h-[44px] items-center rounded-lg border border-primary-container px-md text-body-lg font-bold text-primary-container transition-colors hover:bg-surface-subtle"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

function Pill({ icon, children }) {
  return (
    <div className="flex items-center gap-xs rounded-full border border-border-base bg-surface-subtle px-sm py-[4px] text-body-sm text-secondary">
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {children}
    </div>
  );
}
