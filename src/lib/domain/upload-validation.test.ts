import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, validateUpload } from "./upload-validation";

const MB = 1024 * 1024;

describe("validateUpload", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])(
    "accepts %s",
    (contentType) => {
      expect(validateUpload({ contentType, size: 2 * MB })).toEqual({
        ok: true,
      });
    },
  );

  it("allows files exactly 10 MB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(10 * MB);
    expect(validateUpload({ contentType: "image/png", size: 10 * MB }).ok).toBe(
      true,
    );
  });

  it("rejects files over 10 MB with a clear error", () => {
    expect(
      validateUpload({ contentType: "image/png", size: 10 * MB + 1 }),
    ).toEqual({
      ok: false,
      code: "file_too_large",
      message: "Photos must be 10 MB or smaller.",
    });
  });

  it.each(["image/gif", "image/heic", "application/pdf", ""])(
    "rejects type %j",
    (contentType) => {
      expect(validateUpload({ contentType, size: MB })).toEqual({
        ok: false,
        code: "unsupported_type",
        message: "Please upload a JPEG, PNG, or WebP photo.",
      });
    },
  );

  it("rejects empty files", () => {
    expect(
      validateUpload({ contentType: "image/jpeg", size: 0 }),
    ).toMatchObject({
      ok: false,
      code: "empty_file",
    });
  });
});
