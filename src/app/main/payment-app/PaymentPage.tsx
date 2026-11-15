import { Navigate, useParams } from "react-router-dom";
export default function PaymentPage() {
  const { paymentId } = useParams();
  return (
    <Navigate
      replace
      to={
        paymentId
          ? `/payments/all/${encodeURIComponent(paymentId)}`
          : "/payments/all"
      }
    />
  );
}
