import { useEffect, useState } from "react";

import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { FormDialog } from "@/components/ui";

import type { Shift } from "../services/shifts.service";
import type { UserShiftOverride } from "../types/userShiftOverrides.types";

type UserOption = {
  id: string;
  display_name: string | null;
  email: string;
};

type Props = {
  open: boolean;
  loading?: boolean;

  override: UserShiftOverride | null;

  users?: UserOption[];
  shifts?: Shift[];

  onClose: () => void;

  onSubmit: (values: {
    user_id: string;
    shift_id: string;
    effective_from: string;
    effective_to?: string;
    reason?: string;
  }) => Promise<void>;
};

export default function UserShiftOverrideDialog({
  open,
  loading = false,
  override,
  users = [],
  shifts = [],
  onClose,
  onSubmit,
}: Props) {
  const [userId, setUserId] = useState("");
  const [shiftId, setShiftId] = useState("");

  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;

    if (override) {
      setUserId(override.user_id);
      setShiftId(override.shift_id);
      setEffectiveFrom(override.effective_from);
      setEffectiveTo(override.effective_to ?? "");
      setReason(override.reason ?? "");
    } else {
      setUserId("");
      setShiftId("");
      setEffectiveFrom("");
      setEffectiveTo("");
      setReason("");
    }
  }, [open, override]);

  const handleSubmit = async () => {
    if (!userId || !shiftId || !effectiveFrom) {
      return;
    }

    await onSubmit({
      user_id: userId,
      shift_id: shiftId,
      effective_from: effectiveFrom,
      effective_to: effectiveTo || undefined,
      reason: reason || undefined,
    });
  };

  return (
    <FormDialog
      open={open}
      title={override ? "Edit User Shift Override" : "Create User Shift Override"}
      submitLabel={override ? "Save Changes" : "Create"}
      loading={loading}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          select
          label="User"
          value={userId}
          disabled={Boolean(override)}
          onChange={(e) => setUserId(e.target.value)}
          fullWidth
        >
          {users.length > 0 ? (
            users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.display_name || user.email}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No users available</MenuItem>
          )}
        </TextField>

        <TextField
          select
          label="Shift"
          value={shiftId}
          onChange={(e) => setShiftId(e.target.value)}
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
          label="Effective From"
          type="date"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
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

        <TextField
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={3}
          fullWidth
        />
      </Stack>
    </FormDialog>
  );
}
