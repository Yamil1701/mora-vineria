import type { ReactNode } from 'react';

type IconName = 'home' | 'cart' | 'box' | 'chart' | 'search' | 'arrow' | 'chevron' | 'back' | 'check' | 'wallet' | 'alert' | 'wifi' | 'history' | 'filter' | 'scan' | 'plus' | 'star' | 'coins' | 'bank' | 'cash' | 'split' | 'fiado' | 'clock' | 'receipt' | 'calendar' | 'close' | 'bolt' | 'sort' | 'trend' | 'package' | 'info' | 'refresh' | 'eye';
const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const icons: Record<IconName, ReactNode> = {
  home: <><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></>,
  cart: <><path d="M3 4h2l2.2 11.5a2 2 0 0 0 2 1.6H20" /><path d="M7 7h14l-1.8 7H8.1"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></>,
  box: <><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Z"/><path d="m3 7 9 5 9-5M12 12v9"/></>,
  package: <><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Z"/><path d="m3 7 9 5 9-5M12 12v9"/></>,
  chart: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 16v-3M12 16V8M17 16v-6"/></>,
  trend: <><path d="M3 17 9 11l4 3 8-8M16 6h5v5"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6"/></>,
  chevron: <><path d="m9 5 7 7-7 7"/></>,
  back: <><path d="m15 5-7 7 7 7"/></>,
  check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
  wallet: <><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 9h18M16 15h2"/></>,
  alert: <><path d="m12 3 10 18H2z"/><path d="M12 9v5m0 3v.1"/></>,
  wifi: <><path d="M2 9a15 15 0 0 1 20 0M5 13a11 11 0 0 1 14 0m-10 4a5 5 0 0 1 6 0"/><circle cx="12" cy="21" r="1"/></>,
  history: <><path d="M3 11a9 9 0 1 1 3 7M3 4v7h7"/><path d="M12 7v5l3 2"/></>,
  filter: <><path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="var(--mv-background)"/><circle cx="16" cy="12" r="2" fill="var(--mv-background)"/><circle cx="11" cy="17" r="2" fill="var(--mv-background)"/></>,
  sort: <><path d="m4 7 4-4 4 4M8 3v18m12-4-4 4-4-4m4 4V3"/></>,
  scan: <><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3M3 12h18"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  star: <><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3Z"/></>,
  coins: <><ellipse cx="10" cy="6" rx="7" ry="3"/><path d="M3 6v5c0 1.7 3.1 3 7 3a15 15 0 0 0 4-.5M3 11v4c0 1.7 3.1 3 7 3h1"/><ellipse cx="17" cy="16" rx="5" ry="2.5"/><path d="M12 16v3.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V16"/></>,
  bank: <><path d="M3 9 12 4l9 5M4 9h16M6 10v8m4-8v8m4-8v8m4-8v8M3 20h18"/></>,
  cash: <><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M5 8h1m12 8h1"/></>,
  split: <><circle cx="7" cy="12" r="5"/><circle cx="17" cy="12" r="5"/></>,
  fiado: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></>,
  receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
  close: <><path d="M5 5l14 14M19 5 5 19"/></>,
  bolt: <><path d="m13 2-9 12h7l-1 8 10-12h-7l0-8Z"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14-5L3 9M3 4v5h5M4 13a8 8 0 0 0 14 5l3-3m0 5v-5h-5"/></>,
  eye: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/></>,
};
export function Icon({ name, size = 22, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} {...common}>{icons[name]}</svg>;
}
