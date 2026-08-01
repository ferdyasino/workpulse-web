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
        height: 40,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        boxSizing: "border-box",

        "& > div": {
          width: "100% !important",
          display: "flex",
          justifyContent: "center",
        },

        "& iframe": {
          maxWidth: "100%",
        },

        "@media (max-width:360px)": {
          "& > div": {
            transform: "scale(0.9)",
            transformOrigin: "center",
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
