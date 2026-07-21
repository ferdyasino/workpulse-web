import type { SupabaseClient } from "@supabase/supabase-js";

import { getAuthenticatedUser } from "../lib/auth.ts";
import { getUserContext } from "../services/users.ts";
import { getWorkspace } from "../services/workspace.ts";
import type { Database } from "../types/database.ts";

export type ApiRequest =
  | {
      action: "ME";
    }
  | {
      action: "GET_WORKSPACE";
    }
  | {
      action: "GET_USER_CONTEXT";
    };

export async function handleRequest(
  req: Request,
  body: ApiRequest,
  supabaseAdmin: SupabaseClient<Database>,
) {
  console.log("ACTION:", body.action);

  switch (body.action) {
    case "ME": {
      const authUser = await getAuthenticatedUser(req);

      console.log("AUTH USER:", authUser.email);

      try {
        const user = await getUserContext(supabaseAdmin, authUser.email!);

        console.log("USER FOUND");

        return user;
      } catch (err) {
        console.error("ME ERROR:", err);
        throw err;
      }
    }

    case "GET_WORKSPACE": {
      await getAuthenticatedUser(req);

      try {
        return await getWorkspace(supabaseAdmin);
      } catch (err) {
        console.error("WORKSPACE ERROR:", err);
        throw err;
      }
    }

    case "GET_USER_CONTEXT": {
      const authUser = await getAuthenticatedUser(req);

      try {
        return await getUserContext(supabaseAdmin, authUser.email!);
      } catch (err) {
        console.error("USER_CONTEXT ERROR:", err);
        throw err;
      }
    }

    default:
      throw new Error("Unknown action");
  }
}
