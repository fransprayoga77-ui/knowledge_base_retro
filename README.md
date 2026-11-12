# Knowledge Base Retro

Pusat bantuan (knowledge base) **multi-project** pengganti buku manual, dengan **asisten AI** yang menjawab pertanyaan pengguna hanya dari artikel yang ada. Tampilan memakai design system **Atelier (Bold Press)**.

- **Stack:** Laravel 13 · Inertia + React 19 + TypeScript · Tailwind CSS v4 · PostgreSQL (MySQL juga bisa)
- **AI:** Claude (Anthropic PHP SDK) dengan pencarian artikel (RAG sederhana berbasis full-text search)

## Fitur

**Pusat bantuan publik** (`/{slug-project}`)
- Beranda per project: kotak pencarian besar, tab per peran (Pelanggan / Vendor / Driver / Admin), kartu kategori, artikel populer
- Halaman artikel: daftar isi otomatis, artikel lain dalam kategori, tombol sebelumnya/berikutnya, penilaian "membantu?"
- Pencarian full-text (PostgreSQL `tsvector`, judul & tag diberi bobot lebih tinggi; fallback `LIKE` untuk MySQL/SQLite)
- **Peran tertutup:** peran yang tidak publik (mis. Vendor, Driver, Admin) hanya bisa dibaca admin dan member yang diberi akses
- **Tanya Asisten (AI):** menjawab dengan nomor sumber `[1]` yang bisa diklik, mengikuti hak akses peran, memberi catatan bila artikel masih "perlu konfirmasi", dan jujur bila jawabannya tidak ada
- Mode gelap/terang, responsif sampai layar HP

**Panel admin** (`/admin`)
- Dashboard: jumlah artikel, artikel yang perlu dikonfirmasi, pertanyaan AI yang tak terjawab, artikel terpopuler
- Project: nama, slug, tagline, kontak bantuan resmi, daftar peran (publik/tertutup)
- Artikel: editor Markdown + pratinjau, kategori, platform (web/mobile), status draft/terbit, verifikasi + catatan
- Impor banyak file `.md` sekaligus (frontmatter YAML)
- Kategori per peran
- Log chat AI (filter terjawab/tak terjawab dan penilaian 👍/👎)
- Pengguna: admin atau member dengan akses baca per project/peran

## Menjalankan secara lokal

Prasyarat: PHP 8.3+, Composer, Node 20+, PostgreSQL 14+ (atau MySQL 8).

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

Atur koneksi database di `.env` (`DB_CONNECTION=pgsql`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`), lalu:

```bash
php artisan migrate --seed
npm run build
php artisan serve
```

Buka http://localhost:8000. Masuk ke `/login` dengan `KB_ADMIN_EMAIL` / `KB_ADMIN_PASSWORD` dari `.env` (bawaan `admin@example.com` / `password`), lalu **segera ganti password** di menu Pengguna.

Selama pengembangan, jalankan `npm run dev` agar perubahan tampilan langsung terlihat.

Seeder membuat dua project contoh:
- **Adacar**: 60 artikel dari manual Pelanggan (web + mobile) dan Vendor
- **Artha Pricing Intelligence**: 4 artikel contoh untuk memperlihatkan konsep multi-project

## Mengaktifkan asisten AI

Isi di `.env`:

```dotenv
ANTHROPIC_API_KEY=sk-ant-...
KB_AI_MODEL=claude-opus-5-5   # model yang dipakai
KB_AI_EFFORT=low              # low | medium | high — makin tinggi makin teliti tapi lebih lambat & mahal
KB_AI_CONTEXT_ARTICLES=5      # jumlah artikel yang dikirim sebagai konteks
```

Tanpa API key, asisten tetap berjalan dan menampilkan artikel yang paling relevan.

Cara kerjanya (`app/Services/ChatAssistant.php`):
1. Pertanyaan dicari dengan full-text search, **hanya pada peran yang boleh dibaca pengguna**.
2. Hingga 5 artikel teratas dikirim ke Claude bersama aturan: jawab hanya dari artikel, beri nomor sumber, jangan mengarang kebijakan/harga/kontak.
3. Jawaban yang tidak ditemukan ditandai "tak terjawab" di log admin. Pertanyaan-pertanyaan ini bisa jadi bahan artikel baru.
4. Server-side fallback diaktifkan: bila model menolak karena kebijakan keamanan, server otomatis mencoba model cadangan.

## Format konten (Markdown + frontmatter)

Satu file = satu artikel. Contoh di `content/adacar/`.

```markdown
---
title: "Cara membayar pesanan dengan Virtual Account"
slug: membayar-dengan-virtual-account
audience: customer          # kode peran yang terdaftar di project
category: "Pembayaran"      # dibuat otomatis bila belum ada
category_order: 5
order: 2
platform: all               # all | web | mobile
tags: ["VA", "transfer bank", "bayar"]   # isi sinonim yang biasa diketik pengguna
excerpt: "Ringkasan satu kalimat."
verification: verified      # verified | needs_review
review_note: ""             # wajib diisi bila needs_review
---

Satu kalimat tentang apa yang akan berhasil dilakukan pembaca.

## Langkah-langkah

1. Pilih **Virtual Account**.
```

Impor lewat admin (**Artikel → Impor .md**) atau CLI:

```bash
php artisan kb:import adacar content/adacar
```

Artikel dengan slug yang sama akan diperbarui, bukan diduplikasi.

`content/adacar/_REVIEW.md` berisi daftar hal di manual Adacar yang masih perlu dikonfirmasi tim (kebijakan berlabel "rancangan", nama status, kanal bantuan resmi, dan sebagainya).

## Struktur kode

```
app/Services/ArticleImporter.php   impor Markdown + frontmatter
app/Services/ArticleSearch.php     pencarian full-text (pgsql) / LIKE (lainnya)
app/Services/ChatAssistant.php     asisten AI (Claude)
app/Services/Markdown.php          render Markdown aman + daftar isi
app/Http/Controllers/HelpCenterController.php   pusat bantuan publik + endpoint chat
app/Http/Controllers/Admin/*       panel admin
resources/js/pages/Help/*          halaman publik
resources/js/pages/Admin/*         halaman admin
resources/js/components/ChatWidget.tsx
resources/css/atelier/             token & komponen Atelier (Bold Press)
content/                           konten awal (Markdown)
```

## Tes

```bash
php artisan test
```

## Catatan lisensi

Folder `resources/css/atelier/` dan `resources/js/atelier/` berasal dari template **Atelier** (ThemeForest, lisensi Envato Regular) milik pemilik repo. **Jangan jadikan repo ini publik** dan jangan bagikan kode template tersebut di luar ketentuan lisensinya.
