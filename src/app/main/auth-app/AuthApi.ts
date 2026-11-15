import api from "app/store/apiService";
export type Place = {
  id: string;
  name: { ar?: string; en?: string };
  code?: string;
};
const authApi = api
  .enhanceEndpoints({
    addTagTypes: ["AuthPlaces"] as const,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      getAuthPlaces: build.query<
        { results: Place[]; total: number },
        {
          kind: "countries" | "states" | "cities";
          countryId?: string;
          stateId?: string;
          search?: string;
        }
      >({
        providesTags: (_, __, args) => [{ type: "AuthPlaces", id: args.kind }],
        query: ({ kind, ...filters }) => ({
          url: `v1/${kind}`,
          params: { page: 0, pageSize: 500, ...filters },
        }),
      }),
    }),
  });
export const { useGetAuthPlacesQuery } = authApi;
export default authApi;
