import { describe, expect, it } from "vitest";
import { authScreenHref, readAuthScreenMode } from "@/app/lib/authLocation";

describe("authentication location", () => {
  it("uses the current path after Back/Forward, even if the mounted form started elsewhere", () => {
    expect(readAuthScreenMode("/login", new URLSearchParams(), "register")).toBe("login");
    expect(readAuthScreenMode("/register", new URLSearchParams(), "login")).toBe("register");
  });
  it.each(["verify", "reset", "forgot", "creator", "activate"] as const)("restores the %s form on reload", (mode) => {
    const href = authScreenHref(mode, "https://taletale.site/register");
    const url = new URL(href, "https://taletale.site");
    expect(readAuthScreenMode(url.pathname, url.searchParams)).toBe(mode);
  });
  it("preserves email link priorities and legacy signup/reset links", () => {
    expect(readAuthScreenMode("/login", new URLSearchParams("auth=verify&token=sample"))).toBe("verify");
    expect(readAuthScreenMode("/login", new URLSearchParams("auth=activate&token=sample"))).toBe("activate");
    expect(readAuthScreenMode("/", new URLSearchParams("auth=signup"))).toBe("register");
    expect(readAuthScreenMode("/login", new URLSearchParams("resetToken=sample"))).toBe("reset");
  });
  it("switches register/login paths without leaking email-link credentials or losing return context", () => {
    expect(authScreenHref("login", "https://taletale.site/register?auth=reset&email=sample&token=sample&resetToken=sample&storyId=47#studio")).toBe("/login?storyId=47#studio");
    expect(authScreenHref("register", "https://taletale.site/login?auth=forgot")).toBe("/register");
  });
});
