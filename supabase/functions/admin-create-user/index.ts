import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

type DesignationName =
  | "Super Admin"
  | "President"
  | "Zone Coordinator"
  | "District Coordinator"
  | "University Coordinator"
  | "Madadgar Team Coordinator"
  | "Department Head"
  | "Viewer";

const allowedDesignations: DesignationName[] = [
  "Super Admin",
  "President",
  "Zone Coordinator",
  "District Coordinator",
  "University Coordinator",
  "Madadgar Team Coordinator",
  "Department Head",
  "Viewer",
];

function mapDesignationToAccessRole(designation: DesignationName): "admin" | "moderator" | "user" {
  if (designation === "Super Admin" || designation === "President") return "admin";
  if (designation === "Viewer") return "user";
  return "moderator";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase environment variables" }), { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing bearer token" }), { status: 401 });
  }

  const requesterClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: requesterData, error: requesterError } = await requesterClient.auth.getUser();
  if (requesterError || !requesterData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized requester" }), { status: 401 });
  }

  const { data: requesterRoleData, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", requesterData.user.id)
    .single();

  if (roleError || !requesterRoleData) {
    return new Response(JSON.stringify({ error: "Requester role not found" }), { status: 403 });
  }

  if (requesterRoleData.role !== "admin" && requesterRoleData.role !== "moderator") {
    return new Response(JSON.stringify({ error: "Insufficient permissions" }), { status: 403 });
  }

  let body: { email?: string; password?: string; designation?: string; userId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const designation = body.designation as DesignationName;
  if (!designation || !allowedDesignations.includes(designation)) {
    return new Response(JSON.stringify({ error: "Invalid designation" }), { status: 400 });
  }
  const accessRole = mapDesignationToAccessRole(designation);

  if (body.userId) {
    const { error: upsertError } = await adminClient
      .from("user_roles")
      .upsert({ user_id: body.userId, role: accessRole }, { onConflict: "user_id" });

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), { status: 400 });
    }

    const { error: designationError } = await adminClient
      .from("user_designations")
      .upsert({ user_id: body.userId, designation }, { onConflict: "user_id" });

    if (designationError) {
      return new Response(JSON.stringify({ error: designationError.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, userId: body.userId, role: accessRole, designation }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.email || !body.password) {
    return new Response(JSON.stringify({ error: "Email and password are required" }), { status: 400 });
  }

  const { data: createdUserData, error: createError } = await adminClient.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { designation },
  });

  if (createError || !createdUserData.user) {
    return new Response(JSON.stringify({ error: createError?.message || "User creation failed" }), { status: 400 });
  }

  const { error: roleUpsertError } = await adminClient
    .from("user_roles")
    .upsert({ user_id: createdUserData.user.id, role: accessRole }, { onConflict: "user_id" });

  if (roleUpsertError) {
    return new Response(JSON.stringify({ error: roleUpsertError.message }), { status: 400 });
  }

  const { error: designationError } = await adminClient
    .from("user_designations")
    .upsert({ user_id: createdUserData.user.id, designation }, { onConflict: "user_id" });

  if (designationError) {
    return new Response(JSON.stringify({ error: designationError.message }), { status: 400 });
  }

  return new Response(
    JSON.stringify({
      success: true,
      userId: createdUserData.user.id,
      email: createdUserData.user.email,
      role: accessRole,
      designation,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
});
