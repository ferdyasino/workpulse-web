import { useState } from "react";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; description?: string }) => Promise<void>;
};

export default function AddDepartmentDialog({ open, loading = false, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();

    await onSubmit({
      name: name.trim(),
      ...(description.trim()
        ? {
            description: description.trim(),
          }
        : {}),
    });

    resetForm();
  };

  const handleClose = () => {
    if (loading) return;

    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          return;
        }

        handleClose();
      }}
      fullWidth
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Department</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Department Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>

          <Button type="submit" variant="contained" disabled={loading || !name.trim()}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
