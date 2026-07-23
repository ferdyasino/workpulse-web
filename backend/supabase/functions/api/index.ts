import { createClient } from "@supabase/supabase-js";

import { handleRequest } from "./routes/index.ts";
import type { ApiRequest } from "@shared/types/api.types.ts";

import type { Database } from "./types/database.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

console.log("SUPABASE URL EXISTS:", !!supabaseUrl);
console.log("SERVICE KEY EXISTS:", !!serviceRoleKey);

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return Response.json(
      {
        success: false,
        message: "Method Not Allowed",
      },
      {
        status: 405,
        headers: corsHeaders,
      },
    );
  }

  try {
    const body = (await req.json()) as ApiRequest;

    const result = await handleRequest(req, body, supabaseAdmin);

    return Response.json(result, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
