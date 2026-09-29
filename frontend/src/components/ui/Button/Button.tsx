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
        width: "100%",
        minWidth: 0,
        maxWidth: 320,

        height: 40,
        minHeight: 40,

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        borderRadius: "4px",
        textTransform: "none",
        fontWeight: 500,

        px: 2,
        boxSizing: "border-box",

        mx: "auto",

        ...sx,
      }}
      {...props}
    >
      {loading ? <CircularProgress size={20} color="inherit" /> : children}
    </MuiButton>
  );
}
