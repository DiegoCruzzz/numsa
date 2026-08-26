import axios from "axios";

/**
 * Extrae el mensaje de error real que manda el backend (campo `detail`),
 * en vez de mostrar siempre un texto genérico sin contexto.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((d) => (d && typeof d.msg === "string" ? d.msg : null))
        .filter((m): m is string => Boolean(m));
      if (messages.length > 0) return messages.join(" ");
    }
  }
  return fallback;
}
