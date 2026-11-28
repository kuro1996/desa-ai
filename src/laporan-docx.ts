// DesaAI — Laporan Bulanan Otomatis (Paket 45): ekspor .docx ASLI.
// Uses the `docx` library (pure JS, works fully offline in the browser).
// The file is a genuine OOXML .docx (ZIP + word/document.xml), NOT a
// renamed HTML/CSV file — the old kepegawaian "Export Word" button used
// to download CSV; both it and this report now produce real .docx.
// Kop Surat comes from the officer's letterhead settings; the app never
// invents a Camat name or NIP — an empty field prints "—".
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { LetterheadSettings } from "./letterhead";
import { letterheadContactLine } from "./letterhead";

export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface LaporanAgendaRow {
  nomorAgenda: string;
  perihal: string;
  pihak: string;
  tanggalLabel: string;
  arahLabel: string;
  statusLabel: string;
}

export interface LaporanBulananDocxInput {
  monthLabel: string; // e.g. "November 2026"
  generatedLabel: string; // e.g. "28 November 2026"
  letters: number;
  agsMasuk: number;
  agsKeluar: number;
  agsBaru: number;
  agsDiproses: number;
  agsSelesai: number;
  ikmCount: number;
  ikmScore: number; // 25-100 (0 when no responses)
  ikmCat: string; // "A".."D" ("" when no responses)
  ikmCatLabel: string; // e.g. "Sangat Baik"
  ikmPerElement: number[]; // 9 means, 1-4 (0 when no responses)
  ikmElementLabels: string[]; // 9 labels
  aduTotal: number;
  aduBaru: number;
  aduDiproses: number;
  aduSelesai: number;
  kegTotal: number;
  kegAktif: number;
  kegAkan: number;
  kegHabis: number;
  agendaList: LaporanAgendaRow[];
  attention: string[]; // "Perlu perhatian" lines (plain text)
  hasData: boolean;
  letterhead: LetterheadSettings;
}

const thin = {
  style: BorderStyle.SINGLE,
  size: 4,
  space: 0,
  color: "999999",
};

function tableBorders() {
  return {
    top: thin,
    left: thin,
    bottom: thin,
    right: thin,
    insideHorizontal: thin,
    insideVertical: thin,
  };
}

function run(
  text: string,
  opts: { bold?: boolean; size?: number; italic?: boolean } = {},
): TextRun {
  return new TextRun({
    text,
    bold: opts.bold,
    italics: opts.italic,
    size: opts.size ?? 22, // half-points: 22 = 11pt
  });
}

function para(
  text: string,
  opts: {
    bold?: boolean;
    size?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spaceAfter?: number;
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
  } = {},
): Paragraph {
  return new Paragraph({
    children: [run(text, { bold: opts.bold, size: opts.size })],
    alignment: opts.align,
    spacing: { after: opts.spaceAfter ?? 120 },
    heading: opts.heading,
  });
}

/** Kop surat resmi dari pengaturan petugas (nama/NIP kosong = "—"). */
function kopParagraphs(lh: LetterheadSettings): Paragraph[] {
  const out: Paragraph[] = [
    new Paragraph({
      children: [run(lh.instansi1 || "—", { bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
    }),
    new Paragraph({
      children: [run(lh.instansi2 || "—", { bold: true, size: 26 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
  ];
  const contact = letterheadContactLine(lh);
  if (contact) {
    out.push(
      new Paragraph({
        children: [run(contact, { size: 20 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
    );
  }
  // Garis pemisah kop (seperti lembar resmi).
  out.push(
    new Paragraph({
      children: [run("")],
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, space: 1, color: "1f4e79" } },
      spacing: { after: 240 },
    }),
  );
  return out;
}

function kvTable(rows: Array<[string, string]>): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders(),
    rows: rows.map(
      ([k, v]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [para(k, { bold: true, spaceAfter: 40 })],
            }),
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [para(v, { spaceAfter: 40 })],
            }),
          ],
        }),
    ),
  });
}

function dataTable(headers: string[], rows: string[][]): Table {
  const widths = headers.map(() => Math.floor(100 / headers.length));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(
          (h, i) =>
            new TableCell({
              width: { size: widths[i], type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              shading: { type: "clear", fill: "DCE6F1" },
              children: [para(h, { bold: true, spaceAfter: 40 })],
            }),
        ),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map(
              (c, i) =>
                new TableCell({
                  width: { size: widths[i], type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [para(c, { spaceAfter: 40 })],
                }),
            ),
          }),
      ),
    ],
  });
}

function section(title: string): Paragraph {
  return para(title, { bold: true, size: 24, spaceAfter: 120 });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [run(text)],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

function signatureBlock(
  lh: LetterheadSettings,
  generatedLabel: string,
): Table {
  const camatNama = lh.camatNama.trim() || "—";
  const camatNip = lh.camatNip.trim() || "—";
  const sekNama = lh.sekretarisNama.trim() || "—";
  const cell = (lines: string[]): TableCell =>
    new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: {
        top: thin,
        left: { style: BorderStyle.NONE, size: 0, space: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, space: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, space: 0, color: "FFFFFF" },
      },
      children: lines.map((l) => para(l, { spaceAfter: 40 })),
    });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: thin,
      left: { style: BorderStyle.NONE, size: 0, space: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, space: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, space: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, space: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, space: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          cell(["Mengetahui,", "Camat Simpangkatis", "", "", camatNama, `NIP ${camatNip}`]),
          cell([`Simpangkatis, ${generatedLabel}`, "Sekretaris", "", "", sekNama, ""]),
        ],
      }),
    ],
  });
}

