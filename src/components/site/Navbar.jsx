import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/features", label: "Features" },
  { to: "/financial-tracker", label: "Financial Tracker" },

  // Pricing in navbar goes to Login
  { to: "/login", label: "Pricing" },

  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

/*
 * Vendor-specific hidden links.
 *
 * Vendors should NOT see:
 * - Marketplace
 * - Financial Tracker
 *
 * Pricing is also not shown to vendors because
 * the vendor dashboard handles their subscription.
 */
const VENDOR_HIDDEN_LINKS = new Set([
  "/marketplace",
  "/financial-tracker",
  "/login",
]);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navLinks =
    user?.account_type === "vendor"
      ? links.filter((l) => !VENDOR_HIDDEN_LINKS.has(l.to))
      : links;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="sticky top-0 z-50 w-full px-4 pt-4">
      <nav
        className={`glass-nav mx-auto flex max-w-7xl items-center gap-4 rounded-[999px] border border-[var(--border)] px-4 py-2.5 transition-all duration-500 ${
          scrolled
            ? "shadow-[0_20px_70px_-24px_rgba(122,35,72,0.22)]"
            : "shadow-[0_10px_40px_-24px_rgba(41,37,37,0.12)]"
        }`}
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 pl-2 pr-3"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[#FFFDF8] shadow-[0_8px_22px_-10px_rgba(122,35,72,0.55)]">
            <img
              src="/favicon.ico"
              alt="evenTneve"
              className="h-full w-full object-cover"
            />
          </span>

          <span className="font-display text-[15px] font-bold tracking-tight text-[#292525]">
            evenTneve
          </span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="ml-2 hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors ${
                    isActive
                      ? "bg-[#7A2348] text-[#FFFDF8] shadow-[0_8px_20px_-12px_rgba(122,35,72,0.65)]"
                      : "text-[#6F6265] hover:bg-[#E8C7CF]/60 hover:text-[#292525]"
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Authentication */}
          {isAuthenticated ? (
            <>
              {/* Dashboard */}
              <Link
                to={
                  user?.account_type === "vendor"
                    ? "/vendor-dashboard"
                    : "/dashboard"
                }
                className="hidden rounded-full px-4 py-2 text-[13.5px] font-medium text-[#292525] transition-colors hover:bg-[#E8C7CF]/70 md:inline-flex"
              >
                {user?.full_name || user?.email || "Dashboard"}
              </Link>

              {/* Logout */}
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#7A2348] px-4 py-2 text-[13.5px] font-medium text-[#FFFDF8] shadow-[0_10px_28px_-16px_rgba(122,35,72,0.65)] transition-all hover:-translate-y-0.5 hover:bg-[#641B3B] hover:shadow-[0_18px_32px_-18px_rgba(122,35,72,0.7)]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </>
          ) : (
            <>
              {/* Login */}
              <Link
                to="/login"
                className="hidden rounded-full px-4 py-2 text-[13.5px] font-medium text-[#292525] transition-colors hover:bg-[#E8C7CF]/70 md:inline-flex"
              >
                Log in
              </Link>

              {/* Get Started */}
              <Link
                to="/register"
                className="inline-flex items-center rounded-full bg-[#7A2348] px-4 py-2 text-[13.5px] font-medium text-[#FFFDF8] shadow-[0_10px_28px_-16px_rgba(122,35,72,0.65)] transition-all hover:-translate-y-0.5 hover:bg-[#641B3B] hover:shadow-[0_18px_32px_-18px_rgba(122,35,72,0.7)]"
              >
                Get Started
              </Link>
            </>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#E8C7CF] bg-[#FFFDF8] text-[#292525] shadow-[0_8px_22px_-16px_rgba(41,37,37,0.25)] transition-transform hover:scale-105"
            aria-label="Toggle theme"
            title={
              theme === "dark"
                ? "Switch to Light Mode"
                : "Switch to Royal Dark Mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-[#E8C7CF]" />
            ) : (
              <Moon className="h-4 w-4 text-[#7A2348]" />
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-1 grid h-9 w-9 place-items-center rounded-full border border-[#E8C7CF] bg-[#FFFDF8] text-[#292525] lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {open && (
        <div className="glass-panel mx-auto mt-2 max-w-7xl rounded-3xl border border-[#E8C7CF] bg-[#FFFDF8]/95 p-3 shadow-[0_20px_70px_-30px_rgba(122,35,72,0.3)] lg:hidden">
          <ul className="grid gap-1">
            {navLinks.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#7A2348] text-[#FFFDF8]"
                        : "text-[#292525] hover:bg-[#E8C7CF]/60"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}