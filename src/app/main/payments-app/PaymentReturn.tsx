import { Navigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import PaymentResultTab from "./payment/tabs/PaymentResultTab";
export default function PaymentReturn() {
  const [params] = useSearchParams(),
    user = useAppSelector(selectUser);
  if (user.role !== "user") return <Navigate to="/home" replace />;
  return (
    <div className="p-16 sm:p-24">
      <PaymentResultTab id={params.get("paymentId")} />
    </div>
  );
}
