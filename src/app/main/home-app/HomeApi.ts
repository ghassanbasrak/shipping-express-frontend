import { apiService as api } from "app/store/apiService";
import IHomeSummary from "./models/IHomeSummary";
import IMerchant from "../merchants-app/models/IMerchant";
import IShipment from "../shipments-app/models/IShipment";
export const addTagTypes = [
  "HomeOverview",
  "ShippingCompanies",
  "ShipmentSummary",
  "Shipments",
  "Merchant",
  "ShipmentAccount",
] as const;
const HomeApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getHomeSummary: build.query<IHomeSummary, string>({
      query: () => ({ url: "v1/configs" }),
      providesTags: ["HomeOverview", "ShipmentSummary"],
    }),
    getHomeAccount: build.query<IMerchant, string>({
      query: () => ({ url: "v1/users/me" }),
      providesTags: ["HomeOverview", "Merchant", "ShipmentAccount"],
    }),
    getHomeShipments: build.query<
      { results: IShipment[]; total: number },
      string
    >({
      query: () => ({ url: "v1/shipments", params: { page: 0, pageSize: 6 } }),
      providesTags: ["HomeOverview", "Shipments"],
    }),
  }),
});
export const {
  useGetHomeSummaryQuery,
  useGetHomeAccountQuery,
  useGetHomeShipmentsQuery,
} = HomeApi;
export default HomeApi;
