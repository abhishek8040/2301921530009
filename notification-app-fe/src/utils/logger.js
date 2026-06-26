import { Log } from "../../../logging-middleware/logger.js";

function getLoggingToken() {
  try {
    return (
      import.meta.env.VITE_LOGGING_TOKEN ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("token") ||
      ""
    );
  } catch {
    return import.meta.env.VITE_LOGGING_TOKEN || "";
  }
}

export async function logEvent(message, level = "info") {
  const token = getLoggingToken();

  if (!token) {
    return null;
  }

  try {
    return await Log("frontend", level, "notification-app-fe", message, token);
  } catch {
    return null;
  }
}