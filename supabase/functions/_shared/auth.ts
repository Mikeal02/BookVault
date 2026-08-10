/**
 * Single JWT verification path for every edge function. Functions deploy with
 * verify_jwt = false, so the token MUST be validated in code on every request.
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthedUser {
  userId: string;
  email?: string;
  role?: string;
  claims: Record<string, unknown>;
  token: string;
}

const bearer = (req: Request): string | null => {
  const header = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!header) return null;
  const [scheme, ...rest] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;
  const token = rest.join(" ").trim();
  return token.length >= 20 && token.split(".").length === 3 ? token : null;
};

/** Verifies the JWT signature via the auth server and rejects expired tokens. */
export const authenticate = async (req: Request): Promise<AuthedUser | null> => {
  const token = bearer(req);
  if (!token) return null;

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null;

  const client = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  const { data, error } = await client.auth.getClaims(token);
  const claims = data?.claims as Record<string, unknown> | undefined;
  const sub = claims?.sub;
  if (error || !claims || typeof sub !== "string" || !sub) return null;

  const exp = typeof claims.exp === "number" ? claims.exp : undefined;
  if (exp !== undefined && exp * 1000 <= Date.now()) return null;

  return {
    userId: sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
    role: typeof claims.role === "string" ? claims.role : undefined,
    claims,
    token,
  };
};

/** Client scoped to the caller — every query is still subject to RLS. */
export const userClient = (token: string): SupabaseClient =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

/** Service-role client. Never created from a user token; never used for user sign-in. */
export const serviceClient = (): SupabaseClient =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

/** Server-side role check through the security-definer has_role function. */
export const hasRole = async (
  user: AuthedUser,
  role: "admin" | "moderator" | "user",
): Promise<boolean> => {
  const { data, error } = await userClient(user.token).rpc("has_role", {
    _user_id: user.userId,
    _role: role,
  });
  return !error && data === true;
};