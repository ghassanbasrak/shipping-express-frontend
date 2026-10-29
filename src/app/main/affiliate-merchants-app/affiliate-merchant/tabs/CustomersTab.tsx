import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Pagination,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import FuseLoading from "@fuse/core/FuseLoading";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import Currency from "../../../utils/currencyFormatter";
import { useGetAffiliateCustomersQuery } from "../../AffiliateMerchantsApi";
import { useGetShippingCompaniesQuery } from "../../../shipping-companies-app/ShippingCompaniesApi";
import IMerchant from "../../../merchants-app/models/IMerchant";
import { canEditCustomerPrices, canViewAffiliateCustomers } from "../../Utils";
import CustomerPricesDialog from "../../shared-components/CustomerPricesDialog";
export default function CustomersTab({ affiliate }: { affiliate: IMerchant }) {
  const { t } = useTranslation("affiliateMerchantsApp"),
    user = useAppSelector(selectUser),
    [page, setPage] = useState(0),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<IMerchant>(),
    query = useGetAffiliateCustomersQuery(
      { affiliateId: affiliate.id, page, searchText: search },
      {
        skip: !canViewAffiliateCustomers(user),
        refetchOnMountOrArgChange: true,
      },
    ),
    carriers = useGetShippingCompaniesQuery(
      { page: 0, pageSize: 50 },
      { skip: !canViewAffiliateCustomers(user) },
    );
  useEffect(() => {
    if (
      query.currentData &&
      !query.isFetching &&
      page > Math.max(0, Math.ceil(query.currentData.total / 16) - 1)
    )
      setPage(Math.max(0, Math.ceil(query.currentData.total / 16) - 1));
  }, [query.currentData, query.isFetching, page]);
  return (
    <div className="space-y-16" data-testid="affiliate-customers">
      <TextField
        value={search}
        label={t("SEARCH_CUSTOMERS")}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        fullWidth
        inputProps={{ "data-testid": "affiliate-customers-search" }}
      />
      {query.isError ? (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => query.refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("LOAD_ERROR")}
        </Alert>
      ) : query.isFetching ? (
        <FuseLoading />
      ) : !query.currentData?.results.length ? (
        <Typography>{t("NO_CUSTOMERS")}</Typography>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-16">
          {query.currentData.results.map((customer) => (
            <Card key={customer.id || customer._id}>
              <CardContent className="space-y-16">
                <Typography className="font-bold">
                  {`${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                    customer.email}
                </Typography>
                <Typography>
                  {t("SHIPMENTS_COUNT", {
                    count: customer.shipmentsCount || 0,
                  })}
                </Typography>
                {customer.loyaltyType === "normal" ||
                !customer.prices?.length ? (
                  <Typography>{t("NO_CUSTOM_PRICES_DEFINED")}</Typography>
                ) : (
                  customer.prices.map((price) => (
                    <div
                      key={price.shippingCompanyId}
                      className="flex flex-wrap gap-12"
                    >
                      <Typography>
                        {price.shippingCompany?.name ||
                          carriers.data?.results.find(
                            (c) => c.id === price.shippingCompanyId,
                          )?.name ||
                          price.shippingCompanyId}
                      </Typography>
                      <Typography>
                        {t("LOCAL_COST")}:{" "}
                        {price.localPrice != null
                          ? Currency(price.localPrice)
                          : "—"}
                      </Typography>
                      <Typography>
                        {t("COD_COST")}:{" "}
                        {price.codPrice != null
                          ? Currency(price.codPrice)
                          : "—"}
                      </Typography>
                    </div>
                  ))
                )}
                {canEditCustomerPrices(user) && (
                  <Button
                    color="primary"
                    variant="outlined"
                    disabled={
                      !carriers.currentData ||
                      carriers.isFetching ||
                      carriers.isError
                    }
                    onClick={() =>
                      setSelected({
                        ...structuredClone(customer),
                        id: customer.id || customer._id,
                      })
                    }
                    data-testid={`edit-customer-${customer.id || customer._id}`}
                  >
                    {t("EDIT_PRICES")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {carriers.isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => carriers.refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("LOAD_CARRIERS_ERROR")}
        </Alert>
      )}
      <Pagination
        page={page + 1}
        count={Math.max(1, Math.ceil((query.data?.total || 0) / 16))}
        onChange={(_, value) => setPage(value - 1)}
      />
      {selected && carriers.currentData && (
        <CustomerPricesDialog
          key={selected.id}
          affiliate={affiliate}
          customer={selected}
          carriers={carriers.currentData.results}
          onClose={() => setSelected(undefined)}
        />
      )}
    </div>
  );
}
