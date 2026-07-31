import { useEffect, useState } from "react";

import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { FormDialog } from "@/components/ui";

import type { Shift } from "../services/shifts.service";
import type { UserShift } from "../services/userShifts.service";

type Props = {
  open: boolean;
  loading?: boolean;

  assignment: UserShift | null;

  shifts?: Shift[];

  onClose: () => void;

  onSubmit: (values: {
    shift_id: string;
    attendance_policy_id?: string | null;
    effective_from: string;
    effective_to?: string | null;
  }) => Promise<void>;
};

export default function UserShiftDialog({
  open,
  loading = false,
  assignment,
  shifts = [],
  onClose,
  onSubmit,
}: Props) {
  const [shiftId, setShiftId] = useState("");
  const [attendancePolicyId, setAttendancePolicyId] = useState("");

  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  const resetForm = () => {
    setShiftId("");
    setAttendancePolicyId("");
    setEffectiveFrom("");
    setEffectiveTo("");
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (assignment) {
      setShiftId(assignment.shift_id);
      setAttendancePolicyId(assignment.attendance_policy_id ?? "");
      setEffectiveFrom(assignment.effective_from);
      setEffectiveTo(assignment.effective_to ?? "");
    } else {
      resetForm();
    }
  }, [open, assignment]);

  const handleSubmit = async () => {
    if (!shiftId || !effectiveFrom) {
      return;
    }

    await onSubmit({
      shift_id: shiftId,
      attendance_policy_id: attendancePolicyId || null,
      effective_from: effectiveFrom,
      effective_to: effectiveTo || null,
    });
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    resetForm();

    onClose();
  };

  return (
    <FormDialog
      open={open}
      title={assignment ? "Edit User Shift" : "Assign Shift"}
      submitLabel={assignment ? "Save Changes" : "Assign"}
      loading={loading}
      onClose={handleClose}
      onSubmit={handleSubmit}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          select
          label="Shift"
          value={shiftId}
          onChange={(e) => setShiftId(e.target.value)}
          required
          fullWidth
        >
          {shifts.length > 0 ? (
            shifts.map((shift) => (
              <MenuItem key={shift.id} value={shift.id}>
                {shift.name}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No shifts available</MenuItem>
          )}
        </TextField>

        <TextField
          label="Attendance Policy ID"
          value={attendancePolicyId}
          onChange={(e) => setAttendancePolicyId(e.target.value)}
          placeholder="Optional"
          fullWidth
        />

        <TextField
          label="Effective From"
          type="date"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
          required
          fullWidth
        />

        <TextField
          label="Effective To"
          type="date"
          value={effectiveTo}
          onChange={(e) => setEffectiveTo(e.target.value)}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
          fullWidth
        />
      </Stack>
    </FormDialog>
  );
}
