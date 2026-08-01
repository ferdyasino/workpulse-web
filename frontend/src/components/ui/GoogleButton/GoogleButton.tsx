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
          sm: 340,
        },
        maxWidth: 340,
        mx: "auto",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",

        "& > div": {
          width: "100% !important",
          display: "flex",
          justifyContent: "center",
        },

        "& iframe": {
          width: "100% !important",
          minWidth: "100% !important",
        },
      }}
    >
      <GoogleLogin
        width="340"
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
