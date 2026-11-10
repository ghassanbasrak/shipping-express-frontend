import { Navigate, useParams } from "react-router-dom";
export default function PaymentPage() {
  const { topupRequestId } = useParams();
  return <Navigate replace to={topupRequestId ? `/topup-requests/all/${encodeURIComponent(topupRequestId)}` : "/topup-requests/all"} />;
}
