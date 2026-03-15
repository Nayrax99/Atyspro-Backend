/**
 * Auth Supabase - Magic Link par email
 * Vérification JWT et récupération du contexte utilisateur/account
 */

import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ApiError } from "@/lib/utils";

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthContext {
  user: AuthUser;
  account_id: string;
  /** Token JWT brut (pour createSupabaseClient) */
  token: string;
}

/**
 * Extrait et valide l'utilisateur depuis le header Authorization ou le cookie.
 * Retourne { user, account_id } ou null si non authentifié / invalide.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthContext | null> {
  let token: string | undefined;

  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else {
    token = req.cookies.get("sb-access-token")?.value;
  }

  if (!token) return null;

  if (!supabaseAdmin) {
    console.error("supabaseAdmin non initialisé (SUPABASE_SERVICE_ROLE_KEY manquant)");
    return null;
  }

  const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !authUser?.email) {
    return null;
  }

  const { data: account } = await supabaseAdmin
    .from("accounts")
    .select("id")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (!account) {
    return null;
  }

  return {
    user: { id: authUser.id, email: authUser.email },
    account_id: account.id,
    token,
  };
}

/**
 * Exige une authentification valide.
 * Throw ApiError 401 si non authentifié.
 */
export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const ctx = await getAuthUser(req);
  if (!ctx) {
    throw new ApiError("Non authentifié", 401);
  }
  return ctx;
}

/**
 * Exige que l'utilisateur soit admin (is_admin = true dans la table accounts).
 * Throw ApiError 403 si pas admin, 401 si non authentifié.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthContext> {
  const ctx = await requireAuth(req);

  if (!supabaseAdmin) {
    throw new ApiError("Admin Supabase non configuré", 500);
  }

  const { data: account } = await supabaseAdmin
    .from("accounts")
    .select("is_admin")
    .eq("id", ctx.account_id)
    .maybeSingle();

  if (!account?.is_admin) {
    throw new ApiError("Accès réservé aux administrateurs", 403);
  }

  return ctx;
}
