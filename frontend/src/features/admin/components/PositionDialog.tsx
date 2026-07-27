import { useEffect, useState } from "react";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { FormDialog } from "@/components/ui";

import type { Position } from "../services/positions.service";

type Props = {
  open: boolean;
  loading?: boolean;
  position?: Position | null;

  onClose: () => void;

  onSubmit: (values: { title: string; description?: string }) => Promise<void>;
};

export default function PositionDialog({
  open,
  loading = false,
  position = null,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const isEdit = Boolean(position);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (position) {
      setTitle(position.title);
      setDescription(position.description ?? "");
    } else {
      setTitle("");
      setDescription("");
    }
  }, [position, open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      ...(description.trim()
        ? {
            description: description.trim(),
          }
        : {}),
    });
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    setTitle("");
    setDescription("");

    onClose();
  };

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit Position" : "Add Position"}
      submitLabel={isEdit ? "Save Changes" : "Create"}
      loading={loading}
      onClose={handleClose}
      onSubmit={handleSubmit}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label="Position Title"
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
    </FormDialog>
  );
}
