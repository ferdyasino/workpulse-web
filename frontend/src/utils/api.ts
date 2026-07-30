import { supabase } from "@/lib/supabase";

export async function invokeFunction<TResponse, TBody extends object = object>(
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

        if (response?.message) {
          throw new Error(response.message);
        }

        throw new Error("Edge function request failed.");
      } catch (err) {
        if (err instanceof Error) {
          throw err;
        }
      }
    }

    throw error;
  }

  return data as TResponse;
}

export async function apiRequest<TResponse = unknown, TBody extends object = object>(
  body: TBody,
): Promise<TResponse> {
  return invokeFunction<TResponse, TBody>("api", body);
}
