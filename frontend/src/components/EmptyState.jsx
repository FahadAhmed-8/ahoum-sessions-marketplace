import { Link } from "react-router-dom";

export default function EmptyState({ icon = "inbox", title, subtitle, ctaLabel, ctaTo }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-base py-xxl text-center">
      <span className="material-symbols-outlined mb-md text-[48px] text-secondary/60">
        {icon}
      </span>
      <h3 className="mb-xs text-headline-md text-on-surface">{title}</h3>
      {subtitle && <p className="mb-lg max-w-sm text-body-sm text-secondary">{subtitle}</p>}
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="flex h-[44px] items-center rounded-lg bg-primary-container px-lg text-body-lg font-bold text-on-primary transition-colors hover:bg-accent-hover"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
