function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const env = {
  googleClientId: required(import.meta.env.VITE_GOOGLE_CLIENT_ID, "VITE_GOOGLE_CLIENT_ID"),

  apiUrl: required(import.meta.env.VITE_API_URL, "VITE_API_URL"),
};
