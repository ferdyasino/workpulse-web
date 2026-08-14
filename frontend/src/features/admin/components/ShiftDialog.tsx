import { useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";

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

type ShiftValues = {
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
  graceMinutes: string;
  breakMinutes: string;
  isOvernight: boolean;
};

export default function ShiftDialog({
  open,
  loading = false,
  shift = null,
  onClose,
  onSubmit,
}: Props) {
  const dialogModeRef = useRef<"add" | "edit">("add");

  const initialValuesRef = useRef<ShiftValues>({
    name: "",
    description: "",
    startTime: "",
    endTime: "",
    timezone: "Asia/Manila",
    graceMinutes: "10",
    breakMinutes: "60",
    isOvernight: false,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timezone, setTimezone] = useState("Asia/Manila");
  const [graceMinutes, setGraceMinutes] = useState("10");
  const [breakMinutes, setBreakMinutes] = useState("60");
  const [isOvernight, setIsOvernight] = useState(false);

  const isEdit = open ? Boolean(shift) : dialogModeRef.current === "edit";

  const isDirty =
    name !== initialValuesRef.current.name ||
    description !== initialValuesRef.current.description ||
    startTime !== initialValuesRef.current.startTime ||
    endTime !== initialValuesRef.current.endTime ||
    timezone !== initialValuesRef.current.timezone ||
    graceMinutes !== initialValuesRef.current.graceMinutes ||
    breakMinutes !== initialValuesRef.current.breakMinutes ||
    isOvernight !== initialValuesRef.current.isOvernight;

  useEffect(() => {
    if (!open) {
      return;
    }

    dialogModeRef.current = shift ? "edit" : "add";
  }, [open, shift]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const values: ShiftValues = shift
      ? {
          name: shift.name,
          description: shift.description ?? "",
          startTime: shift.start_time,
          endTime: shift.end_time,
          timezone: shift.timezone,
          graceMinutes: String(shift.grace_minutes),
          breakMinutes: String(shift.break_minutes),
          isOvernight: shift.is_overnight,
        }
      : {
          name: "",
          description: "",
          startTime: "",
          endTime: "",
          timezone: "Asia/Manila",
          graceMinutes: "10",
          breakMinutes: "60",
          isOvernight: false,
        };

    setName(values.name);
    setDescription(values.description);
    setStartTime(values.startTime);
    setEndTime(values.endTime);
    setTimezone(values.timezone);
    setGraceMinutes(values.graceMinutes);
    setBreakMinutes(values.breakMinutes);
    setIsOvernight(values.isOvernight);

    initialValuesRef.current = values;
  }, [open, shift]);

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
        <DialogTitle sx={{ flexShrink: 0 }}>{isEdit ? "Edit Shift" : "Add Shift"}</DialogTitle>

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
              label="Shift Name"
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
              minRows={2}
              fullWidth
            />

            <TextField
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
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
              onChange={(event) => setEndTime(event.target.value)}
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
              onChange={(event) => setTimezone(event.target.value)}
              fullWidth
            />

            <TextField
              label="Grace Minutes"
              type="number"
              value={graceMinutes}
              onChange={(event) => setGraceMinutes(event.target.value)}
              fullWidth
            />

            <TextField
              label="Break Minutes"
              type="number"
              value={breakMinutes}
              onChange={(event) => setBreakMinutes(event.target.value)}
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={isOvernight}
                  onChange={(event) => setIsOvernight(event.target.checked)}
                />
              }
              label="Overnight Shift"
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
