export default interface IAffiliateSummary {
  users?: number;
  profits?: number;
  pendingProfits?: number;
  shipments?: IAffiliateShipmentSummary;
}
export interface IAffiliateShipmentSummary {
  total?: number;
  delivered?: number;
  pending?: number;
  processing?: number;
}
