import { Button, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import { isDemoMode, resetDemoData } from "src/app/demo/demoMode";
export default function Home() {
  const { user, signOut } = useJwtAuth();
  const { t } = useTranslation("ashamcoAuth");
  return (
    <div className="p-24 w-full">
      <Paper className="p-32">
        <Typography variant="h4">Ashamco Express</Typography>
        <Typography className="mt-16">
          {t("WELCOME")} {user?.firstName} {user?.lastName}
        </Typography>
        <Typography>{user?.email}</Typography>
        {isDemoMode ? (
          <div className="flex flex-wrap gap-12 mt-24">
            <Typography className="w-full" color="text.secondary">
              Demo mode — changes are saved in this browser.
            </Typography>
            <Button component={Link} to="/countries/all" variant="contained">
              Countries
            </Button>
            <Button component={Link} to="/shipping-companies" variant="contained">
              Shipping companies
            </Button>
            <Button onClick={resetDemoData} variant="outlined" color="warning">
              Reset demo data
            </Button>
          </div>
        ) : (
          <Button className="mt-24" onClick={signOut}>
            {t("SIGN_OUT")}
          </Button>
        )}
      </Paper>
    </div>
  );
}
