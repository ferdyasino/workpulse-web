import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

import type { Workspace } from "../types/workspace.types";

import WorkspaceStatusChip from "./WorkspaceStatusChip";

interface WorkspaceCardProps {
  workspace: Workspace;
  onEdit: (workspace: Workspace) => void;
  onActivate: (workspace: Workspace) => void;
  onDeactivate: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
  onRestore: (workspace: Workspace) => void;
}

export default function WorkspaceCard({
  workspace,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
  onRestore,
}: WorkspaceCardProps) {
  const deleted = workspace.deleted_at !== null;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">{workspace.name}</Typography>

            <WorkspaceStatusChip status={workspace.status} />
          </div>

          <Typography variant="body2" color="text.secondary">
            Code: {workspace.code}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Owner: {workspace.owner_email ?? "-"}
          </Typography>
        </Stack>
      </CardContent>

      <CardActions>
        {!deleted ? (
          <>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(workspace)}>
                <EditIcon />
              </IconButton>
            </Tooltip>

            {workspace.status === "ACTIVE" ? (
              <Tooltip title="Deactivate">
                <IconButton size="small" color="warning" onClick={() => onDeactivate(workspace)}>
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Activate">
                <IconButton size="small" color="success" onClick={() => onActivate(workspace)}>
                  <CheckCircleIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => onDelete(workspace)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Restore">
            <IconButton size="small" color="primary" onClick={() => onRestore(workspace)}>
              <RestoreIcon />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
}
