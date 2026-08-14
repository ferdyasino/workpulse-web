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

import type { User, UserListItem } from "../services/users.service";

import { useUsers } from "../hooks/useUsers";

import UserDialog, { type UserFormValues } from "./UserDialog";

export default function UsersTab() {
  const snackbar = useSnackbar();

  const {
    users,
    loading,
    error,

    includeInactive,
    includeDeleted,

    setIncludeInactive,
    setIncludeDeleted,

    getUser,

    createUser,
    updateUser,

    activateUser,
    deactivateUser,

    deleteUser,
    restoreUser,
    hardDeleteUser,
  } = useUsers();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);
  const [userToHardDelete, setUserToHardDelete] = useState<UserListItem | null>(null);

  const [saving, setSaving] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (values: UserFormValues) => {
    const nameParts = values.display_name.trim().split(/\s+/);

    const first_name = nameParts[0] ?? "";
    const last_name = nameParts.slice(1).join(" ") || first_name;

    try {
      setSaving(true);

      if (editingUser) {
        await updateUser({
          id: editingUser.id,
          first_name,
          last_name,
          ...values,
        });

        snackbar.success("User updated successfully.");
      } else {
        await createUser({
          first_name,
          last_name,
          ...values,
        });

        snackbar.success("User created successfully.");
      }

      setDialogOpen(false);
      setEditingUser(null);
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (user: UserListItem) => {
    setEditingUser(null);
    setDialogOpen(true);
    setLoadingUser(true);

    try {
      const fullUser = await getUser(user.id);

      setEditingUser(fullUser);
    } catch (err) {
      setDialogOpen(false);

      snackbar.error(err instanceof Error ? err.message : "Unable to load user.");
    } finally {
      setLoadingUser(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    if (saving || loadingUser) {
      return;
    }

    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) {
      return;
    }

    try {
      setDeleting(true);

      await deleteUser(userToDelete.id);

      snackbar.success("User deleted.");
      setUserToDelete(null);
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmHardDelete = async () => {
    if (!userToHardDelete) {
      return;
    }

    try {
      setDeleting(true);

      await hardDeleteUser(userToHardDelete.id);

      snackbar.success("User permanently deleted.");
      setUserToHardDelete(null);
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to permanently delete user.");
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
            Users
          </Typography>

          <Button variant="contained" onClick={handleAddUser} disabled={loadingUser}>
            Add User
          </Button>
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

        <Box
          sx={{
            width: "100%",
            overflowX: "auto",
          }}
        >
          <Table
            size="small"
            sx={{
              minWidth: 1200,
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Employee No.</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    {error}
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>No users found.</TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const deleted = Boolean(user.deleted_at);

                  return (
                    <TableRow
                      key={user.id}
                      hover
                      onClick={deleted ? undefined : () => void handleEdit(user)}
                      sx={{
                        cursor: deleted ? "default" : "pointer",
                      }}
                    >
                      <TableCell>{user.employee_no}</TableCell>

                      <TableCell>{user.display_name}</TableCell>

                      <TableCell>{user.email}</TableCell>

                      <TableCell>{user.role}</TableCell>

                      <TableCell>
                        {typeof user.department === "string"
                          ? user.department
                          : (user.department?.name ?? "-")}
                      </TableCell>

                      <TableCell>
                        {typeof user.position === "string"
                          ? user.position
                          : (user.position?.title ?? "-")}
                      </TableCell>

                      <TableCell>
                        {typeof user.shift === "string" ? user.shift : (user.shift?.name ?? "-")}
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={deleted ? "DELETED" : user.employment_status}
                          color={
                            deleted
                              ? "error"
                              : user.employment_status === "ACTIVE"
                                ? "success"
                                : "default"
                          }
                        />
                      </TableCell>

                      <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                        <TableAction
                          onEdit={deleted ? undefined : () => void handleEdit(user)}
                          onActivate={
                            !deleted && user.employment_status !== "ACTIVE"
                              ? () => void activateUser(user.id)
                              : undefined
                          }
                          onDeactivate={
                            !deleted && user.employment_status === "ACTIVE"
                              ? () => void deactivateUser(user.id)
                              : undefined
                          }
                          onDelete={!deleted ? () => setUserToDelete(user) : undefined}
                          onRestore={deleted ? () => void restoreUser(user.id) : undefined}
                          onHardDelete={deleted ? () => setUserToHardDelete(user) : undefined}
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

      <UserDialog
        open={dialogOpen}
        loading={saving || loadingUser}
        user={editingUser}
        onClose={handleDialogClose}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(userToDelete)}
        title="Delete User"
        message={`Delete "${userToDelete?.display_name}"?`}
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setUserToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        open={Boolean(userToHardDelete)}
        title="Permanently Delete User"
        message={`Permanently delete "${userToHardDelete?.display_name}"? This cannot be undone.`}
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setUserToHardDelete(null);
          }
        }}
        onConfirm={handleConfirmHardDelete}
      />
    </>
  );
}
