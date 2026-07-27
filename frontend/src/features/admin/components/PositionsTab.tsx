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

import { useAuth } from "@/features/auth/hooks/useAuth";

import { useSnackbar } from "@/components/ui";
import ConfirmDialog from "@/components/ui/dialogs/ConfirmDialog";
import TableAction from "@/components/ui/TableAction/TableAction";

import PositionDialog from "./PositionDialog";

import type { Position } from "../services/positions.service";
import { usePositions } from "../hooks/usePositions";

export default function PositionsTab() {
  const { user } = useAuth();
  const snackbar = useSnackbar();

  const {
    positions,
    loading,
    error,

    addPosition,
    editPosition,

    activate,
    deactivate,

    remove,
    restore,
    hardDelete,
  } = usePositions(user?.workspace_id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (values: { title: string; description: string }) => {
    try {
      setSaving(true);

      if (editingPosition) {
        await editPosition(editingPosition.id, values.title, values.description);

        snackbar.success("Position updated successfully.");
      } else {
        await addPosition(values.title, values.description);

        snackbar.success("Position created successfully.");
      }

      setDialogOpen(false);
      setEditingPosition(null);
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to save position.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (position: Position) => {
    setPositionToDelete(position);
  };

  const handleConfirmDelete = async () => {
    if (!positionToDelete) {
      return;
    }

    try {
      setDeleting(true);

      await remove(positionToDelete.id);

      snackbar.success("Position deleted successfully.");

      setPositionToDelete(null);
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to delete position.");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPosition(null);
    setDialogOpen(true);
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingPosition(null);
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
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
            }}
          >
            Positions
          </Typography>

          <Button variant="contained" onClick={handleOpenCreate}>
            Add Position
          </Button>
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
              minWidth: 650,
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
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
              ) : positions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>No positions found.</TableCell>
                </TableRow>
              ) : (
                positions.map((position) => (
                  <TableRow key={position.id} hover>
                    <TableCell>{position.title}</TableCell>

                    <TableCell>{position.description ?? "-"}</TableCell>

                    <TableCell>
                      <Chip
                        label={position.status}
                        color={position.status === "ACTIVE" ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="right">
                      <TableAction
                        onEdit={() => handleEdit(position)}
                        onActivate={
                          position.status === "INACTIVE" ? () => activate(position.id) : undefined
                        }
                        onDeactivate={
                          position.status === "ACTIVE" ? () => deactivate(position.id) : undefined
                        }
                        onDelete={() => handleDelete(position)}
                        onRestore={() => restore(position.id)}
                        onHardDelete={() => hardDelete(position.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      <PositionDialog
        open={dialogOpen}
        loading={saving}
        position={editingPosition}
        onClose={handleCloseDialog}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(positionToDelete)}
        title="Delete Position"
        message={`Are you sure you want to delete "${positionToDelete?.title}"?`}
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setPositionToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
