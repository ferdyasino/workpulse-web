import { useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

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
  const dialogModeRef = useRef<"add" | "edit">("add");

  const initialValuesRef = useRef({
    title: "",
    description: "",
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const isEdit = open ? Boolean(position) : dialogModeRef.current === "edit";

  const isDirty =
    title !== initialValuesRef.current.title ||
    description !== initialValuesRef.current.description;

  useEffect(() => {
    if (!open) {
      return;
    }

    dialogModeRef.current = position ? "edit" : "add";
  }, [open, position]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const values = {
      title: position?.title ?? "",
      description: position?.description ?? "",
    };

    setTitle(values.title);
    setDescription(values.description);

    initialValuesRef.current = values;
  }, [open, position]);

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
    <Dialog
      open={open}
      fullWidth
      maxWidth="sm"
      onClose={(_, reason) => {
        if (isDirty && (reason === "backdropClick" || reason === "escapeKeyDown")) {
          return;
        }

        handleClose();
      }}
      slotProps={{
        paper: {
          sx: {
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 64px)",
            overflow: "hidden",
          },
        },
      }}
    >
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <DialogTitle sx={{ flexShrink: 0 }}>
          {isEdit ? "Edit Position" : "Add Position"}
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Position Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              autoFocus
              fullWidth
            />

            <TextField
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            flexShrink: 0,
            px: 3,
            py: 2,
          }}
        >
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>

          <Button type="submit" variant="contained" disabled={loading}>
            {isEdit ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
