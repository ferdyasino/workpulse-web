import { useCallback, useEffect, useState } from "react";

import { getTimelogs, type Timelog } from "../services/timelogs.service";

type Params = {
  workspace_id: string;
  user_id: string;
  work_date?: string;
};

export function useTimelogs(params: Params) {
  const { workspace_id, user_id, work_date } = params;

  const [timelogs, setTimelogs] = useState<Timelog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    if (!workspace_id) {
      return;
    }

    try {
      setLoading(true);
      setError(undefined);

      const data = await getTimelogs({
        workspace_id,
        user_id,
        work_date,
      });

      setTimelogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timelogs");
    } finally {
      setLoading(false);
    }
  }, [workspace_id, user_id, work_date]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    timelogs,
    loading,
    error,
    refresh,
  };
}
