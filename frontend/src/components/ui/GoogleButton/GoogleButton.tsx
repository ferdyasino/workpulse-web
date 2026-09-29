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
        width: "100%",
        maxWidth: 280,
        minWidth: 0,

        mx: "auto",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        boxSizing: "border-box",
      }}
    >
      <GoogleLogin
        width="280"
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
