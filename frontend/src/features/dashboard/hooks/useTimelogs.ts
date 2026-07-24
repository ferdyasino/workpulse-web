import { useEffect, useState } from "react";

import { getTimelogs, type Timelog } from "../services/timelogs.service";

type Params = {
  workspace_id: string;
  user_id: string;
  work_date?: string;
};

export function useTimelogs(params: Params) {
  const [timelogs, setTimelogs] = useState<Timelog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function refresh() {
    try {
      setLoading(true);
      setError(undefined);

      const data = await getTimelogs(params);

      setTimelogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timelogs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!params.workspace_id || !params.user_id) {
      return;
    }

    refresh();
  }, [params.workspace_id, params.user_id, params.work_date]);

  return {
    timelogs,
    loading,
    error,
    refresh,
  };
}
