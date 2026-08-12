export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.99]"
    >
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        {description && <span className="mt-1 block text-xs text-white/45">{description}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`h-6 w-11 shrink-0 rounded-full p-1 transition ${checked ? "bg-mora-principal" : "bg-white/15"}`}
      >
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}
