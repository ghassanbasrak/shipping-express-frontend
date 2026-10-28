export default interface IHomeSummary {
  activeShipments?: number | string | null;
  canceledShipments?: number | string | null;
  localShipments?: number | string | null;
  internationalShipments?: number | string | null;
}
