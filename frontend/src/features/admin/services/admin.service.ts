import { invokeFunction } from "@/utils/api";

import type { AdminUser } from "../types/admin.types";

export async function getAdminUsers(workspace_id: string): Promise<AdminUser[]> {
  return await invokeFunction<
    AdminUser[],
    {
      action: "USERS_LIST";
      workspace_id: string;
    }
  >("api", {
    action: "USERS_LIST",
    workspace_id,
  });
}
