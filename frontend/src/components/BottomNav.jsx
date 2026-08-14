import { NavLink } from "react-router-dom";
import { Home, IndianRupee, ListChecks, Users, LineChart, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/collection", label: "Collection", icon: IndianRupee },
  { to: "/loan", label: "Loan", icon: ListChecks },
  { to: "/borrowers", label: "Borrowers", icon: Users },
  { to: "/graphs", label: "Graphs", icon: LineChart },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 z-20 card-3d no-lift">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-1 py-0.5 text-[10px] sm:text-[11px] ${
              isActive ? "text-primary font-medium" : "text-gray-400"
            }`
          }
        >
          <Icon size={18} strokeWidth={1.6} />
          <span className="truncate max-w-[60px]">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
