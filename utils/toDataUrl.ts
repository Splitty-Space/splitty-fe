const DEFAULT_IMAGE_TYPE = "image/jpeg";
// btoa takes a string, and String.fromCharCode cannot spread a large buffer at once.
const CHUNK_SIZE = 0x8000;

// Turns response bytes into a `data:` URL an <img> can show. Unlike an object URL it needs no
// revoking, so it can live in the request cache and be read during render.
export const toDataUrl = (buffer: ArrayBuffer, contentType?: string | null): string => {
    const bytes = new Uint8Array(buffer);
    if (bytes.length === 0) return "";
    let binary = "";
    for (let start = 0; start < bytes.length; start += CHUNK_SIZE) {
        binary += String.fromCharCode(...bytes.subarray(start, start + CHUNK_SIZE));
    }
    return `data:${contentType || DEFAULT_IMAGE_TYPE};base64,${btoa(binary)}`;
};
