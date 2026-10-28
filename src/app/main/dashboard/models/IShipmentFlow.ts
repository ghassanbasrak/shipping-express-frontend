export default interface IShipmentFlow {
  order?: number | string | null;
  processing?: number | string | null;
  delivered?: number | string | null;
  canceled?: number | string | null;
  returned?: number | string | null;
  refundedToCustomer?: number | string | null;
}
