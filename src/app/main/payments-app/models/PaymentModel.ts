import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IPayment from "./IPayment";
import { paymentType, paymentStatus } from "../Utils";
const PaymentModel = (data: PartialDeep<IPayment> = {}): IPayment =>
  _.defaultsDeep({}, data, {
    id: "",
    amount: 0,
    total: 0,
    feeTotal: 0,
    taxTotal: 0,
    isPlan: false,
    type: paymentType.topup,
    status: paymentStatus.pending,
  });
export const paymentDefaultValues = PaymentModel();
export const paymentEditableFields = ["amount"];
export default PaymentModel;
