const getApiBaseUrl = (): string => {
  const envVal = import.meta.env.VITE_API_URL;
  if (envVal !== undefined) {
    const cleaned = envVal.replace(/^["']|["']$/g, "").trim();
    if (cleaned) {
      return cleaned;
    }
  }
  return typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
    ? "http://localhost:8000"
    : "";
};

export const API_BASE_URL = getApiBaseUrl();
