// src/utils/apiClient.ts
import { toast } from "sonner";

const BASE_URL = "http://localhost:8080/api";

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!response.ok) {
      const message = await response.text();
      const errorMsg = `Error ${response.status}: ${
        message || response.statusText
      }`;
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    // Handle network errors separately from API errors
    if (error instanceof TypeError) {
      toast.error(
        "Network error — please check your connection and try again."
      );
    } else if (!error.message.startsWith("Error")) {
      // Unexpected error (not our API error)
      toast.error("An unexpected error occurred. Please try again.");
    }
    // API errors already toasted above, don't double-toast
    console.error("API fetch failed:", error);
    throw error;
  }
}
