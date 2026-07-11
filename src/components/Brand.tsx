import type { SVGProps } from "react";

type BrandMarkProps = SVGProps<SVGSVGElement> & {
  appIcon?: boolean;
  animated?: boolean;
  title?: string;
};

export function BrandMark({ appIcon = false, animated = false, title, className, ...props }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...props}
    >
      {appIcon && <rect width="512" height="512" rx="112" fill="#D7268F" />}
      <g transform={appIcon ? "translate(25 12) scale(.9)" : undefined} fill="#F2C6D8">
        <g className={animated ? "mora-brand-symbol" : undefined}>
          <path d="M105 367C82 272 113 148 169 102c24-19 48-10 49 27 2 48-18 121 4 158 13 22 29 19 45-4 34-50 49-114 98-138 39-19 73 7 64 49-6 30-24 60-36 88l-30-13c13-36 26-68 15-79-14-13-38 9-56 39-28 48-44 105-84 127-39 22-72-1-84-40-17-56 9-137 12-171-26 37-45 109-42 173 1 21 5 38 7 47l-26 2Z" />
          <path className={animated ? "mora-brand-drop" : undefined} d="M393 286c13 16 20 26 20 37 0 13-9 22-21 22s-21-9-21-22c0-11 8-21 22-37Z" />
          <path d="M350 359h82c-2 31-12 54-31 64v29h21c7 0 12 5 12 11s-5 11-12 11h-62c-7 0-12-5-12-11s5-11 12-11h20v-29c-18-10-28-33-30-64Z" />
        </g>
      </g>
    </svg>
  );
}

export function BrandEyebrow() {
  return <span className="inline-flex items-center gap-2"><BrandMark appIcon className="h-8 w-8 rounded-lg shadow-card" /><span>Mora Vinería</span></span>;
}
