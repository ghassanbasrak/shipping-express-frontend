import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { canViewDashboard } from "../../dashboard/Utils";
import DashboardPage from "../../dashboard/DashboardPage";
import MerchantHome from "./MerchantHome";
import StaffHome from "./StaffHome";
export default function Home() {
  const user = useAppSelector(selectUser);
  return user.role === "user" ? (
    <MerchantHome key={user.id} />
  ) : canViewDashboard(user) ? (
    <DashboardPage />
  ) : (
    <StaffHome />
  );
}
