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

import { useDepartments } from "../hooks/useDepartments";
import type { Department } from "../services/departments.service";

import DepartmentDialog from "./DepartmentDialog";

export default function DepartmentsTab() {
  const snackbar = useSnackbar();

  const {
    departments,
    loading,
    error,

    includeInactive,
    includeDeleted,

    setIncludeInactive,
    setIncludeDeleted,

    createDepartment,
    updateDepartment,

    activateDepartment,
    deactivateDepartment,

    deleteDepartment,
    restoreDepartment,
    hardDeleteDepartment,
  } = useDepartments();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  const [departmentToHardDelete, setDepartmentToHardDelete] = useState<Department | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (values: { name: string; description?: string }) => {
    try {
      setSaving(true);

      if (editingDepartment) {
        await updateDepartment({
          id: editingDepartment.id,
          ...values,
        });

        snackbar.success("Department updated successfully.");
      } else {
        await createDepartment(values);

        snackbar.success("Department created successfully.");
      }

      setDialogOpen(false);
      setEditingDepartment(null);
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to save department.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!departmentToDelete) {
      return;
    }

    try {
      setDeleting(true);

      await deleteDepartment(departmentToDelete.id);

      snackbar.success("Department deleted.");
      setDepartmentToDelete(null);
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to delete department.");
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmHardDelete = async () => {
    if (!departmentToHardDelete) {
      return;
    }

    try {
      setDeleting(true);

      await hardDeleteDepartment(departmentToHardDelete.id);

      snackbar.success("Department permanently deleted.");
      setDepartmentToHardDelete(null);
    } catch (err) {
      snackbar.error(
        err instanceof Error ? err.message : "Unable to permanently delete department.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingDepartment(null);
    setDialogOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingDepartment(null);
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
            Departments
          </Typography>

          <Button variant="contained" onClick={handleOpenCreate}>
            Add Department
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
                onChange={(event) => setIncludeInactive(event.target.checked)}
              />
            }
            label="Show inactive"
          />

          <FormControlLabel
            control={
              <Switch
                checked={includeDeleted}
                onChange={(event) => setIncludeDeleted(event.target.checked)}
              />
            }
            label="Show deleted"
          />
        </Box>

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    {error}
                  </TableCell>
                </TableRow>
              ) : departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>No departments found.</TableCell>
                </TableRow>
              ) : (
                departments.map((department) => {
                  const deleted = Boolean(department.deleted_at);

                  return (
                    <TableRow
                      key={department.id}
                      hover
                      onClick={deleted ? undefined : () => handleEdit(department)}
                      sx={{
                        cursor: deleted ? "default" : "pointer",
                      }}
                    >
                      <TableCell>{department.name}</TableCell>

                      <TableCell>{department.description ?? "-"}</TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={deleted ? "DELETED" : department.status}
                          color={
                            deleted
                              ? "error"
                              : department.status === "ACTIVE"
                                ? "success"
                                : "default"
                          }
                        />
                      </TableCell>

                      <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                        <TableAction
                          onEdit={deleted ? undefined : () => handleEdit(department)}
                          onActivate={
                            !deleted && department.status === "INACTIVE"
                              ? () => void activateDepartment(department.id)
                              : undefined
                          }
                          onDeactivate={
                            !deleted && department.status === "ACTIVE"
                              ? () => void deactivateDepartment(department.id)
                              : undefined
                          }
                          onDelete={!deleted ? () => setDepartmentToDelete(department) : undefined}
                          onRestore={
                            deleted ? () => void restoreDepartment(department.id) : undefined
                          }
                          onHardDelete={
                            deleted ? () => setDepartmentToHardDelete(department) : undefined
                          }
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

      <DepartmentDialog
        open={dialogOpen}
        loading={saving}
        department={editingDepartment}
        onClose={handleDialogClose}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(departmentToDelete)}
        title="Delete Department"
        message={`Delete "${departmentToDelete?.name}"?`}
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setDepartmentToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        open={Boolean(departmentToHardDelete)}
        title="Permanently Delete Department"
        message={`Permanently delete "${departmentToHardDelete?.name}"? This cannot be undone.`}
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setDepartmentToHardDelete(null);
          }
        }}
        onConfirm={handleConfirmHardDelete}
      />
    </>
  );
}
