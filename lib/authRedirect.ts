const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export function getAuthCallbackUrl(nextPath: string) {
  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//")
    ? nextPath
    : "/";
  const origin = configuredSiteUrl || window.location.origin;

  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
