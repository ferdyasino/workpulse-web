import { useEffect, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";

import type {
  Workspace,
  WorkspaceStatus,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
} from "../types/workspace.types";

interface WorkspaceDialogProps {
  open: boolean;
  workspace?: Workspace | null;
  onClose: () => void;
  onSubmit: (payload: CreateWorkspacePayload | (UpdateWorkspacePayload & { id: string })) => void;
}

export default function WorkspaceDialog({
  open,
  workspace,
  onClose,
  onSubmit,
}: WorkspaceDialogProps) {
  const editing = Boolean(workspace);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [status, setStatus] = useState<WorkspaceStatus>("ACTIVE");

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setCode(workspace.code);
      setOwnerEmail(workspace.owner_email ?? "");
      setStatus(workspace.status);
    } else {
      setName("");
      setCode("");
      setOwnerEmail("");
      setStatus("ACTIVE");
    }
  }, [workspace, open]);

  function handleSubmit() {
    if (editing && workspace) {
      onSubmit({
        id: workspace.id,
        name,
        code,
        owner_email: ownerEmail || null,
        status,
      });

      return;
    }

    onSubmit({
      name,
      code,
      owner_email: ownerEmail || null,
      status,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          return;
        }

        onClose();
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{editing ? "Edit Workspace" : "Create Workspace"}</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          margin="normal"
          label="Workspace Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Workspace Code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Owner Email"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          placeholder="company.owner@email.com"
        />

        <TextField
          fullWidth
          select
          margin="normal"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as WorkspaceStatus)}
        >
          <MenuItem value="ACTIVE">ACTIVE</MenuItem>

          <MenuItem value="INACTIVE">INACTIVE</MenuItem>
        </TextField>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button variant="contained" onClick={handleSubmit} disabled={!name.trim() || !code.trim()}>
          {editing ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
