import { useEffect, useState } from "react";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { FormDialog } from "@/components/ui";

import type { EmploymentStatus, EmploymentType, User, UserRole } from "../services/users.service";

type Props = {
  open: boolean;
  loading?: boolean;
  user?: User | null;

  onClose: () => void;

  onSubmit: (values: {
    employee_no: string;
    display_name: string;
    email: string;
    role?: UserRole;
    employment_status?: EmploymentStatus;
    employment_type?: EmploymentType;
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

  const [role, setRole] = useState<UserRole | "">("");

  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | "">("");

  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");

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

      ...(role
        ? {
            role,
          }
        : {}),

      ...(employmentStatus
        ? {
            employment_status: employmentStatus,
          }
        : {}),

      ...(employmentType
        ? {
            employment_type: employmentType,
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

  const departmentName = user?.department?.name ?? "-";

  const positionName = user?.position?.title ?? "-";

  const shiftName = user?.shift?.name ?? "-";

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

        <FormControl fullWidth>
          <InputLabel id="user-role-label">Role</InputLabel>

          <Select
            labelId="user-role-label"
            value={role}
            label="Role"
            onChange={(e) => setRole(e.target.value as UserRole | "")}
          >
            <MenuItem value="">
              <em>Not specified</em>
            </MenuItem>

            <MenuItem value="OWNER">OWNER</MenuItem>

            <MenuItem value="ADMIN">ADMIN</MenuItem>

            <MenuItem value="HR">HR</MenuItem>

            <MenuItem value="SUPERVISOR">SUPERVISOR</MenuItem>

            <MenuItem value="EMPLOYEE">EMPLOYEE</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="employment-status-label">Employment Status</InputLabel>

          <Select
            labelId="employment-status-label"
            value={employmentStatus}
            label="Employment Status"
            onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus | "")}
          >
            <MenuItem value="">
              <em>Not specified</em>
            </MenuItem>

            <MenuItem value="ACTIVE">ACTIVE</MenuItem>

            <MenuItem value="INACTIVE">INACTIVE</MenuItem>

            <MenuItem value="ON_LEAVE">ON LEAVE</MenuItem>

            <MenuItem value="RESIGNED">RESIGNED</MenuItem>

            <MenuItem value="TERMINATED">TERMINATED</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="employment-type-label">Employment Type</InputLabel>

          <Select
            labelId="employment-type-label"
            value={employmentType}
            label="Employment Type"
            onChange={(e) => setEmploymentType(e.target.value as EmploymentType | "")}
          >
            <MenuItem value="">
              <em>Not specified</em>
            </MenuItem>

            <MenuItem value="FULL_TIME">FULL TIME</MenuItem>

            <MenuItem value="PART_TIME">PART TIME</MenuItem>

            <MenuItem value="CONTRACT">CONTRACT</MenuItem>

            <MenuItem value="INTERN">INTERN</MenuItem>
          </Select>
        </FormControl>

        {isEdit && (
          <>
            <TextField
              label="Department"
              value={departmentName}
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />

            <TextField
              label="Position"
              value={positionName}
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />

            <TextField
              label="Shift"
              value={shiftName}
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />
          </>
        )}
      </Stack>
    </FormDialog>
  );
}
