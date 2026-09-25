import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  User,
  Wallet,
} from "lucide-react";

const NAV = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    to: "/dashboard",
  },
  {
    icon: Wallet,
    label: "Financial Tracker",
    to: "/financial-tracker",
  },
  {
    icon: MessageSquare,
    label: "Messages",
    to: "/messages",
  },
  {
    icon: User,
    label: "Profile",
    to: "/dashboard#profile",
  },
];

function isCurrentRoute(location, to) {
  return `${location.pathname}${location.hash}` === to;
}

export default function AdminLayout({ children }) {
  const location = useLocation();

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 pb-16 pt-6 lg:grid-cols-[240px_1fr] lg:px-6">
      <aside className="hidden lg:block">
        <div className="sticky top-28 rounded-[24px] border border-[#5A1835] bg-[#FBF7F0] p-3 shadow-soft">

          {/* Logo */}
          <div className="mb-2 flex items-center gap-2 px-3 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-soft">
              <img
                src="/favicon.ico"
                alt="evenTneve"
                className="h-full w-full object-cover"
              />
            </span>

            <div>
              <p className="font-display text-[13px] font-bold text-[#292525]">
                evenTneve
              </p>

              <p className="text-[10.5px] uppercase tracking-[0.14em] text-[#7A2348]/70">
                Admin
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className="space-y-1"
            aria-label="Admin navigation"
          >
            {NAV.map(({ icon: Icon, label, to }) => {
              const active = isCurrentRoute(location, to);

              return (
                <NavLink
                  key={label}
                  to={to}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                    active
                      ? "bg-[#7A2348] text-white shadow-soft"
                      : "text-[#292525]/70 hover:bg-[#F3E7D3] hover:text-[#292525]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      <div>{children}</div>
    </div>
  );
}