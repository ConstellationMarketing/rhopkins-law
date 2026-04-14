export function getPublicEnv(key: string): string {
  const value =
    (import.meta as { env?: Record<string, string | undefined> }).env?.[key] ??
    (typeof process !== "undefined" ? process.env?.[key] : undefined);

  return typeof value === "string" ? value : "";
}
