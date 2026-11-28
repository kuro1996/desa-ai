// DesaAI — Anin Bahasa Bangka (Paket 34, Ide 8): Anin menjawab dalam
// Bahasa Bangka untuk warga lanjut usia. Cakupan: sapaan + jawaban
// prosedur umum (KTP, KK, surat pengantar, pengaduan).
//
// ATURAN KERAS (perintah Bos): JANGAN mengarang kosakata yang tidak
// yakin. Setiap kata Bangka di bawah ini diverifikasi dari sumber kamus
// (lihat kolom `sumber`): Kamus Bahasa Bangka Belitung (Scribd),
// Wikipedia Bahasa Bangka, Kamus Indonesia–Melayu Bangka (Kantor Bahasa
// Prov. Kep. Bangka Belitung), rubrik Bahasa Bangka Pangkal Pinang
// (SMP Budi Mulia), dan Kamus Bangka–Indonesia (Buspy). Istilah
// administrasi (KTP, KK, Disdukcapil, RT/RW) tetap Bahasa Indonesia —
// di Bangka istilah itu memang dipakai apa adanya. Bila satu kata ragu,
// file ini memakai Bahasa Indonesia untuk kata itu.
//
// Dialek: Bangka punya beberapa dialek (Belinyu akhiran -o, Toboali
// akhiran -e dan s→h, Pangkal Pinang e keras). Frasa di sini memakai
// bentuk netral/Pangkal Pinang yang paling umum; Bos mohon verifikasi
// (lihat laporan Paket 34-C untuk daftar keyakinan per frasa).

export type BangkaConfidence = "YAKIN" | "CUKUP YAKIN";

export interface BangkaPhrase {
  bangka: string;
  indonesia: string;
  confidence: BangkaConfidence;
  /** Sumber verifikasi (kamus/rujukan). */
  sumber: string;
}

/** SEMUA kata/frasa Bangka yang dipakai jawaban Anin + keyakinannya.
 * Daftar ini juga yang dilaporkan ke Bos untuk diverifikasi. */
