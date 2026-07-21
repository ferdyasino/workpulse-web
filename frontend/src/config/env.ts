function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const env = {
  googleClientId: required(import.meta.env.VITE_GOOGLE_CLIENT_ID, "VITE_GOOGLE_CLIENT_ID"),

  supabaseUrl: required(import.meta.env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL"),

  supabaseAnonKey: required(import.meta.env.VITE_SUPABASE_ANON_KEY, "VITE_SUPABASE_ANON_KEY"),
};
