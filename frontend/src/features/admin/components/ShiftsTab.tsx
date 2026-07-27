import { useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { useSnackbar } from "@/components/ui";
import ConfirmDialog from "@/components/ui/dialogs/ConfirmDialog";
import TableAction from "@/components/ui/TableAction/TableAction";

import { formatTime } from "@/utils/time";

import ShiftDialog from "./ShiftDialog";

import type { Shift } from "../services/shifts.service";
import { useShifts } from "../hooks/useShifts";

export default function ShiftsTab() {
  const snackbar = useSnackbar();

  const {
    shifts,
    loading,
    error,

    includeInactive,
    includeDeleted,

    setIncludeInactive,
    setIncludeDeleted,

    createShift,
    updateShift,

    activateShift,
    deactivateShift,

    deleteShift,
    restoreShift,
    hardDeleteShift,
  } = useShifts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const [shiftToHardDelete, setShiftToHardDelete] = useState<Shift | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (values: {
    name: string;
    description?: string;
    start_time: string;
    end_time: string;
    timezone: string;
    grace_minutes?: number;
    break_minutes?: number;
    is_overnight?: boolean;
  }) => {
    try {
      setSaving(true);

      if (editingShift) {
        await updateShift({
          id: editingShift.id,
          ...values,
        });

        snackbar.success("Shift updated successfully.");
      } else {
        await createShift(values);

        snackbar.success("Shift created successfully.");
      }

      setDialogOpen(false);
      setEditingShift(null);
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to save shift.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!shiftToDelete) return;

    try {
      setDeleting(true);

      await deleteShift(shiftToDelete.id);

      snackbar.success("Shift deleted.");

      setShiftToDelete(null);
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to delete shift.");
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmHardDelete = async () => {
    if (!shiftToHardDelete) return;

    try {
      setDeleting(true);

      await hardDeleteShift(shiftToHardDelete.id);

      snackbar.success("Shift permanently deleted.");

      setShiftToHardDelete(null);
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to permanently delete shift.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setDialogOpen(true);
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Shifts
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={() => setImportDialogOpen(true)}>
              Import Shifts
            </Button>

            <Button
              variant="contained"
              onClick={() => {
                setEditingShift(null);
                setDialogOpen(true);
              }}
            >
              Add Shift
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 2,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
            }
            label="Show inactive"
          />

          <FormControlLabel
            control={
              <Switch
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
              />
            }
            label="Show deleted"
          />
        </Box>

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Timezone</TableCell>
                <TableCell>Grace</TableCell>
                <TableCell>Break</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {error}
                  </TableCell>
                </TableRow>
              ) : shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>No shifts found.</TableCell>
                </TableRow>
              ) : (
                shifts.map((shift) => {
                  const deleted = Boolean(shift.deleted_at);

                  return (
                    <TableRow key={shift.id} hover>
                      <TableCell>{shift.name}</TableCell>

                      <TableCell>{formatTime(shift.start_time, "12h")}</TableCell>

                      <TableCell>{formatTime(shift.end_time, "12h")}</TableCell>

                      <TableCell>{shift.timezone}</TableCell>

                      <TableCell>{shift.grace_minutes} min</TableCell>

                      <TableCell>{shift.break_minutes} min</TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={deleted ? "DELETED" : shift.status}
                          color={
                            deleted ? "error" : shift.status === "ACTIVE" ? "success" : "default"
                          }
                        />
                      </TableCell>

                      <TableCell align="right">
                        <TableAction
                          onEdit={deleted ? undefined : () => handleEdit(shift)}
                          onActivate={
                            !deleted && shift.status === "INACTIVE"
                              ? () => void activateShift(shift.id)
                              : undefined
                          }
                          onDeactivate={
                            !deleted && shift.status === "ACTIVE"
                              ? () => void deactivateShift(shift.id)
                              : undefined
                          }
                          onDelete={!deleted ? () => setShiftToDelete(shift) : undefined}
                          onRestore={deleted ? () => void restoreShift(shift.id) : undefined}
                          onHardDelete={deleted ? () => setShiftToHardDelete(shift) : undefined}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      <ShiftDialog
        open={dialogOpen}
        loading={saving}
        shift={editingShift}
        onClose={() => {
          if (!saving) {
            setDialogOpen(false);
            setEditingShift(null);
          }
        }}
        onSubmit={handleSave}
      />

      {importDialogOpen && (
        <ConfirmDialog
          open={importDialogOpen}
          title="Import Shifts"
          message="Shift import dialog will be added here."
          confirmLabel="Close"
          onClose={() => setImportDialogOpen(false)}
          onConfirm={async () => {
            setImportDialogOpen(false);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(shiftToDelete)}
        title="Delete Shift"
        message={`Delete "${shiftToDelete?.name}"?`}
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setShiftToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        open={Boolean(shiftToHardDelete)}
        title="Permanently Delete Shift"
        message={`Permanently delete "${shiftToHardDelete?.name}"? This cannot be undone.`}
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setShiftToHardDelete(null);
          }
        }}
        onConfirm={handleConfirmHardDelete}
      />
    </>
  );
}
