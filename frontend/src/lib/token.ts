export function getToken(): string | null {
  try {
    return localStorage.getItem("devcell_auth_token");
  } catch (err) {
    return null;
  }
}
