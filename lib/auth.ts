// Token de sesión derivado de la contraseña (funciona en Edge y Node)
export async function sessionToken(): Promise<string> {
  const data = new TextEncoder().encode(
    (process.env.DASHBOARD_PASSWORD ?? "") + "::alba-lez-dashboard"
  );
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const AUTH_COOKIE = "dash_auth";
