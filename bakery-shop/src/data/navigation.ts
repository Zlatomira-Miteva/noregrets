export type NavigationItem = {
  href: string;
  label: string;
};

export const NAVIGATION: NavigationItem[] = [
  { href: "/home", label: "Начало" },
  { href: "/cookies", label: "Кукита" },
  { href: "/products/tiramisu/tiramisu-classic", label: "Тирамису" },
  { href: "/products/cake-jar?flavor=cake-jar-nutella-biscoff", label: "Торти в буркан" },
  // { href: "/mochi", label: "Мочи" },
];
