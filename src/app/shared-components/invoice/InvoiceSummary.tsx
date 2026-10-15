import { useTranslation } from "react-i18next";
import Currency from "src/app/main/utils/currencyFormatter";

function InvoiceSummary({
  summary,
  hideSubtotal = false,
  hideTax = false,
  hideShipping = false,
  hideDiscount = false,
  hideNotes = false,
}) {
  const { t } = useTranslation("public");
  return (
    <>
      <div className="invoiceSummary">
        <div className="summary">{t("INVOICE_SUMMARY")}</div>
        {!hideSubtotal && summary.subtotal && summary.subtotal > 0 && (
          <div className="summaryItem">
            <p>{`${t("INVOICE_SUBTOTAL")}`}</p>
            <h4>{Currency(summary.subtotal)}</h4>
          </div>
        )}
        {!hideTax && summary.tax && summary.tax > 0 && (
          <div className="summaryItem">
            <p>{`${t("INVOICE_TAX")}`}</p>
            <h4>{Currency(summary.tax)}</h4>
          </div>
        )}
        {!hideDiscount && summary.discount && summary.discount > 0 && (
          <div className="summaryItem">
            <p>{`${t("INVOICE_DISCOUNT")}`}</p>
            <h4>{Currency(summary.discount)}</h4>
          </div>
        )}
        {!hideShipping && summary.shipping && summary.shipping > 0 && (
          <div className="summaryItem">
            <p>{`${t("SHIPPING_COST")}`}</p>
            <h4>{Currency(summary.shipping)}</h4>
          </div>
        )}
        <div className="summaryItem">
          <p>{`${t("INVOICE_TOTAL")}`}</p>
          <h4 style={{ color: "black", fontSize: "18px", lineHeight: "8px" }}>
            {Currency(summary.total)}
          </h4>
        </div>
      </div>

      {!hideNotes && summary.notes && (
        <div className="note">
          <h4 style={{ marginLeft: "-10px" }}>{t("INVOICE_NOTES")}</h4>
          <p style={{ fontSize: "14px" }}>{summary.notes}</p>
        </div>
      )}
    </>
  );
}

export default InvoiceSummary;