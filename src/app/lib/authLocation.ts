/** URL contract shared by authentication forms and browser history navigation. */
export type AuthScreenMode = "login" | "register" | "verify" | "forgot" | "reset" | "creator" | "activate";

export function readAuthScreenMode(pathname: string, params: URLSearchParams, fallback: AuthScreenMode = "login"): AuthScreenMode {
  const auth = params.get("auth");
  if (auth === "verify" || auth === "activate" || auth === "creator") return auth;
  if (params.get("token") || params.get("resetToken") || auth === "reset") return "reset";
  if (auth === "forgot") return "forgot";
  if (auth === "signup") return "register";
  if (auth === "signin") return "login";
  if (pathname === "/register") return "register";
  if (pathname === "/login") return "login";
  return fallback;
}

/** Explicit form switches discard credentials from email links, preserving return context. */
export function authScreenHref(mode: AuthScreenMode, currentHref: string): string {
  const current = new URL(currentHref, "http://localhost");
  for (const key of ["auth", "token", "resetToken", "email"]) current.searchParams.delete(key);
  current.pathname = mode === "register" ? "/register" : "/login";
  if (mode !== "login" && mode !== "register") current.searchParams.set("auth", mode);
  return `${current.pathname}${current.search}${current.hash}`;
}
