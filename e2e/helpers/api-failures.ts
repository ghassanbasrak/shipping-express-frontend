import type { Page } from "@playwright/test";

export const apiHost = new URL(
  process.env.E2E_API_URL ?? "https://api.v1.dev.e5hh6.ashamcoexpress.com",
).host;

export type ApiFailure = { method: string; url: string; status: number | string };
export type ApiCalls = { failures: ApiFailure[]; seen: string[] };

/**
 * Records every request to the backend API host: `seen` holds "METHOD /path" for
 * successful and failed responses, `failures` those that were >=400 or network-failed.
 */
export function collectApiCalls(page: Page): ApiCalls {
  const failures: ApiFailure[] = [];
  const seen: string[] = [];
  page.on("response", (response) => {
    const request = response.request();
    if (new URL(response.url()).host !== apiHost) return;
    if (request.method() === "OPTIONS") return;
    seen.push(`${request.method()} ${new URL(response.url()).pathname}`);
    if (response.status() >= 400) {
      failures.push({
        method: request.method(),
        url: response.url().replace(/\?.*/, ""),
        status: response.status(),
      });
    }
  });
  page.on("requestfailed", (request) => {
    if (new URL(request.url()).host !== apiHost) return;
    failures.push({
      method: request.method(),
      url: request.url().replace(/\?.*/, ""),
      status: request.failure()?.errorText ?? "failed",
    });
  });
  return { failures, seen };
}
