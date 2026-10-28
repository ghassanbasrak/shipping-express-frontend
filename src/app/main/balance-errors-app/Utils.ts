import { format } from "date-fns";
import type { User } from "src/app/auth/user";
import { hasOperationPermission } from "src/app/auth/permissions";
import type { LocaleString } from "../utils/commonTypes";
import type { GetBalanceErrorsApiResponse } from "./BalanceErrorsApi";
import IBalanceError from "./models/IBalanceError";
export const canViewBalanceErrors = (user: User) =>
  user.role !== "user" &&
  hasOperationPermission("balance-duplication-errors", "view", user);
export const toBalanceErrorStatusTitle = (repeated?: boolean) =>
  repeated ? "BALANCE_DUPLICATION" : "COMPLETED_TRANSACTION";
export const toBalanceErrorStatusColor = (repeated?: boolean) =>
  repeated ? "bg-red-600" : "bg-green-600";
export const isBalanceErrorDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number),
    date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};
export const balanceErrorApiDate = (value: string) => {
  if (!isBalanceErrorDate(value)) throw new Error("Invalid date");
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
};
export const balanceErrorToday = (date = new Date()) =>
  format(date, "yyyy-MM-dd");
export const balanceErrorDate = (value?: string) =>
  value && Number.isFinite(new Date(value).getTime())
    ? format(new Date(value), "dd/MM/yyyy HH:mm")
    : "";
export const balanceErrorText = (
  value: LocaleString | string | undefined,
  language: string,
) =>
  typeof value === "string"
    ? value
    : value?.[language.split("-")[0]] || value?.ar || value?.en || "";
export const balanceErrorNumber = (value: IBalanceError) =>
  value.transactionNumber || value.id || value._id || "";
export type BalanceErrorRow = { id: string; transaction: IBalanceError };
// Projection only: retain raw transaction IDs and every repeated occurrence.
export const balanceErrorRows = (
  report: GetBalanceErrorsApiResponse,
): BalanceErrorRow[] =>
  (report.users || []).flatMap((owner, ui) =>
    (owner.groups || []).flatMap((group, gi) =>
      (group.transactions || []).map((transaction, ti) => ({
        id: `balance-${ui}-${gi}-${ti}`,
        transaction:
          transaction.user ||
          !owner.user ||
          (transaction.userId &&
            transaction.userId !== (owner.userId || owner.user.id))
            ? transaction
            : {
                ...transaction,
                user: owner.user,
                userId: transaction.userId || owner.userId || owner.user.id,
              },
      })),
    ),
  );
