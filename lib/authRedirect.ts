const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export function getAuthCallbackUrl(nextPath: string) {
  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//")
    ? nextPath
    : "/";
  const origin = configuredSiteUrl || window.location.origin;

  window.sessionStorage.setItem("alliance_auth_next", safeNext);
  return `${origin}/auth/callback`;
}
