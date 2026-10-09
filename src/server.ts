import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { getEnv } from "./env.js";

const env = getEnv();

serve({ fetch: app.fetch, hostname: env.host, port: env.port }, (info) => {
  console.log(`listening on ${info.address}:${info.port}`);
});
