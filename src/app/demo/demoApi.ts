import axios from "app/configs/apiConfig";
import { AxiosRequestConfig } from "axios";
import MockAdapter from "axios-mock-adapter";
import ICountry, { IShipmentCountry } from "src/app/main/countries-app/models/ICountry";
import IShippingCompany from "src/app/main/shipping-companies-app/models/IShippingCompany";
import { demoStorageKey } from "./demoMode";

type DemoState = {
  id: string;
  countryId: string;
  name: { en: string; ar: string };
  code: string;
  createdAt: string;
  shippingCompanyIds: string[];
};
type DemoCity = { id: string; stateId: string; name: { en: string; ar: string } };
type DemoDb = {
  countries: ICountry[];
  shippingCompanies: IShippingCompany[];
  shipmentCountries: IShipmentCountry[];
  states: DemoState[];
  cities: DemoCity[];
};

const stamp = "2025-10-18T09:00:00.000Z";
const logo = "/assets/images/logo/logo.png";
const carrierNames = [
  "Nile Express",
  "Desert Parcel",
  "Falcon Delivery",
  "Cedar Logistics",
  "Oasis Courier",
  "Red Sea Shipping",
];
const places: [string, string, string, string][] = [
  ["EG", "Egypt", "مصر", "+20"],
  ["SA", "Saudi Arabia", "السعودية", "+966"],
  ["AE", "United Arab Emirates", "الإمارات", "+971"],
  ["JO", "Jordan", "الأردن", "+962"],
  ["KW", "Kuwait", "الكويت", "+965"],
  ["BH", "Bahrain", "البحرين", "+973"],
  ["QA", "Qatar", "قطر", "+974"],
  ["OM", "Oman", "عُمان", "+968"],
  ["LB", "Lebanon", "لبنان", "+961"],
  ["MA", "Morocco", "المغرب", "+212"],
  ["TN", "Tunisia", "تونس", "+216"],
  ["DZ", "Algeria", "الجزائر", "+213"],
  ["IQ", "Iraq", "العراق", "+964"],
  ["TR", "Turkey", "تركيا", "+90"],
  ["GB", "United Kingdom", "المملكة المتحدة", "+44"],
  ["DE", "Germany", "ألمانيا", "+49"],
  ["FR", "France", "فرنسا", "+33"],
  ["US", "United States", "الولايات المتحدة", "+1"],
];

function seedDb(): DemoDb {
  const shippingCompanies: IShippingCompany[] = carrierNames.map((name, index) => ({
    id: `demo-carrier-${index + 1}`,
    name,
    serviceName: `${name} Service`,
    hasState: true,
    isEnglish: index % 2 === 0,
    isActive: index !== 4,
    shippingMethods: ["local", "cashOnDelivery", "international"],
    localPrice: 35 + index * 5,
    codPrice: 10 + index * 2,
    maxWeight: 20,
    extraWeightPrice: 8,
    returnFees: 15,
    internationalProfitsRate: 5,
    internationalProfitsExtras: 10,
    shipmentFees: 5,
    shipmentCodFees: 2,
    shipmentExtraWeightFees: 2,
    shipmentReturnFees: 4,
    color: ["#236A9E", "#B77B22", "#506F42", "#85599D", "#2C8B87", "#B05454"][index],
    logoUrl: logo,
    iconUrl: logo,
    shipmentsCount: 120 - index * 13,
    packageRequestsCount: 18 + index * 3,
    createdAt: stamp,
  }));
  const countries: ICountry[] = places.map(([code, en, ar, dialCode], index) => ({
    id: `demo-country-${code.toLowerCase()}`,
    name: { en, ar },
    code,
    dialCode,
    subzoneName: { en: "Region", ar: "المنطقة" },
    createdAt: new Date(Date.UTC(2025, index % 12, 2 + (index % 20))).toISOString(),
    updatedAt: stamp,
  }));
  const shipmentCountries: IShipmentCountry[] = countries.flatMap((country, index) =>
    shippingCompanies
      .filter((_, carrierIndex) => (index + carrierIndex) % 3 !== 2)
      .map((company) => ({
        id: `demo-map-${country.code}-${company.id}`,
        countryId: country.id,
        shippingCompanyId: company.id,
        name: country.name?.en || "",
        isActive: company.isActive,
      })),
  );
  const regionNames: Record<string, [string, string, string, string][]> = {
    EG: [["Cairo", "القاهرة", "Giza", "الجيزة"], ["Alexandria", "الإسكندرية", "Aswan", "أسوان"]],
    SA: [["Riyadh", "الرياض", "Jeddah", "جدة"], ["Makkah", "مكة", "Dammam", "الدمام"]],
    AE: [["Dubai", "دبي", "Abu Dhabi", "أبو ظبي"], ["Sharjah", "الشارقة", "Ajman", "عجمان"]],
  };
  const states: DemoState[] = countries.flatMap((country) => {
    const regions = regionNames[country.code || ""] || [
      ["Central Region", "المنطقة الوسطى", "North Region", "المنطقة الشمالية"],
    ];
    return regions.flatMap(([first, firstAr, second, secondAr], group) =>
      [
        { en: first, ar: firstAr },
        { en: second, ar: secondAr },
      ].map((name, index) => ({
        id: `demo-state-${country.code}-${group}-${index}`,
        countryId: country.id,
        name,
        code: `${country.code}-${group * 2 + index + 1}`,
        createdAt: stamp,
        shippingCompanyIds: shippingCompanies
          .filter((company) => shipmentCountries.some((row) => row.countryId === country.id && row.shippingCompanyId === company.id))
          .map((company) => company.id),
      })),
    );
  });
  const cities: DemoCity[] = states.map((state) => ({
    id: `demo-city-${state.id}`,
    stateId: state.id,
    name: state.name,
  }));
  return { countries, shippingCompanies, shipmentCountries, states, cities };
}