/** Build the monthly report as a real .docx Blob. All numbers come from
 * the caller (local app data only); nothing is invented here. */
export async function buildMonthlyReportDocx(
  input: LaporanBulananDocxInput,
): Promise<Blob> {
  const lh = input.letterhead;
  const children: Array<Paragraph | Table> = [
    ...kopParagraphs(lh),
    para(`Laporan Bulanan — ${input.monthLabel}`, {
      heading: HeadingLevel.TITLE,
      align: AlignmentType.CENTER,
      spaceAfter: 60,
    }),
    para(`Kecamatan Simpangkatis — dibuat ${input.generatedLabel}`, {
      align: AlignmentType.CENTER,
      size: 20,
      spaceAfter: 240,
    }),
  ];
  if (!input.hasData) {
    children.push(
      para("Belum ada data bulan ini.", { bold: true, spaceAfter: 120 }),
      para(
        "Belum ada surat, jawaban survei, pengaduan, atau agenda yang tercatat pada bulan ini. Angka akan muncul setelah ada data yang tercatat di aplikasi.",
        { spaceAfter: 240 },
      ),
    );
  } else {
    children.push(
      section("A. Surat dan Agenda"),
      kvTable([
        ["Surat tersimpan", String(input.letters)],
        ["Agenda surat masuk", String(input.agsMasuk)],
        ["Agenda surat keluar", String(input.agsKeluar)],
        ["Agenda berstatus Baru", String(input.agsBaru)],
        ["Agenda berstatus Diproses", String(input.agsDiproses)],
        ["Agenda berstatus Selesai", String(input.agsSelesai)],
      ]),
      para("", { spaceAfter: 120 }),
    );
    if (input.agendaList.length > 0) {
      children.push(
        para("Daftar agenda bulan ini:", { bold: true, spaceAfter: 120 }),
        dataTable(
          ["No. Agenda", "Perihal", "Pihak", "Tanggal", "Arah", "Status"],
          input.agendaList.map((e) => [
            e.nomorAgenda,
            e.perihal,
            e.pihak,
            e.tanggalLabel,
            e.arahLabel,
            e.statusLabel,
          ]),
        ),
        para("", { spaceAfter: 120 }),
      );
    }
    children.push(section("B. Indeks Kepuasan Masyarakat (IKM)"));
    if (input.ikmCount === 0) {
      children.push(para("Belum ada jawaban survei bulan ini.", { spaceAfter: 240 }));
    } else {
      children.push(
        kvTable([
          ["Skor IKM", `${input.ikmScore.toFixed(2).replace(".", ",")} (Kategori ${input.ikmCat} — ${input.ikmCatLabel})`],
          ["Responden", String(input.ikmCount)],
        ]),
        para("", { spaceAfter: 120 }),
        para("Rata-rata per unsur (skala 1–4):", { bold: true, spaceAfter: 120 }),
        dataTable(
          ["Unsur", "Rata-rata"],
          input.ikmElementLabels.map((label, i) => [
            label,
            input.ikmPerElement[i].toFixed(2).replace(".", ","),
          ]),
        ),
        para("", { spaceAfter: 120 }),
      );
    }
    children.push(
      section("C. Pengaduan"),
      kvTable([
        ["Total pengaduan", String(input.aduTotal)],
        ["Berstatus Baru", String(input.aduBaru)],
        ["Berstatus Diproses", String(input.aduDiproses)],
        ["Berstatus Selesai", String(input.aduSelesai)],
      ]),
      para("", { spaceAfter: 120 }),
      section("D. Kepegawaian (posisi saat laporan dibuat)"),
      kvTable([
        ["Total pegawai", String(input.kegTotal)],
        ["Aktif", String(input.kegAktif)],
        ["Akan habis masa bhakti", String(input.kegAkan)],
        ["Masa bhakti habis", String(input.kegHabis)],
      ]),
      para("", { spaceAfter: 120 }),
      section("E. Perlu perhatian"),
    );
    if (input.attention.length === 0) {
      children.push(para("Tidak ada.", { spaceAfter: 240 }));
    } else {
      for (const line of input.attention) children.push(bullet(line));
      children.push(para("", { spaceAfter: 120 }));
    }
  }
  children.push(signatureBlock(lh, input.generatedLabel));
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
    },
    sections: [{ children }],
  });
  return Packer.toBlob(doc);
}

/** Build the personnel table as a real .docx Blob (Paket 45 — this is
 * what the kepegawaian "Export Word" button now downloads; it used to
 * download CSV, which was the known honesty gap). */
export async function buildKegDocx(
  headRow: string[],
  rows: string[][],
  title: string,
  generatedLabel: string,
  letterhead: LetterheadSettings,
): Promise<Blob> {
  const children: Array<Paragraph | Table> = [
    ...kopParagraphs(letterhead),
    para(title, {
      heading: HeadingLevel.TITLE,
      align: AlignmentType.CENTER,
      spaceAfter: 60,
    }),
    para(`Dibuat ${generatedLabel}`, {
      align: AlignmentType.CENTER,
      size: 20,
      spaceAfter: 240,
    }),
  ];
  if (rows.length === 0) {
    children.push(para("Belum ada data.", { spaceAfter: 240 }));
  } else {
    children.push(dataTable(headRow, rows));
  }
  children.push(para("", { spaceAfter: 240 }));
  children.push(signatureBlock(letterhead, generatedLabel));
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
    },
    sections: [{ children }],
  });
  return Packer.toBlob(doc);
}
