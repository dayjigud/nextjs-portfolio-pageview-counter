import { ShopError } from "./domain.ts";
export type Identity = {
  userId: string;
  isAnonymous: boolean;
  email: string;
  hasGoogleIdentity: boolean;
};
export async function identity(req: Request): Promise<Identity> {
  const token = req.headers.get("authorization");
  if (!token?.startsWith("Bearer ")) {
    throw new ShopError("AUTH_REQUIRED", "Please sign in again.", 401);
  }
  const key = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
    JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}").default ||
    Deno.env.get("SUPABASE_ANON_KEY")!;
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
    headers: { Authorization: token, apikey: key },
  });
  if (!r.ok) throw new ShopError("AUTH_REQUIRED", "Please sign in again.", 401);
  const u = await r.json();
  if (!u.id) throw new ShopError("AUTH_REQUIRED", "Please sign in again.", 401);
  return {
    userId: u.id,
    isAnonymous: u.is_anonymous === true,
    email: u.email_confirmed_at ? u.email : "",
    hasGoogleIdentity: Array.isArray(u.identities) &&
      u.identities.some((i: any) => i.provider === "google"),
  };
}
export function permanent(u: Identity) {
  if (u.isAnonymous || !u.hasGoogleIdentity || !u.email) {
    throw new ShopError(
      "PERMANENT_ACCOUNT_REQUIRED",
      "Sign in with Google to checkout.",
      403,
    );
  }
}
export function scheduler(req: Request) {
  const secret = Deno.env.get("LUMA_SCHEDULER_SECRET");
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    throw new ShopError(
      "AUTH_REQUIRED",
      "Service authentication required.",
      401,
    );
  }
}
