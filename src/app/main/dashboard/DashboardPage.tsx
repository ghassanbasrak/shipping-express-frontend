import { Navigate } from "react-router-dom";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { canViewDashboard } from "./Utils";
import DashboardContent from "./dashboard/DashboardContent";
export default function DashboardPage() {
  const user = useAppSelector(selectUser);
  return canViewDashboard(user) ? (
    <DashboardContent />
  ) : (
    <Navigate to="/home" replace />
  );
}
