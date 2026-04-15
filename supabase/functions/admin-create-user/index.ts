// Supabase Edge Function: admin-create-user
// Creates a new auth user (service_role) — callable only by admins.
//
// Deploy: supabase functions deploy admin-create-user --no-verify-jwt
// (We handle JWT verification manually so we can return clean JSON errors.)
//
// Required secrets:
//   supabase secrets set SUPABASE_URL=...
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
//   (SUPABASE_URL + SUPABASE_ANON_KEY are auto-injected by Supabase)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!SUPABASE_URL || !SERVICE_KEY) return json(500, { error: "Missing env vars." });

  // 1. Verify the caller is an admin (via their JWT)
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json(401, { error: "Missing auth token." });

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: me, error: meErr } = await userClient.auth.getUser();
  if (meErr || !me?.user) return json(401, { error: "Invalid session." });

  const { data: myProfile } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", me.user.id)
    .single();
  if (myProfile?.role !== "admin") return json(403, { error: "Admin access required." });

  // 2. Parse input
  let body: {
    email?: string;
    full_name?: string;
    password?: string;
    role?: "admin" | "member";
    send_invite?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON." });
  }
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: "Valid email required." });
  }
  const role = body.role === "admin" ? "admin" : "member";
  const fullName = body.full_name?.trim() || email.split("@")[0];

  // 3. Create user with service role
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let createdUserId: string;
  if (body.send_invite) {
    // Magic-link invite path — sends an email, no password set
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
    });
    if (error) return json(400, { error: error.message });
    createdUserId = data.user!.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: body.password || crypto.randomUUID().replace(/-/g, ""),
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) return json(400, { error: error.message });
    createdUserId = data.user!.id;
  }

  // 4. Upsert profile (the handle_new_user trigger creates a basic row; we set role + name)
  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id: createdUserId, email, full_name: fullName, role }, { onConflict: "id" });
  if (pErr) return json(500, { error: `User created but profile upsert failed: ${pErr.message}` });

  return json(200, { ok: true, user_id: createdUserId, email, full_name: fullName, role });
});
