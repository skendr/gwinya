import { Home, ClipboardCheck, Sparkles, LineChart, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Today", icon: Home },
  { href: "/before", label: "Before", icon: ClipboardCheck },
  { href: "/learn", label: "Learn", icon: Sparkles },
  { href: "/progress", label: "Progress", icon: LineChart },
];
