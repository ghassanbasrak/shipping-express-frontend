import { invoiceBodyTypes, toInvoiceBodyTypeComponent } from "../Utils";

function InvoiceBody(props) {
  const { type = invoiceBodyTypes.product } = props;
  const Body = toInvoiceBodyTypeComponent(type);
  return <Body {...props} />;
}

export default InvoiceBody;
