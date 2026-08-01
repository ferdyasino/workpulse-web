import { Button as MuiButton, CircularProgress } from "@mui/material";
import type { ButtonProps } from "@mui/material";

export interface AppButtonProps extends ButtonProps {
  loading?: boolean;
}

export default function Button({
  loading = false,
  children,
  disabled,
  sx,
  ...props
}: AppButtonProps) {
  return (
    <MuiButton
      disableElevation
      disabled={disabled || loading}
      sx={{
        height: 42,
        borderRadius: "4px",
        textTransform: "none",
        fontWeight: 500,
        ...sx,
      }}
      {...props}
    >
      {loading ? <CircularProgress size={20} color="inherit" /> : children}
    </MuiButton>
  );
}
