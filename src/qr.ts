// DesaAI — QR helpers built on the vendored qrcode-generator (MIT, see
// src/qrcode.ts). Everything is generated locally in the browser — the
// survey QR works fully offline, no CDN or network call.
import qrcodeDefault from "./qrcode";

// The vendored file is @ts-nocheck, so its export infers as {} —
// give the factory an explicit interface here instead.
type QrFactory = (
  typeNumber: number,
  errorCorrectionLevel: "L" | "M" | "Q" | "H",
) => {
  addData: (data: string) => void;
  make: () => void;
  createSvgTag: (opts: Record<string, unknown>) => string;
  createDataURL: (cellSize: number, margin: number) => string;
  getModuleCount: () => number;
};

const qrcode = qrcodeDefault as unknown as QrFactory;

export interface QrCode {
  /** SVG markup (scalable, white background, black modules). */
  svg: string;
  /** PNG data URL at the requested module size (for the download button). */
  dataUrl: (cellSize?: number) => string;
  moduleCount: number;
}

/** Build a QR code for `text`, or null when it cannot be encoded. */
export function makeQr(text: string): QrCode | null {
  try {
    // typeNumber 0 = auto-detect the smallest version that fits.
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return {
      svg: qr.createSvgTag({
        cellSize: 6,
        margin: 24,
        scalable: true,
      }),
      dataUrl: (cellSize = 8) => qr.createDataURL(cellSize, cellSize * 4),
      moduleCount: qr.getModuleCount(),
    };
  } catch {
    return null;
  }
}
