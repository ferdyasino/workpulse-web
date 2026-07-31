import { useEffect, useState } from "react";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { FormDialog } from "@/components/ui";

import type { User } from "../services/users.service";

type Props = {
  open: boolean;
  loading?: boolean;
  user?: User | null;

  onClose: () => void;

  onSubmit: (values: {
    employee_no: string;
    display_name: string;
    email: string;
    role?: string;
    employment_status?: string;
    employment_type?: string;
  }) => Promise<void>;
};

export default function UserDialog({
  open,
  loading = false,
  user = null,
  onClose,
  onSubmit,
}: Props) {
  const [employeeNo, setEmployeeNo] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [employmentType, setEmploymentType] = useState("");

  const isEdit = Boolean(user);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (user) {
      setEmployeeNo(user.employee_no ?? "");
      setDisplayName(user.display_name ?? "");
      setEmail(user.email ?? "");
      setRole(user.role ?? "");
      setEmploymentStatus(user.employment_status ?? "");
      setEmploymentType(user.employment_type ?? "");
    } else {
      setEmployeeNo("");
      setDisplayName("");
      setEmail("");
      setRole("");
      setEmploymentStatus("");
      setEmploymentType("");
    }
  }, [user, open]);

  const handleSubmit = async () => {
    if (!displayName.trim() || !email.trim()) {
      return;
    }

    await onSubmit({
      employee_no: employeeNo.trim(),
      display_name: displayName.trim(),
      email: email.trim(),

      ...(role.trim()
        ? {
            role: role.trim(),
          }
        : {}),

      ...(employmentStatus.trim()
        ? {
            employment_status: employmentStatus.trim(),
          }
        : {}),

      ...(employmentType.trim()
        ? {
            employment_type: employmentType.trim(),
          }
        : {}),
    });
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    setEmployeeNo("");
    setDisplayName("");
    setEmail("");
    setRole("");
    setEmploymentStatus("");
    setEmploymentType("");

    onClose();
  };

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit User" : "Add User"}
      submitLabel={isEdit ? "Save Changes" : "Create"}
      loading={loading}
      onClose={handleClose}
      onSubmit={handleSubmit}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label="Employee No."
          value={employeeNo}
          onChange={(e) => setEmployeeNo(e.target.value)}
          fullWidth
        />

        <TextField
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          autoFocus
          fullWidth
        />

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />

        <TextField label="Role" value={role} onChange={(e) => setRole(e.target.value)} fullWidth />

        <TextField
          label="Employment Status"
          value={employmentStatus}
          onChange={(e) => setEmploymentStatus(e.target.value)}
          fullWidth
        />

        <TextField
          label="Employment Type"
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
          fullWidth
        />
      </Stack>
    </FormDialog>
  );
}
