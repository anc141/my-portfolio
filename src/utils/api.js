const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "");

export const apiUrl = (path) => `${API_BASE_URL}${path}`;

export const readApiError = async (response, fallbackMessage) => {
  try {
    const data = await response.json();
    return data.details || data.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};
