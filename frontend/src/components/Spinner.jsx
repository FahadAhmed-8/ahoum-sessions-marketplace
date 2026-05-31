export default function Spinner({ full = false, label }) {
  const spinner = (
    <div className="flex flex-col items-center gap-sm text-secondary">
      <span className="material-symbols-outlined animate-spin text-[32px] text-primary-container">
        progress_activity
      </span>
      {label && <span className="text-body-sm">{label}</span>}
    </div>
  );
  if (full) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">{spinner}</div>
    );
  }
  return spinner;
}
