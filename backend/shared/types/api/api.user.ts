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
    } & CreateUserPayload)
  | ({
      action: "USER_UPDATE";
    } & UpdateUserPayload & {
        workspace_id: string;
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
