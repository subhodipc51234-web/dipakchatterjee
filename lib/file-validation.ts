// lib/file-validation.ts
//
// A browser File's `.type` is just whatever Content-Type the client
// declared — trivially spoofable (a raw HTTP client, or a browser via
// devtools, can attach any file with any claimed MIME type). This
// inspects the actual leading bytes ("magic bytes") to determine what a
// file really is, independent of its declared type or extension.

export type SniffedKind = "image" | "video" | null;

async function readHead(file: File, length: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, length).arrayBuffer());
}

function matches(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, i) => bytes[offset + i] === byte);
}

export async function sniffMediaKind(file: File): Promise<SniffedKind> {
  const head = await readHead(file, 32);

  // Images
  if (matches(head, [0xff, 0xd8, 0xff])) return "image"; // JPEG
  if (matches(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image"; // PNG
  if (matches(head, [0x47, 0x49, 0x46, 0x38])) return "image"; // GIF87a / GIF89a
  if (matches(head, [0x52, 0x49, 0x46, 0x46]) && matches(head, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "image"; // WebP (RIFF....WEBP)
  }

  // Videos
  if (matches(head, [0x66, 0x74, 0x79, 0x70], 4)) return "video"; // MP4/MOV family (ftyp box)
  if (matches(head, [0x1a, 0x45, 0xdf, 0xa3])) return "video"; // WebM/MKV (EBML header)
  if (matches(head, [0x52, 0x49, 0x46, 0x46]) && matches(head, [0x41, 0x56, 0x49, 0x20], 8)) {
    return "video"; // AVI (RIFF....AVI )
  }

  return null;
}
