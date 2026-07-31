import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import type { Workspace } from "../types/workspace.types";

import WorkspaceCard from "./WorkspaceCard";

interface WorkspacesTableProps {
  workspaces: Workspace[];

  onEdit: (workspace: Workspace) => void;
  onActivate: (workspace: Workspace) => void;
  onDeactivate: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
  onRestore: (workspace: Workspace) => void;
}

export default function WorkspacesTable({
  workspaces,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
  onRestore,
}: WorkspacesTableProps) {
  if (workspaces.length === 0) {
    return (
      <Paper
        variant="outlined"
        style={{
          padding: 24,
          textAlign: "center",
        }}
      >
        No workspaces found.
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>Status</TableCell>
            <TableCell width={220}>Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {workspaces.map((workspace) => (
            <TableRow key={workspace.id} hover>
              <TableCell>{workspace.name}</TableCell>

              <TableCell>{workspace.code}</TableCell>

              <TableCell>{workspace.owner_email ?? "-"}</TableCell>

              <TableCell>
                <WorkspaceCard
                  workspace={workspace}
                  onEdit={onEdit}
                  onActivate={onActivate}
                  onDeactivate={onDeactivate}
                  onDelete={onDelete}
                  onRestore={onRestore}
                />
              </TableCell>

              <TableCell>{/* Actions are rendered inside WorkspaceCard */}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
