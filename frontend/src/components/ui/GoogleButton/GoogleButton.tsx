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
        maxWidth: 320,
        mx: "auto",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",

        "@media (max-width:360px)": {
          "& > div": {
            transform: "scale(0.9)",
            transformOrigin: "top center",
          },
        },

        "@media (max-width:340px)": {
          "& > div": {
            transform: "scale(0.85)",
          },
        },

        "@media (max-width:320px)": {
          "& > div": {
            transform: "scale(0.8)",
          },
        },
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
