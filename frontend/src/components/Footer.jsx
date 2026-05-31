export default function Footer() {
  return (
    <footer className="mt-huge w-full border-t border-border-base bg-surface-subtle">
      <div className="mx-auto flex max-w-container-max flex-col items-center justify-between px-lg py-xl md:flex-row">
        <div className="mb-md text-center md:mb-0 md:text-left">
          <span className="mb-xs block text-headline-md font-bold text-primary">
            Ahoum
          </span>
          <span className="text-body-sm text-secondary">
            © 2026 Ahoum. All rights reserved.
          </span>
        </div>
        <div className="flex gap-md text-body-sm">
          {["Terms", "Privacy", "Help Center", "Contact"].map((l) => (
            <a
              key={l}
              href="#"
              className="text-secondary transition-colors hover:text-primary"
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
