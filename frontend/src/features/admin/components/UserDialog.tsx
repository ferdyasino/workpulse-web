import { useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { useDepartments } from "../hooks/useDepartments";
import { usePositions } from "../hooks/usePositions";

import type { EmploymentStatus, EmploymentType, User, UserRole } from "../services/users.service";

import {
  DEFAULT_EMPLOYEE_NUMBER_FORMAT,
  formatEmployeeNumber,
  normalizeEmployeeNumber,
  normalizeEmployeeNumberFormat,
  parseEmployeeNumber,
  validateEmployeeNumber,
  type EmployeeNumberFormat,
} from "@/utils/employeeNo";

export type UserAuthMethod = "GOOGLE" | "PASSWORD";

export type UserFormValues = {
  employee_no: string;
  display_name: string;
  email: string;

  /**
   * Authentication method used by the employee.
   *
   * GOOGLE:
   *   The employee authenticates through Google OAuth.
   *
   * PASSWORD:
   *   The employee authenticates using Supabase email/password auth.
   */
  auth_method: UserAuthMethod;

  /**
   * Only supplied when auth_method === "PASSWORD".
   *
   * This value must never be stored in public.users.
   * The backend must pass it to Supabase Auth.
   */
  password?: string;

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

  /**
   * Existing Employee Nos. currently loaded in the Users table.
   *
   * Used only by the frontend Auto-generate function.
   *
   * The backend/database remains the final authority for uniqueness.
   */
  existingEmployeeNumbers?: string[];

  /**
   * Workspace Employee No. generation format.
   *
   * This can later come from ADMIN workspace settings.
   *
   * Example:
   * {
   *   prefix: "EMP",
   *   padding: 6,
   *   separator: "-"
   * }
   */
  employeeNumberFormat?: EmployeeNumberFormat;
};

type DialogValues = {
  employeeNo: string;
  displayName: string;
  email: string;
  authMethod: UserAuthMethod;
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
  existingEmployeeNumbers = [],
  employeeNumberFormat = DEFAULT_EMPLOYEE_NUMBER_FORMAT,
}: Props) {
  const { departments, loading: departmentsLoading } = useDepartments();
  const { positions, loading: positionsLoading } = usePositions();

  const addModeRef = useRef(false);
  const dialogModeRef = useRef<"add" | "edit">("add");

  const initialValuesRef = useRef<DialogValues>({
    employeeNo: "",
    displayName: "",
    email: "",
    authMethod: "GOOGLE",
    role: "",
    employmentStatus: "",
    employmentType: "",
    departmentId: "",
    positionId: "",
  });

  const [employeeNo, setEmployeeNo] = useState("");
  const [employeeNoError, setEmployeeNoError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  const [authMethod, setAuthMethod] = useState<UserAuthMethod>("GOOGLE");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

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
    authMethod !== initialValuesRef.current.authMethod ||
    role !== initialValuesRef.current.role ||
    employmentStatus !== initialValuesRef.current.employmentStatus ||
    employmentType !== initialValuesRef.current.employmentType ||
    departmentId !== initialValuesRef.current.departmentId ||
    positionId !== initialValuesRef.current.positionId ||
    password.length > 0 ||
    confirmPassword.length > 0;

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
      /**
       * The database/application User model uses `login_provider`
       * as the canonical authentication provider field.
       *
       * The dialog intentionally maps that backend value into the
       * UI-specific `UserAuthMethod`.
       */
      const existingAuthMethod: UserAuthMethod =
        user.login_provider.toLowerCase() === "google" ? "GOOGLE" : "PASSWORD";

      const values: DialogValues = {
        employeeNo: user.employee_no ?? "",
        displayName: user.display_name ?? "",
        email: user.email ?? "",
        authMethod: existingAuthMethod,
        role: user.role ?? "",
        employmentStatus: user.employment_status ?? "",
        employmentType: user.employment_type ?? "",
        departmentId: user.department_id ?? "",
        positionId: user.position_id ?? "",
      };

      setEmployeeNo(values.employeeNo);
      setEmployeeNoError("");

      setDisplayName(values.displayName);
      setEmail(values.email);

      setAuthMethod(values.authMethod);
      setPassword("");
      setConfirmPassword("");
      setPasswordError("");

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
        authMethod: "GOOGLE",
        role: "",
        employmentStatus: "",
        employmentType: "",
        departmentId: "",
        positionId: "",
      };

      setEmployeeNo(values.employeeNo);
      setEmployeeNoError("");

      setDisplayName(values.displayName);
      setEmail(values.email);

      setAuthMethod(values.authMethod);
      setPassword("");
      setConfirmPassword("");
      setPasswordError("");

      setRole(values.role);
      setEmploymentStatus(values.employmentStatus);
      setEmploymentType(values.employmentType);
      setDepartmentId(values.departmentId);
      setPositionId(values.positionId);

      initialValuesRef.current = values;
    }
  }, [isLoadingUser, open, user]);

  /**
   * Handle manual Employee No. input.
   *
   * Custom Employee Nos. are allowed.
   *
   * Examples:
   *   EMP-000001
   *   HR-001
   *   FIN-2026-001
   *   STAFF-A001
   */
  const handleEmployeeNoChange = (value: string) => {
    const normalizedValue = normalizeEmployeeNumber(value);

    setEmployeeNo(normalizedValue);

    if (!normalizedValue) {
      setEmployeeNoError("");
      return;
    }

    const validation = validateEmployeeNumber(normalizedValue);

    setEmployeeNoError(validation.valid ? "" : (validation.error ?? "Invalid Employee No."));
  };

  /**
   * Generate the next available Employee No. using the currently loaded
   * Employee Nos.
   *
   * Example:
   *
   * Existing:
   *   EMP-000001
   *   EMP-000002
   *   EMP-000005
   *
   * Result:
   *   EMP-000006
   *
   * If there are gaps, we deliberately use MAX + 1 rather than filling
   * an old deleted Employee No.
   */
  const handleAutoGenerate = () => {
    const format = normalizeEmployeeNumberFormat(employeeNumberFormat);

    let highestSequence = 0;

    for (const existingEmployeeNumber of existingEmployeeNumbers) {
      const normalizedExisting = normalizeEmployeeNumber(existingEmployeeNumber);

      if (!normalizedExisting) {
        continue;
      }

      const sequence = parseEmployeeNumber(normalizedExisting, format);

      if (sequence !== null && sequence > highestSequence) {
        highestSequence = sequence;
      }
    }

    let nextSequence = highestSequence + 1;

    /**
     * Safety check against the currently loaded Employee Nos.
     *
     * Normally MAX + 1 is already available, but this additionally protects
     * against unusual data or formatting situations.
     */
    let generatedEmployeeNo = formatEmployeeNumber(nextSequence, format);

    const existingSet = new Set(
      existingEmployeeNumbers.map((value) => normalizeEmployeeNumber(value)),
    );

    while (existingSet.has(normalizeEmployeeNumber(generatedEmployeeNo))) {
      nextSequence += 1;

      generatedEmployeeNo = formatEmployeeNumber(nextSequence, format);
    }

    setEmployeeNo(generatedEmployeeNo);
    setEmployeeNoError("");
  };

  const handleAuthMethodChange = (value: UserAuthMethod) => {
    setAuthMethod(value);

    if (value === "GOOGLE") {
      setPassword("");
      setConfirmPassword("");
      setPasswordError("");
    }
  };

  const handleSubmit = async () => {
    if (isLoadingUser || !displayName.trim() || !email.trim()) {
      return;
    }

    const normalizedEmployeeNo = normalizeEmployeeNumber(employeeNo);

    const employeeValidation = validateEmployeeNumber(normalizedEmployeeNo);

    if (!employeeValidation.valid) {
      setEmployeeNoError(employeeValidation.error ?? "Invalid Employee No.");
      return;
    }

    /**
     * Password validation applies only to PASSWORD authentication.
     *
     * On edit, an empty password means:
     * "keep the existing password".
     */
    if (authMethod === "PASSWORD") {
      const isCreatingPasswordAccount = !isEdit;

      if (isCreatingPasswordAccount && !password) {
        setPasswordError("Password is required.");
        return;
      }

      if (password && password.length < 8) {
        setPasswordError("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setPasswordError("Passwords do not match.");
        return;
      }
    }

    setPasswordError("");

    await onSubmit({
      employee_no: normalizedEmployeeNo,
      display_name: displayName.trim(),
      email: email.trim(),
      auth_method: authMethod,

      /**
       * Do not send an empty password during edit.
       *
       * The backend can interpret an omitted password as:
       * "do not change the existing password."
       */
      ...(authMethod === "PASSWORD" && password ? { password } : {}),

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
    setEmployeeNoError("");
    setDisplayName("");
    setEmail("");

    setAuthMethod("GOOGLE");
    setPassword("");
    setConfirmPassword("");
    setPasswordError("");

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
              {/* ---------------------------------------------------------------- */}
              {/* Employee No.                                                     */}
              {/* ---------------------------------------------------------------- */}

              <Stack spacing={0.75}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <TextField
                    label="Employee No."
                    value={employeeNo}
                    onChange={(event) => handleEmployeeNoChange(event.target.value)}
                    error={Boolean(employeeNoError)}
                    helperText={
                      employeeNoError || "Leave blank to let the system generate one on save."
                    }
                    fullWidth
                  />

                  <Button
                    variant="outlined"
                    onClick={handleAutoGenerate}
                    disabled={loading || isLoadingUser}
                    sx={{
                      minWidth: 130,
                      mt: 1,
                      flexShrink: 0,
                    }}
                  >
                    Auto-generate
                  </Button>
                </Box>
              </Stack>

              {/* ---------------------------------------------------------------- */}
              {/* Display Name                                                     */}
              {/* ---------------------------------------------------------------- */}

              <TextField
                label="Display Name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                autoFocus
                fullWidth
              />

              {/* ---------------------------------------------------------------- */}
              {/* Email                                                             */}
              {/* ---------------------------------------------------------------- */}

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                fullWidth
              />

              {/* ---------------------------------------------------------------- */}
              {/* Authentication Method                                            */}
              {/* ---------------------------------------------------------------- */}

              <FormControl fullWidth>
                <InputLabel id="user-auth-method-label">Authentication Method</InputLabel>

                <Select
                  labelId="user-auth-method-label"
                  value={authMethod}
                  label="Authentication Method"
                  onChange={(event) => handleAuthMethodChange(event.target.value as UserAuthMethod)}
                >
                  <MenuItem value="GOOGLE">Google</MenuItem>

                  <MenuItem value="PASSWORD">Email &amp; Password</MenuItem>
                </Select>

                <FormHelperText>
                  {authMethod === "GOOGLE"
                    ? "User signs in using Google OAuth."
                    : "User signs in using their WorkPulse email and password."}
                </FormHelperText>
              </FormControl>

              {/* ---------------------------------------------------------------- */}
              {/* Password                                                          */}
              {/* ---------------------------------------------------------------- */}

              {authMethod === "PASSWORD" && (
                <Stack spacing={2}>
                  <TextField
                    label={isEdit ? "New Password" : "Password"}
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordError("");
                    }}
                    required={!isEdit}
                    fullWidth
                    error={Boolean(passwordError)}
                    autoComplete="new-password"
                    helperText={
                      isEdit ? "Leave blank to keep the current password." : "Minimum 8 characters."
                    }
                  />

                  <TextField
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setPasswordError("");
                    }}
                    required={!isEdit && authMethod === "PASSWORD"}
                    fullWidth
                    error={Boolean(passwordError)}
                    autoComplete="new-password"
                    helperText={
                      passwordError ||
                      (isEdit
                        ? "Only required when changing the password."
                        : "Enter the password again.")
                    }
                  />
                </Stack>
              )}

              {/* ---------------------------------------------------------------- */}
              {/* Role                                                              */}
              {/* ---------------------------------------------------------------- */}

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

              {/* ---------------------------------------------------------------- */}
              {/* Employment Status                                                */}
              {/* ---------------------------------------------------------------- */}

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

              {/* ---------------------------------------------------------------- */}
              {/* Employment Type                                                  */}
              {/* ---------------------------------------------------------------- */}

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

              {/* ---------------------------------------------------------------- */}
              {/* Department                                                        */}
              {/* ---------------------------------------------------------------- */}

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

              {/* ---------------------------------------------------------------- */}
              {/* Position                                                          */}
              {/* ---------------------------------------------------------------- */}

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
