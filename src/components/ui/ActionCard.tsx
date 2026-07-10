import { Link } from "react-router-dom";

export function ActionCard({
  to,
  title,
  description,
}: {
  to: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-card transition hover:bg-white/[0.08] active:scale-[0.99]"
    >
      <span className="text-sm font-semibold text-white">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-white/50">{description}</span>
    </Link>
  );
}
