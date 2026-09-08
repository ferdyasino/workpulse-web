import { supabase } from "@/lib/supabase";

const ACTIVE_WORKSPACE_STORAGE_KEY = "active_workspace_id";

/**
 * Returns the workspace currently selected in the application, if one has
 * been selected. This applies equally to platform owners: their selected
 * workspace is the scope for workspace-aware API operations.
 */
function getActiveWorkspaceId(): string | undefined {
  const workspaceId = localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY)?.trim();

  return workspaceId || undefined;
}

function hasWorkspaceId(body: object): boolean {
  return (
    "workspace_id" in body &&
    typeof body.workspace_id === "string" &&
    body.workspace_id.trim().length > 0
  );
}

export async function invokeFunction<TResponse, TBody extends object = object>(
  name: string,
  body?: TBody,
): Promise<TResponse> {
  const activeWorkspaceId = body && name === "api" ? getActiveWorkspaceId() : undefined;

  /*
   * Always send the selected workspace to the API when the caller did not
   * already provide one. In particular, platform owners do not have a
   * user.workspace_id, so their active workspace must not be omitted.
   */
  const requestBody =
    body && activeWorkspaceId && !hasWorkspaceId(body)
      ? { ...body, workspace_id: activeWorkspaceId }
      : body;

  const { data, error } = await supabase.functions.invoke(name, {
    body: requestBody,
  });

  if (error) {
    console.error("EDGE FUNCTION ERROR:", error);

    if (error.context) {
      try {
        const response = await error.context.json();

        console.error("EDGE FUNCTION RESPONSE:", response);

        if (response?.message) {
          throw new Error(response.message);
        }

        throw new Error("Edge function request failed.");
      } catch (err) {
        if (err instanceof Error) {
          throw err;
        }
      }
    }

    throw error;
  }

  return data as TResponse;
}

export async function apiRequest<TResponse = unknown, TBody extends object = object>(
  body: TBody,
  options?: {
    workspace_id?: string;
  },
): Promise<TResponse> {
  return invokeFunction<TResponse, TBody>("api", {
    ...body,
    ...(options?.workspace_id
      ? {
          workspace_id: options.workspace_id,
        }
      : {}),
  } as TBody);
}
