import { Divider, styled } from "@mui/material";
import InvoiceHeader from "./InvoiceHeader";
import InvoiceDetails from "./InvoiceDetails";
import InvoiceBody from "./body/InvoiceBody";
import InvoiceSummary from "./InvoiceSummary";
import { forwardRef } from "react";

const Root = styled("div")(({ theme }) => ({
  "&, & *": {
    fontFamily:
      theme.direction === "rtl"
        ? "'Cairo', sans-serif !important"
        : "'Inter var', sans-serif !important",
  },
  ".pageLayout": { display: "flex" },
  ".header": {
    display: "flex",
    padding: "50px",
    justifyContent: "space-between",
  },
  ".buttons": {
    marginTop: "40px",
    marginLeft: "15%",
    marginRight: "12%",
    marginBottom: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  ".btn": {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #1976d2",
    borderRadius: "50px",
    padding: "12px 30px 12px 20px",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    whiteSpace: "nowrap",
    margin: "10px",
    fontSize: "16px",
    height: "54px",
  },
  ".btn:hover": { backgroundColor: "rgb(243, 243, 243)" },
  ".downloadBtn": { width: "20%" },
  "@media all and (max-width: 768px)": [
    {
      ".buttons": {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
      },
      ".downloadBtn": { width: "100%" },
      ".btn": { width: "100%" },
    },
    {
      ".invoiceLayout": { width: "97%" },
      ".space": { width: "50%" },
      ".invoiceSummary div": { marginLeft: "0%" },
    },
  ],
  ".invoiceNumber": {
    textAlign: "right",
    border: "none",
    outline: "none",
    fontSize: "15px",
    color: "gray",
  },
  ".invoiceLayout": {
    minHeight: "500px",
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
  },
  ".contacts": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 40px",
    borderTop: "1px rgb(221, 221, 221) solid",
  },
  ".contacts p": { fontSize: "14px", color: "gray", lineHeight: "8px" },
  ".contacts h4": {
    fontSize: "15px",
    // fontFamily: '"Roboto", Tahoma, Geneva, Verdana, sans-serif',
    color: "gray",
  },
  ".summaryItem p, h4": { padding: "12px" },
  ".address": { textAlign: "left" },
  ".dates": { textAlign: "right" },
  ".form": { padding: "0 40px 40px 40px !important" },
  ".table": {
    borderCollapse: "collapse",
    width: "100%",
  },
  "table td, table th": { borderBottom: "1px solid #ddd" },
  "table tr:nth-child(even)": { backgroundColor: "#fafafa" },
  "table tr:hover": { backgroundColor: "rgb(243, 243, 243)" },
  thead: { paddingLeft: "100px" },
  "table th": {
    paddingTop: "12px",
    paddingBottom: "12px",
    backgroundColor: "#f5f5f5",
    color: "rgb(59, 59, 59)",
    borderTop: "1px rgb(212, 212, 212) solid",
    borderBottom: "1px rgb(212, 212, 212) solid",
    fontSize: "14px",
  },
  'tr input[type="text"]': {
    background: "transparent",
    MozAppearance: "textfield",
  },
  ".number": { width: "12%", padding: "5px" },
  '.number input[type="number"]': {
    width: "100%",
    height: "35px",
    border: "none",
    outline: "none",
    background: "none",
    fontSize: "15px",
    color: "rgb(59, 59, 59)",
    MozAppearance: "textfield",
  },
  ".amount": {
    width: "100%",
    height: "45px",
    border: "none !important",
    outline: "none",
    background: "none",
    fontSize: "15px",
  },
  ".discount": {
    width: "100%",
    height: "45px",
    border: "none !important",
    outline: "none",
    background: "none",
    fontSize: "15px",
  },
  '.item input[type="text"]': {
    width: "90%",
    height: "35px",
    border: "none",
    outline: "none",
    background: "none",
    color: "rgb(59, 59, 59)",
  },
  ".invoiceSummary div": {
    borderBottom: "1px solid rgb(231, 231, 231)",
    textAlign: "left",
    marginLeft: "50%",
    fontSize: "14px",
    display: "flex",
    color: "gray",
  },
  ".summary": {
    backgroundColor: "rgb(247, 247, 247)",
    fontWeight: 500,
    padding: "15px 0px",
    paddingLeft: "15px",
  },
  ".summaryItem": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ".summaryItem input": {
    fontSize: "15px",
    border: "none",
    outline: "none",
    textAlign: "right",
  },
  ".toolBar": { marginTop: "50px" },
  ".summaryItem span": { textAlign: "left" },
  ".note": {
    margin: "50px 20px",
    textAlign: "left",
    borderTop: "solid 1px #b7b7b7",
  },
  ".space": { width: "75%" },
  ".totalUnpaid": {
    textAlign: "center",
    paddingTop: "2px",
    width: "20px",
    height: "20px",
    fontSize: "14px !important",
    fontWeight: "400 !important",
    borderRadius: "100%",
    backgroundColor: "green",
  },

  ".headerContainer": {
    paddingTop: theme.spacing(1),
    paddingLeft: theme.spacing(5),
    paddingRight: theme.spacing(1),
    backgroundColor: "#f2f2f2",
    borderRadius: "10px 10px 0px 0px",
  },
  display: "flex",
  "& > *": {
    margin: theme.spacing(1),
  },
}));
const Invoice = forwardRef((props, ref) => {
  return (
    <Root className="pageLayout" ref={ref}>
      <div className="invoiceLayout w-xl print:w-auto m-0">
        <InvoiceHeader {...props} />
        <Divider />
        <InvoiceDetails {...props} />
        <div className="form">
          <InvoiceBody {...props} />
          <InvoiceSummary {...props} />
        </div>
      </div>
    </Root>
  );
});

export default Invoice;