function loadDb(): DemoDb {
  try {
    const stored = localStorage.getItem(demoStorageKey);
    if (stored) {
      const value = JSON.parse(stored) as DemoDb;
      if (
        Array.isArray(value.countries) &&
        Array.isArray(value.shippingCompanies) &&
        Array.isArray(value.shipmentCountries) &&
        Array.isArray(value.states) &&
        Array.isArray(value.cities)
      ) return value;
    }
  } catch {
    // An old or corrupt demo snapshot is replaced with the current seed.
  }
  const value = seedDb();
  localStorage.setItem(demoStorageKey, JSON.stringify(value));
  return value;
}

let db: DemoDb;
function saveDb() {
  localStorage.setItem(demoStorageKey, JSON.stringify(db));
}

const result = (rows: unknown[], page: unknown, pageSize: unknown) => {
  const start = Math.max(0, Number(page) || 0) * Math.max(1, Number(pageSize) || 10);
  return {
    results: rows.slice(start, start + Math.max(1, Number(pageSize) || 10)),
    total: rows.length,
  };
};
const search = (value: unknown, term: unknown) =>
  !term || JSON.stringify(value).toLowerCase().includes(String(term).toLowerCase());
const bodyOf = (config: AxiosRequestConfig): Record<string, unknown> => {
  try {
    return typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
  } catch {
    return {};
  }
};
const now = () => new Date().toISOString();
const idOf = () => `demo-${crypto.randomUUID()}`;
const countryWithMappings = (country: ICountry) => ({
  ...country,
  shipmentCountries: db.shipmentCountries.filter((row) => row.countryId === country.id),
});
const companyWithCounts = (company: IShippingCompany) => ({
  ...company,
  shipmentCountriesCount: db.shipmentCountries.filter((row) => row.shippingCompanyId === company.id).length,
  shipmentStatesCount: db.states.filter((row) => row.shippingCompanyIds.includes(company.id)).length,
  shipmentCitiesCount: db.cities.filter((city) => db.states.some((state) => state.id === city.stateId && state.shippingCompanyIds.includes(company.id))).length,
});

