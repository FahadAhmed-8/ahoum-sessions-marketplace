import { useEffect } from "react";

export default function Modal({ open, onClose, children, maxWidth = "max-w-md" }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative m-lg w-full ${maxWidth} animate-fade-in-up rounded-xl border border-border-base bg-background p-xl shadow-ambient`}
      >
        {children}
      </div>
    </div>
  );
}
