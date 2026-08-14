import { useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

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

type DialogValues = {
  employeeNo: string;
  displayName: string;
  email: string;
  role: UserRole | "";
  employmentStatus: EmploymentStatus | "";
  employmentType: EmploymentType | "";
  departmentId: string;
  positionId: string;
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

  const addModeRef = useRef(false);
  const dialogModeRef = useRef<"add" | "edit">("add");

  const initialValuesRef = useRef<DialogValues>({
    employeeNo: "",
    displayName: "",
    email: "",
    role: "",
    employmentStatus: "",
    employmentType: "",
    departmentId: "",
    positionId: "",
  });

  const [employeeNo, setEmployeeNo] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | "">("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");

  const isLoadingUser = open && loading && !user && !addModeRef.current;
  const activeDialogIsEdit = Boolean(user) || isLoadingUser;

  // Preserve the edit/add label while the dialog is closing.
  const isEdit = open ? activeDialogIsEdit : dialogModeRef.current === "edit";

  const isDirty =
    employeeNo !== initialValuesRef.current.employeeNo ||
    displayName !== initialValuesRef.current.displayName ||
    email !== initialValuesRef.current.email ||
    role !== initialValuesRef.current.role ||
    employmentStatus !== initialValuesRef.current.employmentStatus ||
    employmentType !== initialValuesRef.current.employmentType ||
    departmentId !== initialValuesRef.current.departmentId ||
    positionId !== initialValuesRef.current.positionId;

  useEffect(() => {
    if (!open) {
      addModeRef.current = false;
      return;
    }

    if (!user && !loading) {
      addModeRef.current = true;
    }
  }, [loading, open, user]);

  useEffect(() => {
    if (!open) {
      return;
    }

    dialogModeRef.current = activeDialogIsEdit ? "edit" : "add";
  }, [activeDialogIsEdit, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (user) {
      const values: DialogValues = {
        employeeNo: user.employee_no ?? "",
        displayName: user.display_name ?? "",
        email: user.email ?? "",
        role: user.role ?? "",
        employmentStatus: user.employment_status ?? "",
        employmentType: user.employment_type ?? "",
        departmentId: user.department_id ?? "",
        positionId: user.position_id ?? "",
      };

      setEmployeeNo(values.employeeNo);
      setDisplayName(values.displayName);
      setEmail(values.email);
      setRole(values.role);
      setEmploymentStatus(values.employmentStatus);
      setEmploymentType(values.employmentType);
      setDepartmentId(values.departmentId);
      setPositionId(values.positionId);

      initialValuesRef.current = values;
    } else if (!isLoadingUser) {
      const values: DialogValues = {
        employeeNo: "",
        displayName: "",
        email: "",
        role: "",
        employmentStatus: "",
        employmentType: "",
        departmentId: "",
        positionId: "",
      };

      setEmployeeNo(values.employeeNo);
      setDisplayName(values.displayName);
      setEmail(values.email);
      setRole(values.role);
      setEmploymentStatus(values.employmentStatus);
      setEmploymentType(values.employmentType);
      setDepartmentId(values.departmentId);
      setPositionId(values.positionId);

      initialValuesRef.current = values;
    }
  }, [isLoadingUser, open, user]);

  const handleSubmit = async () => {
    if (isLoadingUser || !displayName.trim() || !email.trim()) {
      return;
    }

    await onSubmit({
      employee_no: employeeNo.trim(),
      display_name: displayName.trim(),
      email: email.trim(),
      ...(role ? { role } : {}),
      ...(employmentStatus ? { employment_status: employmentStatus } : {}),
      ...(employmentType ? { employment_type: employmentType } : {}),
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
        <DialogTitle sx={{ flexShrink: 0 }}>{isEdit ? "Edit User" : "Add User"}</DialogTitle>

        <DialogContent
          dividers
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {isLoadingUser ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 280,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Employee No."
                value={employeeNo}
                onChange={(event) => setEmployeeNo(event.target.value)}
                fullWidth
              />

              <TextField
                label="Display Name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                autoFocus
                fullWidth
              />

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel id="user-role-label">Role</InputLabel>

                <Select
                  labelId="user-role-label"
                  value={role}
                  label="Role"
                  onChange={(event) => setRole(event.target.value as UserRole | "")}
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
                  onChange={(event) =>
                    setEmploymentStatus(event.target.value as EmploymentStatus | "")
                  }
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
                  onChange={(event) => setEmploymentType(event.target.value as EmploymentType | "")}
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
                  onChange={(event) => setDepartmentId(event.target.value)}
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
                  onChange={(event) => setPositionId(event.target.value)}
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
          )}
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

          <Button type="submit" variant="contained" disabled={loading || isLoadingUser}>
            {isEdit ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
