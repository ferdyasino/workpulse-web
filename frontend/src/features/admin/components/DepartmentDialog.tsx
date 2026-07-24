import { useEffect, useState } from "react";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { FormDialog } from "@/components/ui";

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const isEdit = Boolean(department);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (department) {
      setName(department.name);
      setDescription(department.description ?? "");
    } else {
      setName("");
      setDescription("");
    }
  }, [department, open]);

  const handleSubmit = async () => {
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
    <FormDialog
      open={open}
      title={isEdit ? "Edit Department" : "Add Department"}
      submitLabel={isEdit ? "Save Changes" : "Create"}
      loading={loading}
      onClose={handleClose}
      onSubmit={handleSubmit}
    >
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
    </FormDialog>
  );
}
