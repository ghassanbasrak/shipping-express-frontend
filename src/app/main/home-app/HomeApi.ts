import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import type IShippingCompany from "../shipping-companies-app/models/IShippingCompany";

export const homeTagTypes = ["HomeOverview", "ShipmentSummary", "Shipments", "Merchant", "ShipmentAccount"] as const;
const HomeApi = api.enhanceEndpoints({ addTagTypes: homeTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getHomeSummary: build.query<GetHomeSummaryApiResponse, string>({
      query: () => ({ url: "v1/configs" }),
      providesTags: ["HomeOverview", "ShipmentSummary"],
    }),
    getHomeAccount: build.query<GetHomeAccountApiResponse, string>({
      query: () => ({ url: "v1/users/me" }),
      providesTags: ["HomeOverview", "Merchant", "ShipmentAccount"],
    }),
    getHomeShipments: build.query<GetHomeShipmentsApiResponse, string>({
      query: () => ({
        url: "v1/shipments",
        params: { page: 0, pageSize: 6 },
      }),
      providesTags: ["HomeOverview", "Shipments"],
    }),
  }),
  overrideExisting: false,
});

export type GetHomeSummaryApiResponse = {
  activeShipments?: number | string | null;
  canceledShipments?: number | string | null;
  localShipments?: number | string | null;
  internationalShipments?: number | string | null;
};
export type GetHomeAccountApiResponse = User;
// A read-only preview response; the shipment entity remains owned by shipments-app.
export type HomeShipmentPreview = {
  id: string;
  userId?: string;
  trackingNumber?: string;
  status?: string;
  shippingCompanyId?: string;
  shippingCompany?: IShippingCompany;
  createdAt?: string;
};
export type GetHomeShipmentsApiResponse = {
  results: HomeShipmentPreview[];
  total: number;
};
export const {
  useGetHomeSummaryQuery,
  useGetHomeAccountQuery,
  useGetHomeShipmentsQuery,
} = HomeApi;
export default HomeApi;
