import type { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { env } from "@/config/env";

type Props = {
  children: ReactNode;
};

export default function GoogleProvider({ children }: Props) {
  return <GoogleOAuthProvider clientId={env.googleClientId}>{children}</GoogleOAuthProvider>;
}
