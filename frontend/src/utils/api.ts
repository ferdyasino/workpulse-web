const API_URL = import.meta.env.VITE_API_URL;

type ApiResponse = {
  success?: boolean;
  message?: string;
};

export async function apiRequest<T>(endpoint = "", options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method ?? "POST",
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  });

  const text = await response.text();

  if (import.meta.env.DEV) {
    console.groupCollapsed(
      `[API] ${options.method ?? "POST"} ${endpoint || "/"} (${response.status})`,
    );
    console.log(text);
    console.groupEnd();
  }

  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`);
  }

  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Server returned an invalid JSON response.");
  }

  if (
    data &&
    typeof data === "object" &&
    "success" in data &&
    (data as ApiResponse).success === false
  ) {
    throw new Error((data as ApiResponse).message || "Request failed.");
  }

  return data as T;
}

export async function gasRequest<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  if (import.meta.env.DEV) {
    console.groupCollapsed(`[API REQUEST] ${action}`);
    console.log("ACTION:", action);
    console.log("PAYLOAD:", payload);
  }

  const body = new URLSearchParams();

  body.append("action", action);

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      body.append(key, "");
      return;
    }

    body.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  });

  if (import.meta.env.DEV) {
    console.log(body.toString());
    console.groupEnd();
  }

  return apiRequest<T>("", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: body.toString(),
  });
}
