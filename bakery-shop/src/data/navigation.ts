export type NavigationItem = {
  href: string;
  label: string;
};

export const NAVIGATION: NavigationItem[] = [
  { href: "/", label: "Начало" },
  { href: "/#cookies", label: "Кукита" },
  { href: "/#cakes", label: "Торти" },
  { href: "/#other", label: "Други" },
  { href: "/faq", label: "FAQ" },
];
