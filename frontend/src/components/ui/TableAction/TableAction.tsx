import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

type Props = {
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function TableAction({ onEdit, onDelete }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        justifyContent: "flex-end",
      }}
    >
      {onEdit && (
        <Button size="small" onClick={onEdit}>
          Edit
        </Button>
      )}

      {onDelete && (
        <Button size="small" color="error" onClick={onDelete}>
          Delete
        </Button>
      )}
    </Box>
  );
}
