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
        width: {
          xs: "100%",
          sm: 340,
        },
        maxWidth: 340,
        height: 40,
        minHeight: 40,
        mx: "auto",
        display: "flex",
        borderRadius: "4px", // Matches Google rectangular more closely
        textTransform: "none",
        fontWeight: 500,
        padding: "0 16px",
        ...sx,
      }}
      {...props}
    >
      {loading ? <CircularProgress size={20} color="inherit" /> : children}
    </MuiButton>
  );
}
