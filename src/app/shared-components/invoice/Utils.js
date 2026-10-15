import PaymentInvoiceBody from "./body/PaymentInvoiceBody";
import ProductInvoiceBody from "./body/ProductInvoiceBody";

export const invoiceBodyTypes = {
  payment: "payment",
  product: "product",
};

export const toInvoiceBodyTypeComponent = (type) => {
  switch (type) {
    case invoiceBodyTypes.payment:
      return PaymentInvoiceBody;
    case invoiceBodyTypes.product:
      return ProductInvoiceBody;
  }
  return ProductInvoiceBody;
};
