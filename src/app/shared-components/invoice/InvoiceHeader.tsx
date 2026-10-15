import { Container, Grid, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

function InvoiceHeader({ logo, logoHeight, headerTitle, reference }) {
  const { t } = useTranslation("public");
  return (
    <Container className="headerContainer">
      <Grid
        container
        justifyContent="space-between"
        style={{ padding: "30px 0px" }}
      >
        <Grid item>
          <img
            src={logo}
            alt="Logo"
            className="logo"
            style={{
              height: `${logoHeight ?? 120}px`,
            }}
          />
        </Grid>
        <Grid item sx={{ mr: "40px", textAlign: "right" }}>
          <Typography
            style={{
              lineSpacing: 1,
              fontSize: 45,
              fontWeight: 700,
              color: "gray",
            }}
          >
            {headerTitle ?? t("INVOICE")}
          </Typography>
          <Typography variant="overline" style={{ color: "gray" }}>
            {t("INVOICE_NO")}{" "}
          </Typography>
          <Typography variant="body2">{reference}</Typography>
        </Grid>
      </Grid>
    </Container>
  );
}

export default InvoiceHeader;
