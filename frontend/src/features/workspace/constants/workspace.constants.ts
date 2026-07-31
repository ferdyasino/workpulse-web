import type { WorkspaceFormValues, WorkspaceStatus } from "../types/workspace.types";

/* -------------------------------------------------------------------------- */
/* Status                                                                      */
/* -------------------------------------------------------------------------- */

export const WORKSPACE_STATUSES: WorkspaceStatus[] = ["ACTIVE", "INACTIVE"];

/* -------------------------------------------------------------------------- */
/* Filters                                                                     */
/* -------------------------------------------------------------------------- */

export const WORKSPACE_STATUS_FILTERS = ["ALL", ...WORKSPACE_STATUSES] as const;

/* -------------------------------------------------------------------------- */
/* Defaults                                                                    */
/* -------------------------------------------------------------------------- */

export const DEFAULT_WORKSPACE_FORM: WorkspaceFormValues = {
  name: "",
  code: "",
  owner_email: "",
  status: "ACTIVE",
};

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

export const WORKSPACE_NAME_MAX_LENGTH = 100;

export const WORKSPACE_CODE_MAX_LENGTH = 50;

export const WORKSPACE_OWNER_EMAIL_MAX_LENGTH = 255;
