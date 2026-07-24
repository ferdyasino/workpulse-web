import { useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import TableAction from "@/components/ui/TableAction/TableAction";
import { useAuth } from "@/features/auth/hooks/useAuth";

import DepartmentDialog from "./DepartmentDialog";

import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type Department,
} from "../services/departments.service";

import { useDepartments } from "../hooks/useDepartments";

export default function DepartmentsTab() {
  const { user } = useAuth();

  const { departments, loading, error, refresh } = useDepartments();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const [saving, setSaving] = useState(false);

  const handleSave = async (values: { name: string; description?: string }) => {
    if (!user?.workspace_id) {
      return;
    }

    try {
      setSaving(true);

      if (editingDepartment) {
        await updateDepartment({
          id: editingDepartment.id,
          workspace_id: user.workspace_id,
          ...values,
        });
      } else {
        await createDepartment({
          workspace_id: user.workspace_id,
          ...values,
        });
      }

      setDialogOpen(false);
      setEditingDepartment(null);

      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (department: Department) => {
    if (!user?.workspace_id) {
      return;
    }

    const confirmed = window.confirm(`Delete department "${department.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteDepartment({
        id: department.id,
        workspace_id: user.workspace_id,
      });

      await refresh();
    } catch (error) {
      console.error("Delete department failed", error);
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

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingDepartment(null);
  };

  return (
    <>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
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

        <Table>
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
              departments.map((department) => (
                <TableRow key={department.id} hover>
                  <TableCell>{department.name}</TableCell>

                  <TableCell>{department.description ?? "-"}</TableCell>

                  <TableCell>
                    <Chip
                      label={department.status}
                      color={department.status === "ACTIVE" ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>

                  <TableCell align="right">
                    <TableAction
                      onEdit={() => handleEdit(department)}
                      onDelete={() => handleDelete(department)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <DepartmentDialog
        open={dialogOpen}
        loading={saving}
        department={editingDepartment}
        onClose={handleCloseDialog}
        onSubmit={handleSave}
      />
    </>
  );
}
