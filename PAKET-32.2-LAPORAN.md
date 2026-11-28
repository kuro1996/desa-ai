# PAKET 32.2 — Perbaikan Cloud AI (App Check memblokir panggilan AI)

Tanggal: 28 Nov 2026. Status: DIBANGUN + DIVERIFIKASI (build lolos, check:secrets bersih). **Belum deploy — menunggu Gas Bos.**

## Masalah
Sejak 27 Nov, semua panggilan AI cloud di HP Bos gagal ("Panggilan AI gagal"). Tanya Prosedur dan Anin jatuh ke jawaban offline.

## Diagnosis (rantai bukti)
1. **Model valid**: `gemini-3.8-flash` — terverifikasi 21 Nov.
2. **API aktif**: Bos cek sendiri 28 Nov 09:20 WIB — Firebase AI Logic API "API Enabled" (firebasevertexai.googleapis.com).
3. **Tapi nol request sampai**: halaman App Check Bos (09:18 WIB) — baris Firebase AI Logic: *"Metrics will be displayed when the AI Logic API receives requests"*. Artinya API belum pernah menerima satu pun panggilan dari aplikasi.
4. **Bukti kunci (28 Nov, Node test)**: `scripts/node-cloud-test-referer.mjs` — memanggil jalur cloud yang SAMA (project, backend, model) dengan Referer situs — **berhasil, jawaban Gemini asli 280 karakter dalam 11 detik. VERDICT: CLOUD_OK.** Jadi kunci API + model + API-nya semua sehat.
5. **Satu-satunya perbedaan antara Node (berhasil) dan browser (gagal): App Check.** Kode lama (`src/firebase.ts`) memanggil `getAI()` dengan `useLimitedUseAppCheckTokens: true` begitu `appCheckSiteKey` ada — dan site key ADA di config (40 karakter, terkonfirmasi tanpa menampilkan nilainya). Setiap panggilan AI wajib mengambil dulu token reCAPTCHA Enterprise; kalau pengambilan token itu gagal, panggilan mati di sisi klien sebelum mencapai Google — persis cocok dengan "nol request". Konsol App Check menguatkan: Authentication 0% terverifikasi / 100% tak terverifikasi; aplikasi AI Logic "Registered (Un…)" (kemungkinan Unverified).
6. **Kesimpulan**: penyebabnya adalah token App Check, BUKAN kunci/model/API. Penyebab token gagal yang paling mungkin: domain `kuro1996.github.io` belum ada di allowlist kunci reCAPTCHA Enterprise (atau kunci situsnya salah) — perlu dicek di Cloud Console → Security → reCAPTCHA Enterprise saat ada waktu.

## Perbaikan (satu perubahan, `src/firebase.ts`)
Menghapus `useLimitedUseAppCheckTokens: true` dari `getAI()`. Alasan: enforcement App Check untuk AI Logic saat ini **OFF** ("Unenforced", baru ditegakkan 21 Jan 2027) — jadi token itu tidak diperiksa server dan tidak memberi perlindungan apa pun hari ini; yang dilakukannya hanya menggagalkan panggilan. `initializeAppCheck` tetap dipertahankan (attestasi untuk Firestore/Auth + monitoring).

## Verifikasi
- `npm run build`: lolos (bundle baru `index-B_VOgDAc.js`).
- `npm run check:secrets`: bersih.
- `node scripts/node-cloud-test-referer.mjs`: CLOUD_OK (bukti jalur cloud sehat; tes ini tidak memakai App Check).
- **Yang BELUM terbukti** (tidak bisa dari VM — Chrome headless VM tidak mencapai endpoint Google): panggilan cloud dari browser sungguhan setelah perbaikan ini. Pembuktian akhir = deploy + tes di HP Bos: Tanya Prosedur → badge harus **"Cloud"**.

## Tindak lanjut
1. **Deploy** (butuh Gas Bos) → tes live di HP Bos.
2. **Sebelum 21 Jan 2027** (saat App Check mulai ditegakkan untuk AI Logic): perbaiki kunci reCAPTCHA Enterprise (allowlist domain `kuro1996.github.io`), lalu aktifkan kembali `useLimitedUseAppCheckTokens`. Kalau tidak, panggilan AI akan gagal lagi saat enforcement menyala.
3. Script diagnosis baru disimpan: `scripts/node-cloud-test-referer.mjs` (jangan hapus — berguna tiap kali cloud dicurigai rusak).

## DEPLOY (28 Nov 2026, Gas Bos 09:31 WIB)
- Deploy gabungan **Paket 32.1 + 32.2 + 33** dari main `82ccb59` (build bersih dari worktree, bundle `index-B_VOgDAc.js`).
- gh-pages: `e7c583c` → **`a636e0e`** (ls-remote terverifikasi).
- Live terverifikasi: https://kuro1996.github.io/desa-ai/ menyajikan bundle baru, HTTP 200.
- Catatan: `scripts/headless-test.mjs` + `scripts/screenshot-p33.mjs` masih termodifikasi belum ter-commit di main (sisa kerja 32.1) — tidak memengaruhi build/deploy.
