import type { CredentialResponse, GoogleLoginProps } from "@react-oauth/google";

import { Box } from "@mui/material";
import { GoogleLogin } from "@react-oauth/google";

export interface GoogleButtonProps {
  onSuccess: (credentialResponse: CredentialResponse) => void;
  onError?: GoogleLoginProps["onError"];
}

export default function GoogleButton({ onSuccess, onError }: GoogleButtonProps) {
  return (
    <Box
      sx={{
        width: {
          xs: "100%",
          sm: 320,
        },
        maxWidth: 320,
        mx: "auto",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <GoogleLogin
        width="320"
        size="large"
        theme="filled_black"
        text="continue_with"
        shape="rectangular"
        logo_alignment="left"
        onSuccess={onSuccess}
        onError={onError}
      />
    </Box>
  );
}
