import { Button, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
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
        <Button className="mt-24" onClick={signOut}>
          {t("SIGN_OUT")}
        </Button>
      </Paper>
    </div>
  );
}
