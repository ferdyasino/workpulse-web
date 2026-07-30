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
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { useSnackbar } from "@/components/ui";
import ConfirmDialog from "@/components/ui/dialogs/ConfirmDialog";
import TableAction from "@/components/ui/TableAction/TableAction";

import UserShiftOverrideDialog from "./UserShiftOverrideDialog";

import { useUserShiftOverrides } from "../hooks/useUserShiftOverrides";
import type { UserShiftOverride } from "../types/userShiftOverrides.types";

export default function UserShiftOverridesTab() {
  const snackbar = useSnackbar();

  const {
    userShiftOverrides,
    users,
    shifts,

    loading,
    error,

    includeDeleted,
    setIncludeDeleted,

    createUserShiftOverride,
    updateUserShiftOverride,

    deleteUserShiftOverride,
    restoreUserShiftOverride,
    hardDeleteUserShiftOverride,
  } = useUserShiftOverrides();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingOverride, setEditingOverride] = useState<UserShiftOverride | null>(null);

  const [overrideToDelete, setOverrideToDelete] = useState<UserShiftOverride | null>(null);

  const [overrideToHardDelete, setOverrideToHardDelete] = useState<UserShiftOverride | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getOverrideStatus = (item: UserShiftOverride) => {
    if (item.deleted_at) {
      return {
        label: "DELETED",
        color: "error" as const,
      };
    }

    const today = new Date().toISOString().slice(0, 10);

    if (item.effective_from > today) {
      return {
        label: "SCHEDULED",
        color: "info" as const,
      };
    }

    if (item.effective_to && item.effective_to < today) {
      return {
        label: "EXPIRED",
        color: "warning" as const,
      };
    }

    return {
      label: "ACTIVE",
      color: "success" as const,
    };
  };

  const handleSave = async (values: {
    user_id: string;
    shift_id: string;
    effective_from: string;
    effective_to?: string;
    reason?: string;
  }) => {
    try {
      setSaving(true);

      if (editingOverride) {
        await updateUserShiftOverride({
          id: editingOverride.id,
          shift_id: values.shift_id,
          effective_from: values.effective_from,
          effective_to: values.effective_to,
          reason: values.reason,
        });

        snackbar.success("Shift override updated.");
      } else {
        await createUserShiftOverride(values);

        snackbar.success("Shift override created.");
      }

      setDialogOpen(false);
      setEditingOverride(null);
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Unable to save shift override.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!overrideToDelete) return;

    try {
      setDeleting(true);

      await deleteUserShiftOverride(overrideToDelete.id);

      snackbar.success("Shift override deleted.");

      setOverrideToDelete(null);
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Unable to delete shift override.");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (item: UserShiftOverride) => {
    try {
      setDeleting(true);

      await restoreUserShiftOverride(item.id);

      snackbar.success("Shift override restored.");
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Unable to restore shift override.");
    } finally {
      setDeleting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!overrideToHardDelete) return;

    try {
      setDeleting(true);

      await hardDeleteUserShiftOverride(overrideToHardDelete.id);

      snackbar.success("Shift override permanently deleted.");

      setOverrideToHardDelete(null);
    } catch (error) {
      snackbar.error(
        error instanceof Error ? error.message : "Unable to permanently delete shift override.",
      );
    } finally {
      setDeleting(false);
    }
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
            User Shift Overrides
          </Typography>

          <Button
            variant="contained"
            onClick={() => {
              setEditingOverride(null);
              setDialogOpen(true);
            }}
          >
            Add Override
          </Button>
        </Box>

        <Box sx={{ mb: 2 }}>
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

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 4,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Shift</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Timezone</TableCell>
                  <TableCell>Effective From</TableCell>
                  <TableCell>Effective To</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {userShiftOverrides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      No shift overrides found.
                    </TableCell>
                  </TableRow>
                ) : (
                  userShiftOverrides.map((item) => {
                    const status = getOverrideStatus(item);

                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.users?.display_name ?? item.user_id}</TableCell>

                        <TableCell>{item.users?.email ?? "-"}</TableCell>

                        <TableCell>{item.shifts?.name ?? item.shift_id}</TableCell>

                        <TableCell>
                          {item.shifts
                            ? `${item.shifts.start_time} - ${item.shifts.end_time}`
                            : "-"}
                        </TableCell>

                        <TableCell>{item.shifts?.timezone ?? "-"}</TableCell>

                        <TableCell>{item.effective_from}</TableCell>

                        <TableCell>{item.effective_to ?? "OPEN"}</TableCell>

                        <TableCell>{item.reason ?? "-"}</TableCell>

                        <TableCell>
                          <Chip size="small" label={status.label} color={status.color} />
                        </TableCell>

                        <TableCell align="right">
                          <TableAction
                            onEdit={
                              item.deleted_at
                                ? undefined
                                : () => {
                                    setEditingOverride(item);
                                    setDialogOpen(true);
                                  }
                            }

                            onDelete={item.deleted_at ? undefined : () => setOverrideToDelete(item)}

                            onRestore={item.deleted_at ? () => void handleRestore(item) : undefined}

                            onHardDelete={
                              item.deleted_at ? () => setOverrideToHardDelete(item) : undefined
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <UserShiftOverrideDialog
        open={dialogOpen}
        loading={saving}
        override={editingOverride}
        users={users}
        shifts={shifts}
        onClose={() => {
          if (!saving) {
            setDialogOpen(false);
            setEditingOverride(null);
          }
        }}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(overrideToDelete)}
        title="Delete Shift Override"
        message="Delete this user shift override?"
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setOverrideToDelete(null);
          }
        }}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={Boolean(overrideToHardDelete)}
        title="Permanently Delete Shift Override"
        message="Permanently delete this shift override? This cannot be undone."
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setOverrideToHardDelete(null);
          }
        }}
        onConfirm={handleHardDelete}
      />
    </>
  );
}
