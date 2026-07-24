import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

type Props = {
  open: boolean;

  title: string;
  message: string;

  loading?: boolean;

  confirmLabel?: string;

  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  loading = false,
  confirmLabel = "Delete",
  onClose,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose}>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>{message}</DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>

        <Button color="error" variant="contained" disabled={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
