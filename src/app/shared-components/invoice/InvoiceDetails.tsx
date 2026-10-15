import { Container, Grid, Typography } from "@mui/material";
import moment from "moment";
import { useTranslation } from "react-i18next";
import Currency from "src/app/main/utils/currencyFormatter";

function InvoiceDetails({
  fromData,
  toData,
  status,
  statusColor,
  date,
  dueDate,
  amount,
  hideDueDate = false,
  hideStatus = false,
}) {
  const { t } = useTranslation("public");
  return (
    <Container>
      <Grid
        container
        justifyContent="space-between"
        style={{ marginTop: "40px" }}
      >
        <Grid item>
          <Container style={{ marginBottom: "20px" }}>
            <Typography
              variant="overline"
              style={{ color: "gray" }}
              gutterBottom
            >
              {t("FROM")}
            </Typography>
            <Typography variant="subtitle2">{fromData.name}</Typography>
            {!fromData.hideEmail && (
              <Typography variant="body2">{fromData.email}</Typography>
            )}
            {!fromData.hidePhone && (
              <Typography variant="body2" dir="ltr" textAlign="left">
                {fromData.phone}
              </Typography>
            )}
            {!fromData.hideAddress && (
              <Typography variant="body2" gutterBottom>
                {fromData.address}
              </Typography>
            )}
          </Container>
          <Container>
            <Typography
              variant="overline"
              style={{ color: "gray", paddingRight: "3px" }}
              gutterBottom
            >
              {t("BILL_TO")}
            </Typography>
            <Typography variant="subtitle2">{toData.name}</Typography>
            {!toData.hideEmail && (
              <Typography variant="body2">{toData?.email}</Typography>
            )}
            {!toData.hidePhone && (
              <Typography variant="body2" dir="ltr" textAlign="left">
                {toData?.phone}
              </Typography>
            )}
            {!toData.hideAddress && (
              <Typography variant="body2">{toData?.address}</Typography>
            )}
          </Container>
        </Grid>

        <Grid item sx={{ mr: "20px", textAlign: "right" }}>
          {!hideStatus && (
            <>
              <Typography
                variant="overline"
                style={{ color: "gray" }}
                gutterBottom
              >
                {t("INVOICE_STATUS")}
              </Typography>
              <Typography
                variant="h6"
                gutterBottom
                style={{ color: statusColor }}
              >
                {status}
              </Typography>
            </>
          )}
          <Typography variant="overline" style={{ color: "gray" }} gutterBottom>
            {t("INVOICE_DATE")}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {moment(date).format("MMM Do YYYY")}
          </Typography>
          {!hideDueDate && (
            <>
              <Typography
                variant="overline"
                style={{ color: "gray" }}
                gutterBottom
              >
                {t("INVOICE_DUE_DATE")}
              </Typography>
              <Typography variant="body2" gutterBottom>
                {moment(dueDate ?? date).format("MMM Do YYYY")}
              </Typography>
            </>
          )}
          <Typography variant="overline" gutterBottom>
            {t("INVOICE_AMOUNT")}
          </Typography>
          <Typography variant="h6" gutterBottom>
            {Currency(amount)}
          </Typography>
        </Grid>
      </Grid>
    </Container>
  );
}

export default InvoiceDetails;
