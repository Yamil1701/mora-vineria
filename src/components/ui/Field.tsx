import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { unirClases } from "../../utils/clases";

const controlBase =
  "w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-mora-principal disabled:opacity-60";

export function FieldLabel({
  label,
  description,
  htmlFor,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="text-sm font-medium text-white/80">{label}</span>
      {description && <span className="mt-1 block text-xs leading-5 text-white/45">{description}</span>}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={unirClases(controlBase, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={unirClases(controlBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={unirClases(controlBase, "min-h-24 resize-none", className)} {...props} />;
}
