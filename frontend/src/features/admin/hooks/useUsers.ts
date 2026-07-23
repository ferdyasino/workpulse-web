import { useCallback, useEffect, useState } from "react";

import { getUsers, type AdminUser } from "../services/users.service";

export function useUsers(workspaceId?: string) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await getUsers({
        workspace_id: workspaceId,
      });

      setUsers(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    users,
    loading,
    error,
    refresh,
  };
}
