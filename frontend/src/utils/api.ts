import { supabase } from "@/lib/supabase";

export async function invokeFunction<TResponse, TBody extends object | undefined = undefined>(
  name: string,
  body?: TBody,
): Promise<TResponse> {
  const { data, error } = await supabase.functions.invoke(name, {
    body,
  });

  if (error) {
    throw error;
  }

  return data as TResponse;
}
