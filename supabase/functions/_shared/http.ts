import { ShopError } from "./domain.ts";
import { identity, scheduler } from "./auth.ts";
import { cart, checkout, handoff, orders, quote } from "./service.ts";
import { cleanupGuests, emailWorker } from "./jobs.ts";
export function createHandler(name: string) {
  return async (req: Request) => {
    const origin = req.headers.get("origin");
    const allowed = (Deno.env.get("LUMA_ALLOWED_ORIGINS") || "").split(",").map(
      (s) => s.trim(),
    ).filter(Boolean);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Vary": "Origin",
      "Access-Control-Allow-Headers":
        "authorization,apikey,content-type,x-client-info",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    };
    if (origin && allowed.includes(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
    const response = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers });
    try {
      if (origin && !allowed.includes(origin)) {
        throw new ShopError(
          "ORIGIN_REJECTED",
          "This site is not allowed.",
          403,
        );
      }
      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers });
      }
      if (!["GET", "POST"].includes(req.method)) {
        throw new ShopError("METHOD_NOT_ALLOWED", "Unsupported method.", 405);
      }
      const serviceCall = ["email-worker", "guest-cleanup"].includes(name);
      if (serviceCall) scheduler(req);
      const u = serviceCall ? null : await identity(req);
      let body: unknown;
      if (req.method === "POST") {
        const text = await req.text();
        if (text.length > 8192) {
          throw new ShopError("VALIDATION_FAILED", "Request is too large.");
        }
        try {
          body = JSON.parse(text || "{}");
        } catch {
          throw new ShopError("VALIDATION_FAILED", "Invalid request JSON.");
        }
      }
      if (["email-worker", "guest-cleanup"].includes(name)) {
        if (req.method !== "POST") {
          throw new ShopError("METHOD_NOT_ALLOWED", "Use POST.", 405);
        }
        return response(
          name === "email-worker" ? await emailWorker() : await cleanupGuests(),
        );
      }
      if (!u) {
        throw new ShopError("AUTH_REQUIRED", "Please sign in again.", 401);
      }
      if (name === "cart") {
        return response(
          await cart(u, req.method === "POST" ? body : undefined),
        );
      }
      if (name === "cart-handoff" && req.method === "POST") {
        return response(await handoff(u, body));
      }
      if (name === "quote" && req.method === "GET") {
        return response(await quote(u));
      }
      if (name === "checkout" && req.method === "POST") {
        return response(await checkout(u, body));
      }
      if (name === "orders" && req.method === "GET") {
        return response(
          await orders(
            u,
            new URL(req.url).searchParams.get("id"),
            new URL(req.url).searchParams.get("requestKey"),
          ),
        );
      }
      throw new ShopError("METHOD_NOT_ALLOWED", "Unsupported method.", 405);
    } catch (e) {
      if (e instanceof ShopError) {
        return response({
          error: {
            code: e.code,
            message: e.message,
            ...(e.details ? { details: e.details } : {}),
          },
        }, e.status);
      }
      return response({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message:
            "The shop service is temporarily unavailable. Please try again.",
        },
      }, 503);
    }
  };
}

export function serve(name: string) {
  Deno.serve(createHandler(name));
}
