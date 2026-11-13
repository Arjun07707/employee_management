import { describe, expect, it } from "vitest";

import { escapeRegex } from "@/server/security/escape-regex";

describe("escapeRegex", () => {
  it("escapes every regex meta character", () => {
    expect(escapeRegex("a.b*c+d?e^f$g(h)i[j]k{l}m|n\\o")).toBe(
      "a\\.b\\*c\\+d\\?e\\^f\\$g\\(h\\)i\\[j\\]k\\{l\\}m\\|n\\\\o",
    );
  });

  it("makes a user-supplied expression literal", () => {
    const expression = new RegExp(escapeRegex("priya.*"), "i");
    expect(expression.test("priya.*")).toBe(true);
    expect(expression.test("priya sharma")).toBe(false);
  });
});
