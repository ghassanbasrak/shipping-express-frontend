import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
export default function AffiliateSignUpPage() {
  const { affiliateCode } = useParams();
  useEffect(() => {
    if (affiliateCode && !localStorage.getItem("affiliateCode"))
      localStorage.setItem("affiliateCode", affiliateCode);
  }, [affiliateCode]);
  return <Navigate to="/" replace />;
}
