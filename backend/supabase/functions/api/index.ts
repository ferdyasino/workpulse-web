import { createClient } from "@supabase/supabase-js";
import { getWorkspace } from "./modules/workspace.ts";
import { getUserContext } from "./modules/users.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { action, email } = body;

    let response;

    switch (action) {
      case "GET_WORKSPACE":
        response = await getWorkspace(supabaseAdmin);
        break;

      case "GET_USER_CONTEXT": {
        response = await getUserContext(supabaseAdmin, email);

        break;
      }

      case "test-users": {
        const { data, error } = await supabaseAdmin
          .from("users")
          .select("*")
          .limit(5);

        response = {
          data,
          error,
        };

        break;
      }

      case "test-db": {
        const { data, error } = await supabaseAdmin
          .from("workspaces")
          .select("*")
          .limit(5);

        response = {
          data,
          error,
        };
        break;
      }

      default:
        return Response.json(
          {
            error: "Unknown action",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
    }

    return Response.json(response, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error,
        message: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
