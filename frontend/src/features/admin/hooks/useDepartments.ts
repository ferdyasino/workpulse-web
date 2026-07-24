import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";

import { getDepartments, type Department } from "../services/departments.service";

export function useDepartments() {
  const { user } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDepartments = useCallback(async () => {
    if (!user?.workspace_id) {
      setDepartments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getDepartments({
        workspace_id: user.workspace_id,
      });

      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, [user?.workspace_id]);

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  return {
    departments,
    loading,
    error,
    refresh: loadDepartments,
  };
}
