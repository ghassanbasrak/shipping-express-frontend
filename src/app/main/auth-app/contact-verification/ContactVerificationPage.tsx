import { useState } from "react";
import { Alert, Button, Chip, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import { requiresContactVerification } from "src/app/auth/permissions";
import type { ContactKind } from "src/app/auth/services/jwt/contactVerification";
import AuthLayout from "../AuthLayout";
import ContactVerificationForm from "./ContactVerificationForm";

function ContactCard({ kind }: { kind: ContactKind }) {
  const { t } = useTranslation("ashamcoAuth"),
    { user } = useJwtAuth();
  const [editing, setEditing] = useState(false);
  const verified =
    kind === "phone"
      ? user.phoneVerified === true
      : user.emailVerified === true;
  return (
    <Paper
      variant="outlined"
      className="p-20 sm:p-24 rounded-16 min-w-0 space-y-20"
      data-testid={`verify-${kind}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-12">
        <Typography component="h2" className="text-18 font-semibold">
          {t(kind === "phone" ? "VERIFY_PHONE" : "VERIFY_EMAIL")}
        </Typography>
        <Chip
          size="small"
          color={verified ? "success" : "warning"}
          label={t(verified ? "CONTACT_VERIFIED" : "CONTACT_UNVERIFIED")}
        />
      </div>
      {verified && !editing ? (
        <>
          <Typography dir="ltr" className="break-all">
            {user[kind]}
          </Typography>
          <Button variant="outlined" onClick={() => setEditing(true)}>
            {t("CHANGE_CONTACT")}
          </Button>
        </>
      ) : (
        <ContactVerificationForm
          kind={kind}
          onVerified={() => setEditing(false)}
        />
      )}
    </Paper>
  );
}
export default function ContactVerificationPage() {
  const { t } = useTranslation("ashamcoAuth"),
    auth = useJwtAuth();
  const [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState(false);
  const complete = !requiresContactVerification(auth.user);
  return (
    <AuthLayout
      product
      wide
      title={t("CONTACT_VERIFICATION")}
      description={t("CONTACT_VERIFICATION_DESCRIPTION")}
    >
      <div className="space-y-20" data-testid="contact-verification">
        {complete && <Alert severity="success">{t("CONTACTS_VERIFIED")}</Alert>}
        {error && <Alert severity="error">{t("ERROR")}</Alert>}
        <div className="grid grid-cols-1 gap-20">
          <ContactCard key={`${auth.user.id}/phone`} kind="phone" />
          <ContactCard key={`${auth.user.id}/email`} kind="email" />
        </div>
        <div className="flex flex-wrap gap-12">
          {complete && (
            <Button variant="contained" component={Link} to="/home">
              {t("CONTINUE_TO_ACCOUNT")}
            </Button>
          )}
          <Button
            variant="outlined"
            disabled={refreshing}
            onClick={async () => {
              setRefreshing(true);
              setError(false);
              try {
                await auth.getUser();
              } catch {
                setError(true);
              } finally {
                setRefreshing(false);
              }
            }}
          >
            {t("REFRESH_VERIFICATION")}
          </Button>
          <Button component={Link} to="/sign-out">
            {t("SIGN_OUT")}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
