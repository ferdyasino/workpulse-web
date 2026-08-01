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
        height: 42,
        display: "flex",
        overflow: "hidden",
        borderRadius: "4px",

        "& > div": {
          width: "100% !important",
        },

        "& iframe": {
          width: "100% !important",
          height: "42px !important",
        },
      }}
    >
      <GoogleLogin
        width="100%"
        size="large"
        theme="filled_black"
        text="continue_with"
        logo_alignment="left"
        shape="rectangular"
        onSuccess={onSuccess}
        onError={onError}
      />
    </Box>
  );
}
