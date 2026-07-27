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

import PositionDialog from "./PositionDialog";

import type { Position } from "../services/positions.service";
import { usePositions } from "../hooks/usePositions";

export default function PositionsTab() {
  const snackbar = useSnackbar();

  const {
    positions,
    loading,
    error,

    includeInactive,
    includeDeleted,

    setIncludeInactive,
    setIncludeDeleted,

    createPosition,
    updatePosition,

    activatePosition,
    deactivatePosition,

    deletePosition,
    restorePosition,
    hardDeletePosition,
  } = usePositions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);

  const [positionToHardDelete, setPositionToHardDelete] = useState<Position | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (values: { title: string; description?: string }) => {
    try {
      setSaving(true);

      if (editingPosition) {
        await updatePosition({
          id: editingPosition.id,
          ...values,
        });

        snackbar.success("Position updated successfully.");
      } else {
        await createPosition(values);

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

  const handleConfirmDelete = async () => {
    if (!positionToDelete) return;

    try {
      setDeleting(true);

      await deletePosition(positionToDelete.id);

      snackbar.success("Position deleted.");

      setPositionToDelete(null);
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to delete position.");
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmHardDelete = async () => {
    if (!positionToHardDelete) return;

    try {
      setDeleting(true);

      await hardDeletePosition(positionToHardDelete.id);

      snackbar.success("Position permanently deleted.");

      setPositionToHardDelete(null);
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to permanently delete position.");
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
            Positions
          </Typography>

          <Button
            variant="contained"
            onClick={() => {
              setEditingPosition(null);
              setDialogOpen(true);
            }}
          >
            Add Position
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

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 650 }}>
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
                positions.map((position) => {
                  const deleted = Boolean(position.deleted_at);

                  return (
                    <TableRow key={position.id} hover>
                      <TableCell>{position.title}</TableCell>

                      <TableCell>{position.description ?? "-"}</TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={deleted ? "DELETED" : position.status}
                          color={
                            deleted ? "error" : position.status === "ACTIVE" ? "success" : "default"
                          }
                        />
                      </TableCell>

                      <TableCell align="right">
                        <TableAction
                          onEdit={
                            deleted
                              ? undefined
                              : () => {
                                  setEditingPosition(position);
                                  setDialogOpen(true);
                                }
                          }
                          onActivate={
                            !deleted && position.status === "INACTIVE"
                              ? () => void activatePosition(position.id)
                              : undefined
                          }
                          onDeactivate={
                            !deleted && position.status === "ACTIVE"
                              ? () => void deactivatePosition(position.id)
                              : undefined
                          }
                          onDelete={!deleted ? () => setPositionToDelete(position) : undefined}
                          onRestore={deleted ? () => void restorePosition(position.id) : undefined}
                          onHardDelete={
                            deleted ? () => setPositionToHardDelete(position) : undefined
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

      <PositionDialog
        open={dialogOpen}
        loading={saving}
        position={editingPosition}
        onClose={() => {
          if (!saving) {
            setDialogOpen(false);
            setEditingPosition(null);
          }
        }}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(positionToDelete)}
        title="Delete Position"
        message={`Delete "${positionToDelete?.title}"?`}
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setPositionToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        open={Boolean(positionToHardDelete)}
        title="Permanently Delete Position"
        message={`Permanently delete "${positionToHardDelete?.title}"? This cannot be undone.`}
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setPositionToHardDelete(null);
          }
        }}
        onConfirm={handleConfirmHardDelete}
      />
    </>
  );
}
