import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, Sparkles, CalendarHeart, Store } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Login({ initialRole }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryRole = searchParams.get("role");

  const [selectedRole, setSelectedRole] = useState(
    initialRole || (["customer", "event_planner", "vendor"].includes(queryRole) ? queryRole : "customer")
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleMeta = {
    customer: {
      title: "Customer",
      badge: "Customer Hub Portal",
      desc: "Access your customer hub to book top planners & vendors and message them directly.",
      icon: Sparkles,
    },
    event_planner: {
      title: "Event Planner",
      badge: "Planner Workspace",
      desc: "Coordinate events, budgets, timelines, and hired vendors.",
      icon: CalendarHeart,
    },
    vendor: {
      title: "Event Vendor",
      badge: "Vendor Business Dashboard",
      desc: "Manage your storefront listing, quotes, and incoming booking requests.",
      icon: Store,
    },
  };

  const currentMeta = roleMeta[selectedRole] || roleMeta.customer;
  const RoleIcon = currentMeta.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await base44.auth.loginViaEmailPassword(email, password);
      const userType = data?.user?.account_type;

      if (userType === "vendor") {
        window.location.href = "/vendor-dashboard";
      } else if (userType === "customer") {
        window.location.href = "/customer-hub";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle={`Log in to your ${currentMeta.title} account`}
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to={`/register?role=${selectedRole}`}
            className="text-primary font-medium hover:underline"
          >
            Create one as {currentMeta.title}
          </Link>
        </>
      }
    >
      {/* ROLE SELECTION QUESTION */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            I am logging in as:
          </Label>
          <span className="text-xs font-semibold text-primary">
            {currentMeta.badge}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setSelectedRole("customer")}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-medium transition-all ${
              selectedRole === "customer"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <Sparkles className="w-4 h-4 mb-1" />
            Customer
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("event_planner")}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-medium transition-all ${
              selectedRole === "event_planner"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <CalendarHeart className="w-4 h-4 mb-1" />
            Planner
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("vendor")}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-medium transition-all ${
              selectedRole === "vendor"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <Store className="w-4 h-4 mb-1" />
            Vendor
          </button>
        </div>

        <div className="p-2.5 rounded-xl border border-border/70 bg-card/60 text-xs text-muted-foreground flex items-center gap-2">
          <RoleIcon className="w-4 h-4 text-primary shrink-0" />
          <span>{currentMeta.desc}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in to {currentMeta.title}...
            </>
          ) : (
            `Log in as ${currentMeta.title}`
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
