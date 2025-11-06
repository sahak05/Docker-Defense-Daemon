// src/utils/apiClient.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { toast } from "sonner";
import { apiFetch } from "./apiClient";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("apiFetch with successful response", () => {
    it("should return parsed JSON when response is ok", async () => {
      const mockData = { id: 1, name: "test" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiFetch("/test");

      expect(result).toEqual(mockData);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe("apiFetch with HTTP errors", () => {
    it("should show error toast on 404 response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: async () => "Resource not found",
      });

      try {
        await apiFetch("/missing");
      } catch (error) {
        expect(error).toBeDefined();
      }

      expect(toast.error).toHaveBeenCalledWith("Error 404: Resource not found");
    });

    it("should show error toast on 500 response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Something went wrong on the server",
      });

      try {
        await apiFetch("/error");
      } catch (error) {
        expect(error).toBeDefined();
      }

      expect(toast.error).toHaveBeenCalledWith(
        "Error 500: Something went wrong on the server"
      );
    });

    it("should use statusText when error message is empty", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        text: async () => "",
      });

      try {
        await apiFetch("/unavailable");
      } catch (error) {
        expect(error).toBeDefined();
      }

      expect(toast.error).toHaveBeenCalledWith(
        "Error 503: Service Unavailable"
      );
    });
  });

  describe("apiFetch with network errors", () => {
    it("should show network error toast on TypeError (connection failed)", async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new TypeError("Failed to fetch")
      );

      try {
        await apiFetch("/test");
      } catch (error) {
        expect(error).toBeDefined();
      }

      expect(toast.error).toHaveBeenCalledWith(
        "Network error — please check your connection and try again."
      );
    });

    it("should show generic error toast on unexpected error", async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error("Unexpected error")
      );

      try {
        await apiFetch("/test");
      } catch (error) {
        expect(error).toBeDefined();
      }

      expect(toast.error).toHaveBeenCalledWith(
        "An unexpected error occurred. Please try again."
      );
    });
  });

  describe("apiFetch with various HTTP statuses", () => {
    const testCases = [
      { status: 400, statusText: "Bad Request" },
      { status: 401, statusText: "Unauthorized" },
      { status: 403, statusText: "Forbidden" },
      { status: 502, statusText: "Bad Gateway" },
      { status: 504, statusText: "Gateway Timeout" },
    ];

    testCases.forEach(({ status, statusText }) => {
      it(`should handle ${status} ${statusText} response`, async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status,
          statusText,
          text: async () => `Error message for ${status}`,
        });

        try {
          await apiFetch("/test");
        } catch (error) {
          expect(error).toBeDefined();
        }

        expect(toast.error).toHaveBeenCalledWith(
          `Error ${status}: Error message for ${status}`
        );
      });
    });
  });

  describe("error logging", () => {
    it("should still log errors to console", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (global.fetch as any).mockRejectedValueOnce(
        new TypeError("Network error")
      );

      try {
        await apiFetch("/test");
      } catch (error) {
        expect(error).toBeDefined();
      }

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
