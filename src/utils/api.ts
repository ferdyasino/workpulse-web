const API_URL = import.meta.env.VITE_API_URL;

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options?.headers || {}),
    },
  });

  const text = await response.text();

  console.log("STATUS:", response.status);
  console.log("RESPONSE:", text);

  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`);
  }

  return JSON.parse(text);
}
