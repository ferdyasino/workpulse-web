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
        minWidth: 0,

        mx: "auto",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        boxSizing: "border-box",

        "& > div": {
          width: "100% !important",
          maxWidth: "320px !important",

          display: "flex !important",
          alignItems: "center",
          justifyContent: "center",
        },

        "& iframe": {
          width: "100% !important",
          maxWidth: "320px !important",

          display: "block",
        },

        "@media (max-width: 360px)": {
          "& > div": {
            transform: "scale(0.9)",
            transformOrigin: "center",
          },
        },

        "@media (max-width: 340px)": {
          "& > div": {
            transform: "scale(0.85)",
            transformOrigin: "center",
          },
        },

        "@media (max-width: 320px)": {
          "& > div": {
            transform: "scale(0.8)",
            transformOrigin: "center",
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