function handle(config: AxiosRequestConfig): [number, unknown] {
  const path = new URL(config.url || "", `${axios.defaults.baseURL}/`).pathname.replace(/^\//, "");
  const method = (config.method || "get").toLowerCase();
  const params = config.params || {};
  const data = bodyOf(config);
  const parts = path.split("/");
  if (parts[0] !== "v1") return [501, { message: `No demo handler for ${method.toUpperCase()} ${path}` }];
  const resource = parts[1];
  const id = parts[2];

  if (resource === "languages" && method === "get") return [200, { results: ["en", "ar"] }];

  if (resource === "shipping-companies") {
    if (method === "get" && !id) {
      const rows = db.shippingCompanies.filter((company) => search(company.name, params.search)).map(companyWithCounts);
      return [200, result(rows, params.page, params.pageSize)];
    }
    const index = db.shippingCompanies.findIndex((company) => company.id === id);
    if (method === "get") return index < 0 ? [404, { message: "Shipping company not found" }] : [200, companyWithCounts(db.shippingCompanies[index])];
    if (method === "post" && !id) {
      const company = { ...data, id: idOf(), createdAt: now(), updatedAt: now() } as unknown as IShippingCompany;
      db.shippingCompanies.push(company);
      saveDb();
      return [201, companyWithCounts(company)];
    }
    if (index < 0) return [404, { message: "Shipping company not found" }];
    if (method === "patch") {
      db.shippingCompanies[index] = { ...db.shippingCompanies[index], ...data, id, updatedAt: now() } as IShippingCompany;
      saveDb();
      return [200, companyWithCounts(db.shippingCompanies[index])];
    }
    if (method === "delete") {
      db.shippingCompanies.splice(index, 1);
      db.shipmentCountries = db.shipmentCountries.filter((row) => row.shippingCompanyId !== id);
      saveDb();
      return [200, {}];
    }
  }

  if (resource === "countries") {
    if (method === "get" && !id) {
      let rows = db.countries.map(countryWithMappings).filter((country) => search([country.name, country.code, country.dialCode], params.search));
      if (params.shippingCompanyId && params.shippingCompanyId !== "all")
        rows = rows.filter((country) => country.shipmentCountries.some((row) => row.shippingCompanyId === params.shippingCompanyId));
      if (params.dateFrom) rows = rows.filter((country) => (country.createdAt || "") >= params.dateFrom);
      if (params.dateTo) rows = rows.filter((country) => (country.createdAt || "") <= params.dateTo);
      return [200, result(rows, params.page, params.pageSize)];
    }
    const index = db.countries.findIndex((country) => country.id === id);
    if (method === "get") return index < 0 ? [404, { message: "Country not found" }] : [200, countryWithMappings(db.countries[index])];
    if (method === "post" && !id) {
      const country = { ...data, id: idOf(), createdAt: now(), updatedAt: now() } as unknown as ICountry;
      db.countries.push(country);
      saveDb();
      return [201, country];
    }
    if (index < 0) return [404, { message: "Country not found" }];
    if (method === "patch") {
      db.countries[index] = { ...db.countries[index], ...data, id, updatedAt: now() } as ICountry;
      saveDb();
      return [200, db.countries[index]];
    }
    if (method === "delete") {
      db.countries.splice(index, 1);
      db.states = db.states.filter((state) => state.countryId !== id);
      saveDb();
      return [200, {}];
    }
  }

  if (resource === "shipment-countries") {
    if (method === "get" && !id) {
      const rows = db.shipmentCountries.filter((row) => !params.countryId || row.countryId === params.countryId);
      return [200, result(rows, params.page, params.pageSize)];
    }
    const index = db.shipmentCountries.findIndex((row) => row.id === id);
    if (method === "post" && !id) {
      if (!db.countries.some((country) => country.id === data.countryId) || !db.shippingCompanies.some((company) => company.id === data.shippingCompanyId))
        return [400, { message: "Invalid country or shipping company" }];
      const duplicate = db.shipmentCountries.some((row) => row.countryId === data.countryId && row.shippingCompanyId === data.shippingCompanyId);
      if (duplicate) return [409, { message: "Mapping already exists" }];
      const row = { ...data, id: idOf() } as IShipmentCountry;
      db.shipmentCountries.push(row);
      saveDb();
      return [201, row];
    }
    if (index < 0) return [404, { message: "Mapping not found" }];
    if (method === "patch") {
      db.shipmentCountries[index] = { ...db.shipmentCountries[index], ...data, id } as IShipmentCountry;
      saveDb();
      return [200, db.shipmentCountries[index]];
    }
    if (method === "delete") {
      db.shipmentCountries.splice(index, 1);
      saveDb();
      return [200, {}];
    }
  }

  if (resource === "states" && method === "get") {
    const rows = db.states.filter((state) =>
      (!params.countryId || state.countryId === params.countryId) &&
      (!params.shippingCompanyId || params.shippingCompanyId === "all" || state.shippingCompanyIds.includes(params.shippingCompanyId)) &&
      search([state.name, state.code], params.search),
    );
    return [200, result(rows, params.page, params.pageSize)];
  }
  if (resource === "cities" && method === "get") {
    const rows = db.cities.filter((city) => !params.stateId || city.stateId === params.stateId);
    return [200, result(rows, params.page, params.pageSize)];
  }
  return [501, { message: `No demo handler for ${method.toUpperCase()} ${path}` }];
}

export function installDemoApi() {
  db = loadDb();
  const mock = new MockAdapter(axios, { delayResponse: 80 });
  mock.onAny().reply(handle);
}
