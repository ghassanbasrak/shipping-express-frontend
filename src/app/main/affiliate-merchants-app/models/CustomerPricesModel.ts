import IMerchant from "../../merchants-app/models/IMerchant";
import IShippingCompany from "../../shipping-companies-app/models/IShippingCompany";
export type CustomerPriceFormRow = {
  shippingCompanyId: string;
  name: string;
  localEnabled: boolean;
  codEnabled: boolean;
  mainLocalPrice: number;
  mainCodPrice: number;
  localProfits: number;
  codProfits: number;
  internationalDiscountRate?: number;
};
export type CustomerPricesForm = { prices: CustomerPriceFormRow[] };
const positive = (value?: number) =>
  Number.isFinite(value) && value > 0 ? value : undefined;
export default function CustomerPricesModel(
  affiliate: IMerchant,
  customer: IMerchant,
  carriers: IShippingCompany[],
): CustomerPricesForm {
  const byId = new Map(carriers.map((carrier) => [carrier.id, carrier]));
  for (const price of customer.prices || [])
    if (price.shippingCompanyId && !byId.has(price.shippingCompanyId))
      byId.set(
        price.shippingCompanyId,
        price.shippingCompany || {
          id: price.shippingCompanyId,
          name: price.shippingCompanyId,
        },
      );
  return {
    prices: [...byId.values()].map((carrier) => {
      const existing = customer.prices?.find(
          (p) => p.shippingCompanyId === carrier.id,
        ),
        parent = affiliate.prices?.find(
          (p) => p.shippingCompanyId === carrier.id,
        ),
        localEnabled =
          carrier.shippingMethods?.includes("local") ||
          existing?.localPrice != null,
        codEnabled =
          carrier.shippingMethods?.includes("cashOnDelivery") ||
          existing?.codPrice != null,
        mainLocalPrice =
          positive(parent?.localPrice) ?? carrier.localPrice ?? 0,
        mainCodPrice = positive(parent?.codPrice) ?? carrier.codPrice ?? 0;
      return {
        shippingCompanyId: carrier.id,
        name: carrier.name || carrier.id,
        localEnabled: !!localEnabled,
        codEnabled: !!codEnabled,
        mainLocalPrice,
        mainCodPrice,
        localProfits:
          (positive(existing?.localPrice) ?? mainLocalPrice) - mainLocalPrice,
        codProfits:
          (positive(existing?.codPrice) ?? mainCodPrice) - mainCodPrice,
        ...(existing?.internationalDiscountRate > 0
          ? { internationalDiscountRate: existing.internationalDiscountRate }
          : {}),
      };
    }),
  };
}
export const customerPricesPayload = (values: CustomerPricesForm) =>
  values.prices
    .map((row) => ({
      shippingCompanyId: row.shippingCompanyId,
      ...(row.localEnabled
        ? { localPrice: row.mainLocalPrice + row.localProfits }
        : {}),
      ...(row.codEnabled
        ? { codPrice: row.mainCodPrice + row.codProfits }
        : {}),
      ...(row.internationalDiscountRate > 0
        ? { internationalDiscountRate: row.internationalDiscountRate }
        : {}),
    }))
    .filter(
      (row) =>
        row.localPrice > 0 ||
        row.codPrice > 0 ||
        row.internationalDiscountRate > 0,
    );
