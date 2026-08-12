import { useEffect, useState } from "react";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { FormDialog } from "@/components/ui";

import { useDepartments } from "../hooks/useDepartments";
import { usePositions } from "../hooks/usePositions";

import type { EmploymentStatus, EmploymentType, User, UserRole } from "../services/users.service";

export type UserFormValues = {
  employee_no: string;
  display_name: string;
  email: string;

  role?: UserRole;

  employment_status?: EmploymentStatus;

  employment_type?: EmploymentType;

  department_id?: string | null;

  position_id?: string | null;
};

type Props = {
  open: boolean;

  loading?: boolean;

  user?: User | null;

  onClose: () => void;

  onSubmit: (values: UserFormValues) => Promise<void>;
};

export default function UserDialog({
  open,
  loading = false,
  user = null,
  onClose,
  onSubmit,
}: Props) {
  const { departments, loading: departmentsLoading } = useDepartments();

  const { positions, loading: positionsLoading } = usePositions();

  const [employeeNo, setEmployeeNo] = useState("");

  const [displayName, setDisplayName] = useState("");

  const [email, setEmail] = useState("");

  const [role, setRole] = useState<UserRole | "">("");

  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | "">("");

  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");

  const [departmentId, setDepartmentId] = useState("");

  const [positionId, setPositionId] = useState("");

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

      setDepartmentId(user.department_id ?? "");

      setPositionId(user.position_id ?? "");
    } else {
      setEmployeeNo("");

      setDisplayName("");

      setEmail("");

      setRole("");

      setEmploymentStatus("");

      setEmploymentType("");

      setDepartmentId("");

      setPositionId("");
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

      department_id: departmentId || null,

      position_id: positionId || null,
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

    setDepartmentId("");

    setPositionId("");

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

        <FormControl fullWidth>
          <InputLabel id="user-role-label">Role</InputLabel>

          <Select
            labelId="user-role-label"
            value={role}
            label="Role"
            onChange={(e) => setRole(e.target.value as UserRole | "")}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>

            <MenuItem value="OWNER">Owner</MenuItem>

            <MenuItem value="ADMIN">Admin</MenuItem>

            <MenuItem value="HR">HR</MenuItem>

            <MenuItem value="SUPERVISOR">Supervisor</MenuItem>

            <MenuItem value="EMPLOYEE">Employee</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="user-employment-status-label">Employment Status</InputLabel>

          <Select
            labelId="user-employment-status-label"
            value={employmentStatus}
            label="Employment Status"
            onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus | "")}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>

            <MenuItem value="ACTIVE">Active</MenuItem>

            <MenuItem value="INACTIVE">Inactive</MenuItem>

            <MenuItem value="ON_LEAVE">On Leave</MenuItem>

            <MenuItem value="RESIGNED">Resigned</MenuItem>

            <MenuItem value="TERMINATED">Terminated</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="user-employment-type-label">Employment Type</InputLabel>

          <Select
            labelId="user-employment-type-label"
            value={employmentType}
            label="Employment Type"
            onChange={(e) => setEmploymentType(e.target.value as EmploymentType | "")}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>

            <MenuItem value="FULL_TIME">Full Time</MenuItem>

            <MenuItem value="PART_TIME">Part Time</MenuItem>

            <MenuItem value="CONTRACT">Contract</MenuItem>

            <MenuItem value="INTERN">Intern</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={departmentsLoading}>
          <InputLabel id="user-department-label">Department</InputLabel>

          <Select
            labelId="user-department-label"
            value={departmentId}
            label="Department"
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>

            {departments.map((department) => (
              <MenuItem key={department.id} value={department.id}>
                {department.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={positionsLoading}>
          <InputLabel id="user-position-label">Position</InputLabel>

          <Select
            labelId="user-position-label"
            value={positionId}
            label="Position"
            onChange={(e) => setPositionId(e.target.value)}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>

            {positions.map((position) => (
              <MenuItem key={position.id} value={position.id}>
                {position.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </FormDialog>
  );
}
