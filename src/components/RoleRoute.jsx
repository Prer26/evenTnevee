import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

// Sits inside ProtectedRoute (which already guarantees the user is logged
// in). This just makes sure a vendor account can't land on the planner
// dashboard and vice versa — if they try, bounce them to the one that
// matches their account_type instead of showing the wrong data.
export default function RoleRoute({ allow }) {
  const { user } = useAuth();
  const accountType = user?.account_type || "event_planner";

  if (accountType !== allow) {
    return <Navigate to={accountType === "vendor" ? "/vendor-dashboard" : "/dashboard"} replace />;
  }

  return <Outlet />;
}
