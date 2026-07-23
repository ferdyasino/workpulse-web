import { supabase } from "@/lib/supabase";

export async function invokeFunction<TResponse, TBody extends object | undefined = undefined>(
  name: string,
  body?: TBody,
): Promise<TResponse> {
  const { data, error } = await supabase.functions.invoke(name, {
    body,
  });

  if (error) {
    console.error("EDGE FUNCTION ERROR:", error);

    if (error.context) {
      try {
        const response = await error.context.json();
        console.error("EDGE FUNCTION RESPONSE:", response);
      } catch {
        console.error("EDGE FUNCTION RAW:", await error.context.text());
      }
    }

    throw error;
  }

  return data as TResponse;
}

export async function apiRequest<TResponse = any, TBody extends object = object>(
  body: TBody,
): Promise<TResponse> {
  return invokeFunction<TResponse, TBody>("api", body);
}
