import Chip from "@mui/material/Chip";

import type { WorkspaceStatus } from "../types/workspace.types";

interface WorkspaceStatusChipProps {
  status: WorkspaceStatus;
}

export default function WorkspaceStatusChip({ status }: WorkspaceStatusChipProps) {
  return (
    <Chip
      label={status}
      color={status === "ACTIVE" ? "success" : "default"}
      size="small"
      variant={status === "ACTIVE" ? "filled" : "outlined"}
    />
  );
}