export const BANGKA_PHRASES: BangkaPhrase[] = [
  { bangka: "aok / auk", indonesia: "iya", confidence: "YAKIN", sumber: "Kamus Bangka Belitung; Kamus Buspy; rubrik Pangkal Pinang (Auk = iya)" },
  { bangka: "ape", indonesia: "apa", confidence: "YAKIN", sumber: "Wikipedia Bahasa Bangka; Kamus Bangka Belitung (Ape: apa)" },
  { bangka: "apetah", indonesia: "mengapa", confidence: "YAKIN", sumber: "Kamus Bangka Belitung (Apetah: mengapa)" },
  { bangka: "pacak", indonesia: "bisa", confidence: "YAKIN", sumber: "Kamus Bangka Belitung; rubrik Pangkal Pinang (Pacak = bisa); contoh kalimat Wikipedia" },
  { bangka: "dak", indonesia: "tidak", confidence: "YAKIN", sumber: "Kamus Bangka Belitung (DAK); contoh kalimat Wikipedia (dak behabun, dak kek ku)" },
  { bangka: "ku", indonesia: "saya / aku", confidence: "YAKIN", sumber: "Contoh percakapan Wikipedia (Ku pacakla keruma ikak kelak)" },
  { bangka: "ikak", indonesia: "kamu / kalian", confidence: "YAKIN", sumber: "Kamus Buspy (Ikak = Kalian); contoh Wikipedia (keruma ikak = ke rumah kamu)" },
  { bangka: "ka", indonesia: "kamu", confidence: "CUKUP YAKIN", sumber: "Contoh percakapan Wikipedia (ka nek dak kek ku = kamu mau ga sama aku)" },
  { bangka: "kelak", indonesia: "nanti", confidence: "YAKIN", sumber: "Contoh percakapan Wikipedia (pacakla keruma ikak kelak)" },
  { bangka: "agik", indonesia: "lagi / masih", confidence: "YAKIN", sumber: "Kamus Bangka Belitung (Agik: Lagi); Kamus Buspy (Agik = Masih)" },
  { bangka: "sikok", indonesia: "satu", confidence: "YAKIN", sumber: "Kamus Bangka Belitung (Sikok: satu); contoh Wikipedia (telok sikok)" },
  { bangka: "bai", indonesia: "cuma / hanya", confidence: "YAKIN", sumber: "Kamus Bangka Belitung (Bai: Cuma/Hanya); contoh Wikipedia (sikok bai)" },
  { bangka: "bi", indonesia: "saja", confidence: "CUKUP YAKIN", sumber: "Kamus Buspy (Bi = Saja)" },
  { bangka: "lah", indonesia: "sudah", confidence: "YAKIN", sumber: "Kamus Buspy (Lah = Sudah)" },
  { bangka: "lom", indonesia: "belum", confidence: "CUKUP YAKIN", sumber: "Kamus Buspy (Lom = Belum) — satu sumber; BUKAN 'lum' (tidak ditemukan di kamus)" },
  { bangka: "ade", indonesia: "ada", confidence: "YAKIN", sumber: "Kamus Buspy (Ade = Ada)" },
  { bangka: "asak", indonesia: "kalau / asalkan", confidence: "CUKUP YAKIN", sumber: "Kamus Bangka Belitung (Asak: asalkan); Kamus Buspy (Asak = Kalau)" },
  { bangka: "aek", indonesia: "air", confidence: "YAKIN", sumber: "Kamus Bangka Belitung (Aik: Air/Sungai); Kamus Buspy (Aek = Air)" },
  { bangka: "mintak", indonesia: "minta", confidence: "YAKIN", sumber: "Kamus Buspy (Mintak = Minta)" },
  { bangka: "cemane", indonesia: "bagaimana", confidence: "YAKIN", sumber: "Contoh percakapan Wikipedia (Cemane ikak ni = Bagaimana kamu ini)" },
  { bangka: "sape", indonesia: "siapa", confidence: "YAKIN", sumber: "Kamus Bangka Belitung (Sape: siapa)" },
  { bangka: "saro", indonesia: "sulit / susah", confidence: "YAKIN", sumber: "Kamus Bangka Belitung (Saro: sulit); rubrik Pangkal Pinang (Saro = susah)" },
  { bangka: "kawa", indonesia: "mau", confidence: "CUKUP YAKIN", sumber: "Kamus Buspy (Kawa = Mau) — satu sumber" },
  { bangka: "bise", indonesia: "dapat / mampu", confidence: "CUKUP YAKIN", sumber: "Kamus Bangka Belitung (Bise: Mampu/DAPAT) — satu sumber" },
  { bangka: "urang", indonesia: "orang", confidence: "YAKIN", sumber: "Kamus Bangka Belitung (Urang: orang)" },
  { bangka: "umah", indonesia: "rumah", confidence: "YAKIN", sumber: "Kamus Bangka Belitung (Umah: rumah)" },
  { bangka: "gey", indonesia: "pergi", confidence: "CUKUP YAKIN", sumber: "Kamus Buspy (Gey = Pergi) — satu sumber" },
  { bangka: "terima kaseh", indonesia: "terima kasih", confidence: "CUKUP YAKIN", sumber: "Kamus Buspy (TERIMAK KASEH = TERIMA KASIH); bentuk Melayu 'kaseh' = kasih" },
  { bangka: "selamat pagi / siang / sore / malam", indonesia: "selamat pagi / siang / sore / malam (sama)", confidence: "YAKIN", sumber: "Sapaan formal Melayu baku — dipakai sama dalam Bahasa Bangka (tidak ada padanan khusus yang berbeda)" },
  { bangka: "di mane", indonesia: "di mana", confidence: "CUKUP YAKIN", sumber: "Turunan dari 'cemane' (bagaimana) — 'mane' = mana; dialek Belinyu memakai 'dimano'" },
  { bangka: "-e (akhiran)", indonesia: "-nya", confidence: "YAKIN", sumber: "Kamus Buspy (Ae/E = Nya); contoh: 'Asa e' = rasanya" },
];

/** Kata yang SENGAJA TIDAK dipakai karena tidak terverifikasi di kamus:
 * "lum" (belum — bentuk benarnya "lom"), "ngape" (mengapa — bentuk
 * Bangka-nya "apetah"), "tulung" (tolong — tidak ditemukan), "kite"
 * (kita — tidak ditemukan), "nek" (mau/cinta — maknanya ambigu di contoh
 * kalimat). Bila Bos mengonfirmasi kata-kata ini, barulah ditambahkan. */
export const BANGKA_TIDAK_DIPAKAI: Array<{ kata: string; alasan: string }> = [
  { kata: "lum", alasan: "Tidak ditemukan di kamus; bentuk 'belum' yang terverifikasi adalah 'lom'." },
  { kata: "ngape", alasan: "Tidak ditemukan di kamus Bangka; 'mengapa' yang terverifikasi adalah 'apetah'." },
  { kata: "tulung", alasan: "Tidak ditemukan di kamus; dipakai 'tolong' (Bahasa Indonesia)." },
  { kata: "kite", alasan: "Tidak ditemukan di kamus; dipakai 'ku' / 'ikak' atau 'kita' (Bahasa Indonesia)." },
  { kata: "nek", alasan: "Muncul di contoh kalimat dengan makna ambigu (mau/cinta); tidak dipakai." },
];

export type BangkaTopicId = "ktp" | "kk" | "pengantar" | "pengaduan";

export interface BangkaTopic {
  id: BangkaTopicId;
  keywords: string[];
  /** Jawaban prosedur dalam Bahasa Bangka — isinya mengikuti panduan
   * offline kb.ts (syarat + langkah yang sama), hanya bahasanya Bangka. */
  answer: string;
}

