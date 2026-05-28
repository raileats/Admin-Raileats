import {
  Home,
  ListOrdered,
  MapPinned,
  Train,
  Utensils,
  Users,
  WalletCards,
} from "lucide-react";

export const adminNavItems = [
  {
    href: "/admin/home",
    label: "Dashboard",
    icon: Home,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ListOrdered,
  },
  {
    href: "/admin/restros",
    label: "Restro Master",
    icon: Utensils,
  },
  {
    href: "/admin/menu",
    label: "Menu",
    icon: WalletCards,
  },
  {
    href: "/admin/trains",
    label: "Trains",
    icon: Train,
  },
  {
    href: "/admin/stations",
    label: "Stations",
    icon: MapPinned,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
] as const;
