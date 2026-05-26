const COOKIE_NAME = "multica_logged_in";
const SHULEX_COOKIE_DOMAIN = ".shulex.com";

export function setLoggedInCookie() {
  const domain = loggedInCookieDomainAttribute(window.location.hostname);
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=31536000; samesite=lax${domain ? `; ${domain}` : ""}`;
}

export function clearLoggedInCookie() {
  const domain = loggedInCookieDomainAttribute(window.location.hostname);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0${domain ? `; ${domain}` : ""}`;
}

export function loggedInCookieDomainAttribute(hostname: string) {
  const normalized = hostname.trim().toLowerCase().replace(/^\./, "");
  if (normalized === "shulex.com" || normalized.endsWith(".shulex.com")) {
    return `domain=${SHULEX_COOKIE_DOMAIN}`;
  }
  return "";
}
