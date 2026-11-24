export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Shared with the Blob client-upload token route so both sides enforce the same list. */
export const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type AllowedUploadType = (typeof ALLOWED_UPLOAD_TYPES)[number];

function isAllowedType(type: string): type is AllowedUploadType {
  return (ALLOWED_UPLOAD_TYPES as readonly string[]).includes(type);
}

export type UploadCheck =
  | { ok: true }
  | {
      ok: false;
      code: "unsupported_type" | "file_too_large" | "empty_file";
      message: string;
    };

export function validateUpload(file: {
  contentType: string;
  size: number;
}): UploadCheck {
  if (!isAllowedType(file.contentType)) {
    return {
      ok: false,
      code: "unsupported_type",
      message: "Please upload a JPEG, PNG, or WebP photo.",
    };
  }
  if (file.size <= 0) {
    return { ok: false, code: "empty_file", message: "This file is empty." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      code: "file_too_large",
      message: "Photos must be 10 MB or smaller.",
    };
  }
  return { ok: true };
}
