import type { ReactNode } from 'react';

type IconName = 'home' | 'cart' | 'box' | 'chart' | 'search' | 'arrow' | 'back' | 'check' | 'wallet' | 'alert' | 'wifi';
const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const icons: Record<IconName, ReactNode> = {
  home: <><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></>,
  cart: <><path d="M3 4h2l2.2 11.5a2 2 0 0 0 2 1.6H20" /><path d="M7 7h14l-1.8 7H8.1"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></>,
  box: <><rect x="4" y="7" width="16" height="14" rx="2"/><path d="m4 8 8 5 8-5M12 13v8M4 7l8-4 8 4"/></>,
  chart: <><path d="M4 21V13M10 21V8M16 21V12M22 21V4"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6"/></>,
  back: <><path d="m15 5-7 7 7 7"/></>,
  check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
  wallet: <><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 9h18M16 15h2"/></>,
  alert: <><path d="m12 3 10 18H2z"/><path d="M12 9v5m0 3v.1"/></>,
  wifi: <><path d="M2 9a15 15 0 0 1 20 0M5 13a11 11 0 0 1 14 0m-10 4a5 5 0 0 1 6 0"/><circle cx="12" cy="21" r="1"/></>,
};
export function Icon({ name, size = 22, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} {...common}>{icons[name]}</svg>;
}
