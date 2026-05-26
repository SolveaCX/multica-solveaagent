import { describe, expect, it } from "vitest";

import { loggedInCookieDomainAttribute } from "./auth-cookie";

describe("loggedInCookieDomainAttribute", () => {
  it("uses the shared Shulex cookie domain on Shulex subdomains", () => {
    expect(loggedInCookieDomainAttribute("multica-ai.shulex.com")).toBe(
      "domain=.shulex.com",
    );
  });

  it("keeps non-Shulex hosts host-only", () => {
    expect(loggedInCookieDomainAttribute("localhost")).toBe("");
    expect(loggedInCookieDomainAttribute("app.example.com")).toBe("");
  });
});
