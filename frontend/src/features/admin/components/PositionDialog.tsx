import { useEffect, useState } from "react";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import type { Position } from "../services/positions.service";

type PositionDialogProps = {
  open: boolean;
  position?: Position | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: { title: string; description: string }) => Promise<void> | void;
};

export default function PositionDialog({
  open,
  position,
  loading = false,
  onClose,
  onSubmit,
}: PositionDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(position?.title ?? "");
      setDescription(position?.description ?? "");
    }
  }, [open, position]);

  async function handleSubmit() {
    if (!title.trim()) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
    });
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{position ? "Edit Position" : "Add Position"}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            fullWidth
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>

        <Button variant="contained" onClick={handleSubmit} disabled={loading || !title.trim()}>
          {position ? "Save Changes" : "Create Position"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
