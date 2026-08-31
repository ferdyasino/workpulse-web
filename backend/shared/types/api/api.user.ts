import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserActionPayload,
} from "../models/user.types.ts";

export type UserApiRequest =
  | {
      action: "USER_LIST";

      workspace_id: string;

      include_inactive?: boolean;

      include_deleted?: boolean;
    }
  | {
      action: "USER_GET";

      workspace_id: string;

      id: string;
    }
  | ({
      action: "USER_CREATE";
    } & CreateUserPayload & {
        /**
         * Initial password for Supabase Auth.
         *
         * IMPORTANT:
         * - This is sent only to Supabase Auth.
         * - It must never be stored in public.users.
         * - It must never be returned by the API.
         * - It must never be logged.
         */
        password?: string;
      })
  | ({
      action: "USER_UPDATE";
    } & UpdateUserPayload & {
        workspace_id: string;

        /**
         * Optional new password for the Supabase Auth account.
         *
         * If omitted, the existing password remains unchanged.
         *
         * IMPORTANT:
         * - This is sent only to Supabase Auth.
         * - It must never be stored in public.users.
         * - It must never be returned by the API.
         * - It must never be logged.
         */
        password?: string;
      })
  | ({
      action: "USER_ACTIVATE";
    } & UserActionPayload)
  | ({
      action: "USER_DEACTIVATE";
    } & UserActionPayload)
  | ({
      action: "USER_DELETE";
    } & UserActionPayload)
  | ({
      action: "USER_RESTORE";
    } & UserActionPayload)
  | ({
      action: "USER_HARD_DELETE";
    } & UserActionPayload);
