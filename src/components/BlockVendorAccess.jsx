import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

// The marketplace (and anything like it) is a planner tool — browsing and
// booking vendors doesn't apply to a vendor account. This guards the
// route itself, not just the nav links to it, so it doesn't matter how
// many buttons across the site point here (there were more than expected)
// or whether someone types the URL directly — a logged-in vendor always
// bounces to their own dashboard instead of landing on it.
//
// Doesn't require login: unauthenticated visitors and event planners both
// pass straight through untouched. Only an authenticated vendor account
// gets redirected.
export default function BlockVendorAccess() {
  const { user } = useAuth();
  if (user?.account_type === "vendor") {
    return <Navigate to="/vendor-dashboard" replace />;
  }
  return <Outlet />;
}
