import postgres from "npm:postgres@3.4.7";
let connection: ReturnType<typeof postgres>;
export function db() {
  if (!connection) {
    const url = Deno.env.get("LUMA_DATABASE_URL");
    if (!url) throw new Error("Database not configured");
    connection = postgres(url, {
      prepare: false,
      max: 3,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
    });
  }
  return connection;
}
export type SQL = any;
