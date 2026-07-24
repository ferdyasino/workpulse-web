import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;

  children: ReactNode;

  loading?: boolean;

  submitLabel?: string;

  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export default function FormDialog({
  open,
  title,
  children,
  loading = false,
  submitLabel = "Save",
  onClose,
  onSubmit,
}: Props) {
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    await onSubmit();
  };

  const handleDialogClose = (_event: object, reason: "backdropClick" | "escapeKeyDown") => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      return;
    }

    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>

        <DialogContent>{children}</DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button type="submit" variant="contained" disabled={loading}>
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
