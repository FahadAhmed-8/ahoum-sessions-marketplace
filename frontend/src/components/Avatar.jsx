import { initials } from "../lib/format.js";

export default function Avatar({ src, name, size = 32 }) {
  const dim = { width: size, height: size };
  if (src) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        style={dim}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={dim}
      className="flex items-center justify-center rounded-full bg-info-bg text-[12px] font-medium text-primary-container"
    >
      {initials(name)}
    </div>
  );
}
