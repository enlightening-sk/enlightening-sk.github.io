export async function verifyTurnstile(
  token: unknown,
  ip: string,
  secret: string,
): Promise<boolean> {
  if (!secret) return false;
  if (typeof token !== "string" || token.length < 1 || token.length > 2048) return false;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip !== "unknown") body.set("remoteip", ip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return false;
    const json = (await response.json()) as { success?: boolean };
    return json.success === true;
  } catch (error) {
    console.error("turnstile verify failed", error instanceof Error ? error.message : error);
    return false;
  }
}
