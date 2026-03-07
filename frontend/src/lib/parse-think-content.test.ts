import { describe, expect, it } from "vitest";
import { parseThinkContent } from "./parse-think-content";

describe("parseThinkContent", () => {
  it("returns null thinkContent when no think tag", () => {
    const content = "Hello, this is a normal message.";
    const result = parseThinkContent(content);
    expect(result.thinkContent).toBeNull();
    expect(result.visibleContent).toBe(content);
  });

  it("extracts think content and removes it from visible", () => {
    const content = `<think>用户问的是薪资问题，文档中没有相关信息。</think>

直接结论：无法确定。`;
    const result = parseThinkContent(content);
    expect(result.thinkContent).toBe(
      "用户问的是薪资问题，文档中没有相关信息。",
    );
    expect(result.visibleContent).toContain("直接结论：无法确定。");
    expect(result.visibleContent).not.toContain("<think>");
  });

  it("handles multiple think blocks", () => {
    const content = `<think>first thought</think>
visible1
<think>second thought</think>
visible2`;
    const result = parseThinkContent(content);
    expect(result.thinkContent).toBe("first thought\n\nsecond thought");
    expect(result.visibleContent).toContain("visible1");
    expect(result.visibleContent).toContain("visible2");
  });

  it("handles think-only content", () => {
    const content = "<think>only thinking</think>";
    const result = parseThinkContent(content);
    expect(result.thinkContent).toBe("only thinking");
    expect(result.visibleContent).toBe("");
  });

  it("is case-insensitive for think tag", () => {
    const content = "<think>case test</think>";
    const result = parseThinkContent(content);
    expect(result.thinkContent).toBe("case test");
  });
});
