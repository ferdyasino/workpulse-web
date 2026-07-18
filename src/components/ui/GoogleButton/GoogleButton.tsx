import type { CredentialResponse, GoogleLoginProps } from "@react-oauth/google";

import { Box } from "@mui/material";
import { GoogleLogin } from "@react-oauth/google";

export interface GoogleButtonProps {
  width?: number;
  fullWidth?: boolean;
  onSuccess: (credentialResponse: CredentialResponse) => void;
  onError?: GoogleLoginProps["onError"];
}

export default function GoogleButton({
  width = 320,
  fullWidth = true,
  onSuccess,
  onError,
}: GoogleButtonProps) {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          "& > div": {
            transform: "scale(1.08)",
            transformOrigin: "center",
          },
        }}
      >
        <GoogleLogin
          width={fullWidth ? `${width}` : undefined}
          size="large"
          shape="pill"
          theme="filled_black"
          text="continue_with"
          logo_alignment="left"
          onSuccess={onSuccess}
          onError={onError}
        />
      </Box>
    </Box>
  );
}
