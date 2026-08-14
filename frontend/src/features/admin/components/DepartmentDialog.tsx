import { useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import type { Department } from "../services/departments.service";

type Props = {
  open: boolean;
  loading?: boolean;
  department?: Department | null;
  onClose: () => void;
  onSubmit: (values: { name: string; description?: string }) => Promise<void>;
};

export default function DepartmentDialog({
  open,
  loading = false,
  department = null,
  onClose,
  onSubmit,
}: Props) {
  const dialogModeRef = useRef<"add" | "edit">("add");

  const initialValuesRef = useRef({
    name: "",
    description: "",
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Keep the label stable while the dialog close animation runs.
  const isEdit = open ? Boolean(department) : dialogModeRef.current === "edit";

  const isDirty =
    name !== initialValuesRef.current.name || description !== initialValuesRef.current.description;

  useEffect(() => {
    if (!open) {
      return;
    }

    dialogModeRef.current = department ? "edit" : "add";
  }, [department, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const values = {
      name: department?.name ?? "",
      description: department?.description ?? "",
    };

    setName(values.name);
    setDescription(values.description);

    initialValuesRef.current = values;
  }, [department, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      return;
    }

    await onSubmit({
      name: name.trim(),
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

    setName("");
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
          {isEdit ? "Edit Department" : "Add Department"}
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
              label="Department Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
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
