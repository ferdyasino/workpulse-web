import { useEffect, useState } from "react";

import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";

import { FormDialog } from "@/components/ui";

import type { Shift } from "../services/shifts.service";

type Props = {
  open: boolean;
  loading?: boolean;
  shift?: Shift | null;

  onClose: () => void;

  onSubmit: (values: {
    name: string;
    description?: string;
    start_time: string;
    end_time: string;
    timezone: string;
    grace_minutes?: number;
    break_minutes?: number;
    is_overnight?: boolean;
  }) => Promise<void>;
};

export default function ShiftDialog({
  open,
  loading = false,
  shift = null,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [timezone, setTimezone] = useState("Asia/Manila");

  const [graceMinutes, setGraceMinutes] = useState("10");
  const [breakMinutes, setBreakMinutes] = useState("60");

  const [isOvernight, setIsOvernight] = useState(false);

  const isEdit = Boolean(shift);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (shift) {
      setName(shift.name);
      setDescription(shift.description ?? "");

      setStartTime(shift.start_time);
      setEndTime(shift.end_time);

      setTimezone(shift.timezone);

      setGraceMinutes(String(shift.grace_minutes));
      setBreakMinutes(String(shift.break_minutes));

      setIsOvernight(shift.is_overnight);
    } else {
      setName("");
      setDescription("");

      setStartTime("");
      setEndTime("");

      setTimezone("Asia/Manila");

      setGraceMinutes("10");
      setBreakMinutes("60");

      setIsOvernight(false);
    }
  }, [shift, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !startTime || !endTime) {
      return;
    }

    await onSubmit({
      name: name.trim(),

      ...(description.trim()
        ? {
            description: description.trim(),
          }
        : {}),

      start_time: startTime,
      end_time: endTime,

      timezone,

      grace_minutes: Number(graceMinutes) || 0,
      break_minutes: Number(breakMinutes) || 0,

      is_overnight: isOvernight,
    });
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    setName("");
    setDescription("");

    setStartTime("");
    setEndTime("");

    setTimezone("Asia/Manila");

    setGraceMinutes("10");
    setBreakMinutes("60");

    setIsOvernight(false);

    onClose();
  };

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit Shift" : "Add Shift"}
      submitLabel={isEdit ? "Save Changes" : "Create"}
      loading={loading}
      onClose={handleClose}
      onSubmit={handleSubmit}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label="Shift Name"
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
          minRows={2}
          fullWidth
        />

        <TextField
          label="Start Time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
          required
          fullWidth
        />

        <TextField
          label="End Time"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
          required
          fullWidth
        />

        <TextField
          label="Timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          fullWidth
        />

        <TextField
          label="Grace Minutes"
          type="number"
          value={graceMinutes}
          onChange={(e) => setGraceMinutes(e.target.value)}
          fullWidth
        />

        <TextField
          label="Break Minutes"
          type="number"
          value={breakMinutes}
          onChange={(e) => setBreakMinutes(e.target.value)}
          fullWidth
        />

        <FormControlLabel
          control={
            <Switch checked={isOvernight} onChange={(e) => setIsOvernight(e.target.checked)} />
          }
          label="Overnight Shift"
        />
      </Stack>
    </FormDialog>
  );
}
