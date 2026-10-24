import MerchantStatisticsModel from "../../merchant-statistics-app/models/MerchantStatisticsModel";
import type { MerchantStatisticsForm } from "./MerchantStatisticsSchema";
export default function MerchantStatisticsNewModel(): MerchantStatisticsForm {
  return { ...MerchantStatisticsModel(), bankTransferTotals: 0, otherFees: 0 };
}
