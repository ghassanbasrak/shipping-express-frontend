// Explicitly invoked audit of the supplied development API. Credentials and
// session tokens stay in process memory and are never written to reports.
const fs = require("node:fs"),
  path = require("node:path"),
  readline = require("node:readline");
const base = "https://api.v1.dev.e5hh6.ashamcoexpress.com";
const output = path.resolve(__dirname, "../test-results/storage-live");
fs.mkdirSync(output, { recursive: true });
const actors = {},
  records = [],
  created = { warehouses: [], plans: [], supplies: [] };
let running = false;
function safe(value) {
  if (Array.isArray(value)) return value.map(safe);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) =>
            !/(token|password|secret|api.?key|emailcode|phonecode|otp|verificationcode)/i.test(
              key,
            ),
        )
        .map(([key, item]) => [key, safe(item)]),
    );
  return value;
}
async function request(actor, route, method = "GET", body) {
  const headers = { "Content-Type": "application/json", platform: "web" };
  if (actor) headers.Authorization = "Bearer " + actors[actor].access;
  const res = await fetch(base + "/" + route, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
    signal: AbortSignal.timeout(25000),
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { text: raw.slice(0, 200) };
  }
  if (!route.includes("auth-sessions"))
    records.push({
      time: new Date().toISOString(),
      actor,
      route,
      method,
      status: res.status,
      ...(body ? { body: safe(body) } : {}),
    });
  return { status: res.status, data };
}
async function execute(command) {
  if (command.action === "init") {
    for (const [name, credential] of Object.entries(command.accounts)) {
      const reply = await request(
        null,
        "v1/auth-sessions/login",
        "POST",
        credential,
      );
      if (reply.status >= 300) {
        console.log(
          JSON.stringify({
            actor: name,
            status: reply.status,
            error: safe(reply.data),
          }),
        );
        continue;
      }
      const value = reply.data,
        access =
          typeof value.accessToken === "string"
            ? value.accessToken
            : value.accessToken?.token;
      if (!access)
        throw new Error("No access token in the authentication response");
      actors[name] = {
        access,
        refresh:
          typeof value.refreshToken === "string"
            ? value.refreshToken
            : value.refreshToken?.token,
        user: value.user,
      };
      console.log(
        JSON.stringify({
          actor: name,
          status: reply.status,
          user: {
            id: value.user?.id,
            role: value.user?.role,
            isRegistered: value.user?.isRegistered,
            verificationStatus: value.user?.verificationStatus,
            isBlocked: value.user?.isBlocked,
          },
        }),
      );
    }
    return;
  }
  if (command.action === "read") {
    const reply = await request(command.actor, command.route);
    let data = reply.data;
    if (command.pick && data && !Array.isArray(data))
      data = Object.fromEntries(command.pick.map((key) => [key, data[key]]));
    console.log(
      JSON.stringify({
        route: command.route,
        status: reply.status,
        data: safe(data),
      }),
    );
    return;
  }
  if (command.action === "write") {
    if (!command.route.startsWith("v1/"))
      throw new Error("Invalid audit route");
    const reply = await request(
      command.actor,
      command.route,
      command.method,
      command.body,
    );
    const resource =
      command.route === "v1/warehouses"
        ? "warehouses"
        : command.route === "v1/storage/plans"
          ? "plans"
          : command.route === "v1/storage/supply-requests"
            ? "supplies"
            : null;
    if (
      resource &&
      command.method === "POST" &&
      reply.status < 300 &&
      reply.data?.id
    )
      created[resource].push(reply.data.id);
    console.log(
      JSON.stringify({
        route: command.route,
        status: reply.status,
        data: safe(reply.data),
      }),
    );
    return;
  }
  if (command.action === "finish") {
    fs.writeFileSync(
      path.join(output, "api-audit.json"),
      JSON.stringify(
        {
          base,
          created,
          records,
          scope:
            "Authorized development accounts; credentials/tokens excluded. See the requirement audit for external payment/carrier limits.",
        },
        null,
        2,
      ),
    );
    for (const name of Object.keys(actors))
      if (actors[name].refresh)
        await request(name, "v1/auth-sessions/destroy", "POST", {
          refreshToken: actors[name].refresh,
        }).catch(() => {});
    console.log("AUDIT_SAVED");
    process.exit(0);
  }
  throw new Error("Unsupported audit action");
}
if (process.stdin.isTTY) process.stdin.setRawMode(true);
const input = readline.createInterface({
  input: process.stdin,
  terminal: false,
});
let chain = Promise.resolve();
input.on("line", (line) => {
  chain = chain.then(async () => {
    running = true;
    try {
      await execute(JSON.parse(line));
    } catch (error) {
      console.log(JSON.stringify({ error: error.message }));
    } finally {
      running = false;
    }
  });
});
console.log("READY: JSON commands on stdin; credentials are not persisted.");
