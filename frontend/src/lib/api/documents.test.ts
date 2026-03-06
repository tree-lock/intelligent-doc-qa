import { afterEach, describe, expect, it } from "vitest";
import { DOCUMENTS_STORAGE_KEY } from "../documents-storage";
import { deleteDocuments, fetchDocuments, uploadDocuments } from "./documents";

describe("documents api", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("uploads txt/md and parses plainText with normalization", async () => {
    const mdFile = new File(["\uFEFF# Title\r\n\r\nBody"], "note.md", {
      type: "text/markdown",
    });
    const txtFile = new File(["line1\r\nline2"], "readme.txt", {
      type: "text/plain",
    });
    const imageFile = new File(["binary"], "image.png", { type: "image/png" });

    const uploaded = await uploadDocuments([mdFile, txtFile, imageFile]);
    expect(uploaded).toHaveLength(2);
    expect(uploaded[0]?.title).toBe(uploaded[0]?.name);
    expect(uploaded[0]?.plainText).toBe("# Title\n\nBody");
    expect(uploaded[1]?.plainText).toBe("line1\nline2");
  });

  it("deduplicates by file name and fetches from localStorage", async () => {
    await uploadDocuments([
      new File(["first"], "dup.txt", { type: "text/plain" }),
    ]);
    await uploadDocuments([
      new File(["second"], "dup.txt", { type: "text/plain" }),
    ]);

    const documents = await fetchDocuments();
    expect(documents).toHaveLength(1);
    expect(documents[0]?.plainText).toBe("first");

    const raw = window.localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    expect(raw).toContain("dup.txt");
  });

  it("deletes documents by ids", async () => {
    await uploadDocuments([
      new File(["a"], "a.txt", { type: "text/plain" }),
      new File(["b"], "b.txt", { type: "text/plain" }),
    ]);
    const before = await fetchDocuments();
    expect(before).toHaveLength(2);

    await deleteDocuments([before[0]?.id]);
    const after = await fetchDocuments();
    expect(after).toHaveLength(1);
  });
});
