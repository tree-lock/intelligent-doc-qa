import { describe, expect, it } from "vitest";
import { isMineruSupportedFile, MINERU_REQUIRED_MESSAGE } from "./mineru";

describe("mineru", () => {
  describe("isMineruSupportedFile", () => {
    it("returns true for PDF", () => {
      expect(isMineruSupportedFile("doc.pdf")).toBe(true);
      expect(isMineruSupportedFile("DOC.PDF")).toBe(true);
    });

    it("returns true for Word", () => {
      expect(isMineruSupportedFile("report.docx")).toBe(true);
      expect(isMineruSupportedFile("old.doc")).toBe(true);
    });

    it("returns true for PPT", () => {
      expect(isMineruSupportedFile("slides.pptx")).toBe(true);
      expect(isMineruSupportedFile("slides.ppt")).toBe(true);
    });

    it("returns true for images", () => {
      expect(isMineruSupportedFile("img.png")).toBe(true);
      expect(isMineruSupportedFile("photo.jpg")).toBe(true);
      expect(isMineruSupportedFile("photo.jpeg")).toBe(true);
    });

    it("returns true for HTML", () => {
      expect(isMineruSupportedFile("page.html")).toBe(true);
    });

    it("returns false for TXT and Markdown", () => {
      expect(isMineruSupportedFile("note.txt")).toBe(false);
      expect(isMineruSupportedFile("readme.md")).toBe(false);
    });

    it("returns false for unsupported extensions", () => {
      expect(isMineruSupportedFile("data.csv")).toBe(false);
      expect(isMineruSupportedFile("archive.zip")).toBe(false);
    });

    it("returns false when filename has no extension", () => {
      expect(isMineruSupportedFile("README")).toBe(false);
    });
  });

  describe("MINERU_REQUIRED_MESSAGE", () => {
    it("is a non-empty string", () => {
      expect(typeof MINERU_REQUIRED_MESSAGE).toBe("string");
      expect(MINERU_REQUIRED_MESSAGE.length).toBeGreaterThan(0);
      expect(MINERU_REQUIRED_MESSAGE).toContain("MinerU");
    });
  });
});