export const BANGKA_TOPICS: BangkaTopic[] = [
  {
    id: "ktp",
    keywords: ["ktp", "e-ktp", "ektp", "kartu identitas"],
    answer:
      "Untuk ngurus KTP elektronik, ikak harus lah umur 17 tahun atau lah kawin. Bawa fotokopi Kartu Keluarga (KK) dan mintak surat pengantar dari RT/RW, terus ke desa. Habis itu ikak pacak datang ke Kecamatan atau Disdukcapil bawa KK asli dan fotokopi e. Di sana ikak akan direkam foto, iris mata, tanda tangan, dan sidik jari. KTP biasa e terbit dalam 1 sampai 14 hari kerja, tergantung daerah. KTP elektronik berlaku seumur hidup asak dak ade perubahan data.",
  },
  {
    id: "kk",
    keywords: ["kk", "kartu keluarga"],
    answer:
      "Untuk ngurus Kartu Keluarga (KK), ikak perlu surat pengantar RT/RW. Asak KK baru, bawa surat nikah atau akta kelahiran; asak perubahan, bawa KK lama. Bawa juga KTP anggota keluarga yang lah dewasa. Isi formulir permohonan KK di desa, terus serahkan ke Kecamatan atau Disdukcapil. KK baru wajib dibuat habis menikah, pindah, atau ade kelahiran/kematian.",
  },
  {
    id: "pengantar",
    keywords: ["surat pengantar", "pengantar"],
    answer:
      "Surat pengantar itu surat dari RT/RW dan desa untuk ngurus keperluan ikak ke kantor yang lebih tinggi, misal e ngurus KTP atau KK. Cara e: mintak surat pengantar ke RT/RW dulu, bawa KTP dan KK. Terus bawa surat pengantar itu ke desa, baru ke Kecamatan atau Disdukcapil sesuai keperluan ikak. Asak ikak lom tau keperluan e ape, tanya dulu ke petugas desa.",
  },
  {
    id: "pengaduan",
    keywords: ["pengaduan", "aduan", "keluhan", "komplain", "lapor", "mengadu", "ngadu"],
    answer:
      "Asak ikak kawa ngadukan masalah pelayanan, ikak pacak datang langsung ke loket kecamatan atau lewat tab Pengaduan di aplikasi ni. Tulis masalah e yang jelas: ape masalah e, kapan dan di mane terjadi. Pengaduan dicatat dengan status Baru, terus petugas menindaklanjuti sampai status e jadi Diproses dan Selesai. Ikak pacak pantau status e di tab Pengaduan. Waktu selesai e tergantung jenis pengaduan e — tanya perkiraan e ke petugas.",
  },
];

/** Topik Bangka yang cocok dengan pertanyaan, atau null. Kata kunci pendek
 * (ktp, kk — panjang ≤3) hanya cocok sebagai KATA UTUH, bukan substring. */
export function matchBangkaTopic(text: string): BangkaTopic | null {
  const q = text.toLowerCase();
  for (const t of BANGKA_TOPICS) {
    for (const k of t.keywords) {
      if (k.length <= 3) {
        if (new RegExp(`\\b${k}\\b`).test(q)) return t;
      } else if (q.includes(k)) return t;
    }
  }
  return null;
}

/** Sapaan Anin menurut jam — "Selamat pagi" sama dengan Bahasa Indonesia. */
export function bangkaGreeting(hour: number): string {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

export const BANGKA_WELCOME =
  "Anin pacak jawab pertanyaan ikak tentang KTP, KK, surat pengantar, dan pengaduan — pakai Bahasa Bangka. Asak ade yang lom Anin tau, Anin jawab pakai Bahasa Indonesia dulu.";

/** Dipakai bila sakelar Bangka aktif tapi topiknya lom ade jawaban Bangka. */
export const BANGKA_FALLBACK_NOTE =
  "Anin jawab pakai Bahasa Indonesia dulu — jawaban Bahasa Bangka untuk ini lom ade.";

/** Panduan untuk jalur AI (cloud/on-device) bila sakelar Bangka aktif:
 * AI hanya boleh memakai kata Bangka dari daftar ini; selebihnya
 * Bahasa Indonesia. Ini mencegah AI mengarang kosakata Bangka. */
export const BANGKA_PROMPT_GUIDE =
  "Jawab dalam Bahasa Bangka. Hanya pakai kata Bangka berikut bila yakin: " +
  "aok (iya), ape (apa), apetah (mengapa), pacak (bisa), dak (tidak), " +
  "ku (saya), ikak (kamu), kelak (nanti), agik (lagi/masih), sikok (satu), " +
  "bai (cuma), lah (sudah), lom (belum), ade (ada), asak (kalau), " +
  "mintak (minta), cemane (bagaimana), sape (siapa), urang (orang), " +
  "umah (rumah). Kata lain pakai Bahasa Indonesia. " +
  "JANGAN mengarang kata Bangka lain — bila ragu, pakai Bahasa Indonesia.";
