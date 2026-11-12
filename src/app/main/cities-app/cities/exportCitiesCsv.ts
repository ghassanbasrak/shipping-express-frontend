import axios from "app/configs/apiConfig";
import ICity from "../models/ICity";
import { GetCitiesApiArg, GetCitiesApiResponse } from "../CitiesApi";
import { displayName } from "../Utils";

const csvCell = (value: unknown) => {
  let text = String(value ?? "");
  // Keep spreadsheet programs from evaluating names supplied by the API.
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export async function exportCitiesCsv(
  filters: GetCitiesApiArg,
  labels: string[],
  onProgress: (done: number, total: number) => void,
) {
  const fileName = "Ashamco Express - Cities.csv";
  const picker = (window as typeof window & { showSaveFilePicker?: (options: object) => Promise<any> }).showSaveFilePicker;
  const handle = picker ? await picker.call(window, { suggestedName: fileName, types: [{ description: "CSV", accept: { "text/csv": [".csv"] } }] }) : null;
  const writer = handle ? await handle.createWritable() : null;
  const chunks: string[] = [];
  const write = async (chunk: string) => {
    if (writer) await writer.write(chunk);
    else chunks.push(chunk);
  };
  const selectedCarrier = filters.shippingCompanyIdFilter && filters.shippingCompanyIdFilter !== "all"
    ? filters.shippingCompanyIdFilter : undefined;
  const seen = new Set<string>();
  let page = 0;
  let total: number | undefined;
  try {
    await write(`\uFEFF${labels.map(csvCell).join(",")}\r\n`);
    do {
      const response = await axios.get<GetCitiesApiResponse>("v1/cities", { params: {
        page, pageSize: 2000,
        ...(filters.searchText ? { search: filters.searchText } : {}),
        ...(selectedCarrier ? { shippingCompanyId: selectedCarrier } : {}),
        ...(filters.countryIdFilter && filters.countryIdFilter !== "all" ? { countryId: filters.countryIdFilter } : {}),
        ...(filters.stateIdFilter && filters.stateIdFilter !== "all" ? { stateId: filters.stateIdFilter } : {}),
      } });
      const result = response.data;
      if (total === undefined) total = result.total;
      if (result.total !== total || (!result.results.length && seen.size < total))
        throw new Error("City results changed during export. Please retry.");
      const rows = selectedCarrier
        ? result.results.filter((city) => city.shipmentCities?.some((mapping) => mapping.shippingCompanyId === selectedCarrier))
        : result.results;
      if (selectedCarrier && rows.length !== result.results.length)
        throw new Error("City carrier filter was not applied by the API. Please retry later.");
      for (const city of result.results) {
        if (seen.has(city.id)) throw new Error("City results changed during export. Please retry.");
        seen.add(city.id);
      }
      const lines = rows.map((city: ICity) => [
        displayName(city.name), displayName(city.country?.name), displayName(city.state?.name),
        city.postalCode, city.shipmentCities?.length || 0, city.createdAt,
        ...(selectedCarrier ? [city.shipmentCities?.find((mapping) => mapping.shippingCompanyId === selectedCarrier)?.name || ""] : []),
      ].map(csvCell).join(",")).join("\r\n");
      if (lines) await write(`${lines}\r\n`);
      onProgress(seen.size, total);
      page += 1;
    } while (seen.size < (total || 0));
    if (writer) await writer.close();
    else {
      const url = URL.createObjectURL(new Blob(chunks, { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (error) {
    if (writer) await writer.abort().catch(() => {});
    throw error;
  }
}
