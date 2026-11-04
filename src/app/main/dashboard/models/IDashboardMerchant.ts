export default interface IDashboardMerchant {
  merchant_name?: string;
  total_sales?: number | string | null;
  orders_count?: number | string | null;
  growth_percentage?: number | string | null;
  currency?: string;
}
