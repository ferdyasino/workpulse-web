import { useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
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

import UserShiftDialog from "./UserShiftDialog";

import { useShifts } from "../hooks/useShifts";
import { useUserShifts } from "../hooks/useUserShifts";

import type { UserShift } from "../services/userShifts.service";

type UserOption = {
  id: string;
  display_name: string | null;
  email: string;
};

type Props = {
  users: UserOption[];
};

export default function UserShiftsTab({ users }: Props) {
  const snackbar = useSnackbar();

  const [selectedUserId, setSelectedUserId] = useState("");

  const {
    userShifts,
    loading,
    error,

    createUserShift,
    updateUserShift,

    deleteUserShift,
    restoreUserShift,
    hardDeleteUserShift,
  } = useUserShifts(selectedUserId);

  const { shifts } = useShifts();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingUserShift, setEditingUserShift] = useState<UserShift | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<UserShift | null>(null);

  const [hardDeleteTarget, setHardDeleteTarget] = useState<UserShift | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedUser = users.find((user) => user.id === selectedUserId);

  const handleSave = async (values: {
    shift_id: string;
    attendance_policy_id?: string | null;
    effective_from: string;
    effective_to?: string | null;
  }) => {
    try {
      setSaving(true);

      if (editingUserShift) {
        await updateUserShift({
          id: editingUserShift.id,
          ...values,
        });

        snackbar.success("User shift updated.");
      } else {
        await createUserShift(values);

        snackbar.success("User shift created.");
      }

      setDialogOpen(false);
      setEditingUserShift(null);
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Unable to save user shift.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await deleteUserShift(deleteTarget.id);

      snackbar.success("User shift deleted.");

      setDeleteTarget(null);
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Unable to delete user shift.");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (item: UserShift) => {
    try {
      setDeleting(true);

      await restoreUserShift(item.id);

      snackbar.success("User shift restored.");
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Unable to restore user shift.");
    } finally {
      setDeleting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!hardDeleteTarget) return;

    try {
      setDeleting(true);

      await hardDeleteUserShift(hardDeleteTarget.id);

      snackbar.success("User shift permanently deleted.");

      setHardDeleteTarget(null);
    } catch (error) {
      snackbar.error(
        error instanceof Error ? error.message : "Unable to permanently delete user shift.",
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
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 3,
          }}
        >
          User Shift Assignments
        </Typography>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Select User</InputLabel>

            <Select
              value={selectedUserId}
              label="Select User"
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <MenuItem value="">Select user...</MenuItem>

              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.display_name || user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="subtitle1">
            {selectedUser ? selectedUser.display_name || selectedUser.email : "No user selected"}
          </Typography>

          <Button
            variant="contained"
            disabled={!selectedUserId}
            onClick={() => {
              setEditingUserShift(null);
              setDialogOpen(true);
            }}
          >
            Assign Shift
          </Button>
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
            <Table
              size="small"
              sx={{
                minWidth: 900,
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Shift</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Timezone</TableCell>
                  <TableCell>Effective From</TableCell>
                  <TableCell>Effective To</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {userShifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No shift assignments.
                    </TableCell>
                  </TableRow>
                ) : (
                  userShifts.map((item) => {
                    const deleted = Boolean(item.deleted_at);

                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.shifts?.name ?? "-"}</TableCell>

                        <TableCell>
                          {item.shifts
                            ? `${item.shifts.start_time} - ${item.shifts.end_time}`
                            : "-"}
                        </TableCell>

                        <TableCell>{item.shifts?.timezone ?? "-"}</TableCell>

                        <TableCell>{item.effective_from}</TableCell>

                        <TableCell>{item.effective_to ?? "OPEN"}</TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={deleted ? "DELETED" : "ACTIVE"}
                            color={deleted ? "error" : "success"}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <TableAction
                            onEdit={
                              deleted
                                ? undefined
                                : () => {
                                    setEditingUserShift(item);
                                    setDialogOpen(true);
                                  }
                            }
                            onDelete={deleted ? undefined : () => setDeleteTarget(item)}
                            onRestore={deleted ? () => void handleRestore(item) : undefined}
                            onHardDelete={deleted ? () => setHardDeleteTarget(item) : undefined}
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

      <UserShiftDialog
        open={dialogOpen}
        loading={saving}
        assignment={editingUserShift}
        shifts={shifts}
        onClose={() => {
          if (!saving) {
            setDialogOpen(false);
            setEditingUserShift(null);
          }
        }}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete User Shift"
        message="Delete this user shift assignment?"
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={Boolean(hardDeleteTarget)}
        title="Permanently Delete User Shift"
        message="Permanently delete this assignment? This cannot be undone."
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setHardDeleteTarget(null);
          }
        }}
        onConfirm={handleHardDelete}
      />
    </>
  );
}
