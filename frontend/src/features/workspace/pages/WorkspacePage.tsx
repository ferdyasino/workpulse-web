import { useMemo, useState } from "react";

import { Stack, Typography } from "@mui/material";

import WorkspaceDialog from "../components/WorkspaceDialog";
import WorkspaceToolbar from "../components/WorkspaceToolbar";
import WorkspacesTable from "../components/WorkspacesTable";

import { useWorkspaces } from "../hooks/useWorkspaces";

import type {
  Workspace,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
} from "../types/workspace.types";

export default function WorkspacePage() {
  const {
    workspaces,

    refresh,

    create,
    update,

    activate,
    deactivate,

    remove,
    restore,
  } = useWorkspaces();

  const [search, setSearch] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);

  const filteredWorkspaces = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return workspaces;
    }

    return workspaces.filter(
      (workspace) =>
        workspace.name.toLowerCase().includes(keyword) ||
        workspace.code.toLowerCase().includes(keyword) ||
        (workspace.owner_email ?? "").toLowerCase().includes(keyword),
    );
  }, [search, workspaces]);

  function handleCreate() {
    setEditingWorkspace(null);
    setDialogOpen(true);
  }

  function handleEdit(workspace: Workspace) {
    setEditingWorkspace(workspace);
    setDialogOpen(true);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setEditingWorkspace(null);
  }

  async function handleSubmit(
    payload: CreateWorkspacePayload | (UpdateWorkspacePayload & { id: string }),
  ) {
    if ("id" in payload) {
      await update(payload);
    } else {
      await create(payload);
    }

    handleCloseDialog();
  }

  async function handleIncludeDeleted(value: boolean) {
    setIncludeDeleted(value);
    await refresh(value);
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Workspaces</Typography>

      <WorkspaceToolbar
        search={search}
        includeDeleted={includeDeleted}
        onSearchChange={setSearch}
        onIncludeDeletedChange={handleIncludeDeleted}
        onCreate={handleCreate}
      />

      <WorkspacesTable
        workspaces={filteredWorkspaces}
        onEdit={handleEdit}
        onActivate={(workspace) => activate(workspace.id)}
        onDeactivate={(workspace) => deactivate(workspace.id)}
        onDelete={(workspace) => remove(workspace.id)}
        onRestore={(workspace) => restore(workspace.id)}
      />

      <WorkspaceDialog
        open={dialogOpen}
        workspace={editingWorkspace}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
      />
    </Stack>
  );
}
