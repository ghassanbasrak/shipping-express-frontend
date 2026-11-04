import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import Currency from "src/app/main/utils/currencyFormatter";
import {
  useLazyGetShipmentLabelQuery,
  useLazyGetShipmentQuery,
} from "../ShipmentsApi";
import IShipment from "../models/IShipment";
import { decompressShipment, shipmentErrorMessage } from "../Utils";
import {
  downloadShipmentBlob,
  downloadShipmentInvoice,
  shipmentDocumentBlob,
} from "./documents";
export default function ShipmentDocuments({ row }: { row: IShipment }) {
  const { t } = useTranslation("shipmentsApp"),
    user = useAppSelector(selectUser),
    [mode, setMode] = useState(""),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [previewFailed, setPreviewFailed] = useState(false),
    invoice = useRef<HTMLDivElement>(null);
  const [label] = useLazyGetShipmentLabelQuery(),
    [getShipment] = useLazyGetShipmentQuery();
  async function open(kind: string) {
    setError("");
    setUrl("");
    setPreviewFailed(false);
    setMode(kind);
    setBusy(true);
    try {
      let value =
        kind === "label"
          ? row.labelUrl
          : kind === "image"
            ? row.imageUrl
            : row.invoiceUrl;
      if (kind === "label" && !value) {
        value = (
          await label({
            shipmentId: row.id,
            trackingNumber: row.trackingNumber,
          }).unwrap()
        ).labelUrl;
        if (!value) value = (await getShipment(row.id).unwrap()).labelUrl;
        if (!value) throw new Error(t("LABEL_NOT_READY"));
      }
      setUrl(value || "");
    } catch (e) {
      setError(shipmentErrorMessage(e, t("DOCUMENT_ERROR")));
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    setBusy(true);
    setError("");
    try {
      if (mode === "invoice" && !url) {
        if (!invoice.current) throw new Error(t("DOCUMENT_ERROR"));
        await downloadShipmentInvoice(
          invoice.current,
          `Invoice-${row.trackingNumber}`,
        );
      } else {
        const blob = await shipmentDocumentBlob(url);
        downloadShipmentBlob(
          blob,
          `${mode}-${row.trackingNumber}.${blob.type.startsWith("image/") ? "png" : "pdf"}`,
        );
      }
    } catch (e) {
      setError(shipmentErrorMessage(e, t("DOCUMENT_ERROR")));
    } finally {
      setBusy(false);
    }
  }
  const value = decompressShipment(row),
    products = value.products || [];
  return (
    <>
      <div className="flex flex-wrap gap-8">
        {!!row.trackingNumber &&
          (user.role !== "user" || row.status !== "failed") && (
            <Button size="small" onClick={() => open("label")}>
              {t("LABEL")}
            </Button>
          )}
        {!!row.trackingUrl && (
          <Button
            size="small"
            component="a"
            href={row.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("TRACKING")}
          </Button>
        )}
        {row.method === "international" &&
          !!row.trackingNumber &&
          !!row.labelUrl && (
            <Button size="small" onClick={() => open("invoice")}>
              {t("INVOICE")}
            </Button>
          )}
        {row.method === "international" && !!row.imageUrl && (
          <Button size="small" onClick={() => open("image")}>
            {t("SHIPMENT_IMAGE")}
          </Button>
        )}
      </div>
      <Dialog
        open={!!mode}
        fullWidth
        maxWidth="lg"
        onClose={() => !busy && setMode("")}
      >
        <DialogTitle>
          {t(
            mode === "invoice"
              ? "INVOICE"
              : mode === "image"
                ? "SHIPMENT_IMAGE"
                : "LABEL",
          )}
        </DialogTitle>
        <DialogContent>
          {busy && <LinearProgress />}
          {error && (
            <Alert
              severity="error"
              action={
                <Button disabled={busy} onClick={() => open(mode)}>
                  {t("RETRY")}
                </Button>
              }
            >
              {error}
            </Alert>
          )}
          {!error &&
            (url ? (
              mode === "image" ? (
                <img
                  src={url}
                  alt={t("SHIPMENT_IMAGE")}
                  className="max-w-full mx-auto"
                  onError={() => setPreviewFailed(true)}
                />
              ) : (
                <iframe
                  title={t("DOCUMENT_PREVIEW")}
                  src={url}
                  className="w-full h-[65vh] border-0"
                />
              )
            ) : mode === "invoice" ? (
              <div
                ref={invoice}
                className="p-24 space-y-16 bg-white text-black"
                dir="ltr"
                data-testid="shipment-invoice"
              >
                <Typography variant="h5">
                  Ashamco Express — {t("COMMERCIAL_INVOICE")}
                </Typography>
                <Typography>
                  {row.shippingCompany?.name} · {row.trackingNumber} ·{" "}
                  {row.invoiceNumber} · {row.createdAt?.slice(0, 10)}
                </Typography>
                <Typography>
                  {row.user?.firstName} {row.user?.lastName} · {row.user?.email}
                </Typography>
                <div className="grid grid-cols-2 gap-24">
                  {(["sender", "receiver"] as const).map((prefix) => (
                    <div key={prefix}>
                      <Typography variant="h6">
                        {t(
                          prefix === "sender"
                            ? "SENDER_DETAILS"
                            : "RECEIVER_DETAILS",
                        )}
                      </Typography>
                      {(
                        [
                          "Name",
                          "Email",
                          "Phone",
                          "Phone1",
                          "CountryName",
                          "StateName",
                          "CityName",
                          "Street",
                          "ZipCode",
                        ] as const
                      ).map((field) => (
                        <Typography key={field}>
                          {value[`${prefix}${field}`]}
                        </Typography>
                      ))}
                    </div>
                  ))}
                </div>
                <Typography>{value.description}</Typography>
                <Typography>
                  {value.length} × {value.width} × {value.height} cm ·{" "}
                  {value.weight} kg · {value.packagesCount}{" "}
                  {t("PACKAGES_COUNT")}
                </Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("PRODUCT_NAME")}</TableCell>
                      <TableCell>{t("PRODUCT_PRICE")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>{Currency(item.price ?? 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Typography>
                  {t("TOTAL")}:{" "}
                  {Currency(
                    products.reduce(
                      (sum, item) => sum + Number(item.price || 0),
                      0,
                    ),
                  )}
                </Typography>
              </div>
            ) : null)}
          {previewFailed && (
            <Alert severity="warning">{t("PREVIEW_FAILED")}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={busy || !!error || (!url && mode !== "invoice")}
            onClick={download}
          >
            {t("DOWNLOAD")}
          </Button>
          {url && (
            <Button
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("OPEN_DOCUMENT")}
            </Button>
          )}
          <Button disabled={busy} onClick={() => setMode("")}>
            {t("CLOSE")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
