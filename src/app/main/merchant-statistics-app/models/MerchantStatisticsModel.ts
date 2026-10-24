import type { MerchantStatisticsForm } from "./MerchantStatisticsSchema";
export default function MerchantStatisticsModel(): MerchantStatisticsForm {
  const dateTo = new Date();
  const dateFrom = new Date(dateTo);
  dateFrom.setMonth(dateTo.getMonth() - 6);
  return { userId: "", user: null, dateFrom, dateTo };
}
