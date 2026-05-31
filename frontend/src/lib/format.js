export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateTime(iso) {
  return `${formatDate(iso)} • ${formatTime(iso)}`;
}

export function priceLabel(price) {
  const n = Number(price);
  return n === 0 ? "Free" : `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
}

export function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
