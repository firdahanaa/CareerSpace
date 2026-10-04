# AGENTS.md — MyCareerSpace

Aturan proyek untuk AI agent (Antigravity). Baca file ini dan `docs/PRD.md` sebelum mengerjakan tugas apa pun.

## 1. Ringkasan proyek

MyCareerSpace adalah aplikasi web personal dengan satu administrator. Data karier diisi sekali di dashboard privat, lalu dipakai untuk dua keluaran:

1. **Portfolio publik** (hanya data yang dipublikasikan).
2. **CV PDF ramah ATS** (banyak konfigurasi CV per target role, dibuat dari data yang sama).

Ini sistem manajemen konten untuk identitas profesional pribadi, **bukan** platform rekrutmen dan bukan editor desain CV bebas.

Sumber kebenaran fitur: `docs/PRD.md`. Jika ada konflik antara file ini dan PRD soal perilaku produk, ikuti PRD dan beri tahu pengguna.

## 2. Tech stack

| Kebutuhan | Pilihan |
|---|---|
| Framework | Next.js (App Router) + TypeScript (strict) |
| UI | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Supabase atau Neon) |
| ORM | Prisma |
| Auth | Auth.js (Credentials, satu akun admin) |
| Validasi | Zod (dipakai di form dan server action) |
| PDF | @react-pdf/renderer |
| Tes | Vitest (unit), Playwright (e2e, opsional di akhir) |
| Hosting | Vercel |

Jangan menambah library besar atau mengganti stack tanpa persetujuan pengguna.

## 3. Struktur folder

```
docs/
  PRD.md
prisma/
  schema.prisma
  seed.ts
src/
  app/
    (public)/              # portfolio publik: /, /about, /projects, /projects/[slug], /contact
    (dashboard)/dashboard/ # area privat: profile, projects, experiences, education,
                           #   skills, certifications, portfolio, cvs, settings
    login/
    api/
  components/
    ui/                    # shadcn/ui
    forms/
    public/
    dashboard/
  lib/
    db.ts                  # Prisma client
    auth.ts
    validation/            # skema Zod per entitas
    queries/
      public.ts            # SEMUA query untuk halaman publik (wajib filter published)
      admin.ts             # query dashboard
    cv/
      suggestions.ts       # saran konten berbasis aturan (deterministik)
      validate.ts          # validasi sebelum export
      templates/           # classic.tsx, modern-minimal.tsx
tests/
```

## 4. Aturan data dan privasi (WAJIB)

Ini aturan paling penting dari PRD. Jangan dilanggar meski diminta secara tidak langsung.

1. **Publik hanya melihat `published = true`.** Semua query untuk halaman publik harus lewat `lib/queries/public.ts` dan selalu memfilter `published`. Jangan query Prisma langsung di komponen halaman publik.
2. **Dashboard dilindungi di sisi server.** Cek sesi di middleware dan di setiap server action/route handler. Menyembunyikan tombol di UI tidak cukup. Halaman privat harus tetap tertutup walau URL record diketahui.
3. **CV menyimpan referensi, bukan salinan.** `CvRecordSelection` hanya berisi `cvId`, `recordType`, `recordId`, `order`, dan `source`. Jangan menduplikasi isi project/experience ke tabel CV.
4. **Published dan masuk CV adalah dua hal independen.** Mengubah status published tidak boleh mengubah isi CV mana pun, dan sebaliknya. Project privat boleh masuk CV privat.
5. **Publikasi tidak otomatis.** Mempublikasikan portfolio tidak mempublikasikan semua record. Record baru default `published = false`, `featured = false`.
6. **Export PDF tidak mempublikasikan CV.** CV hanya publik jika `published` CV diatur eksplisit, dan hanya lewat link yang dimaksud. PDF privat tidak boleh dapat diakses dengan menebak URL.
7. **Hapus record yang dipakai CV.** Tampilkan peringatan berisi daftar CV terdampak, lalu hapus referensinya dengan aman. Jangan pernah mengganti diam-diam dengan record lain.
8. **Preview dan export memakai data tersimpan terbaru.** PDF yang sudah diekspor adalah snapshot statis dan tidak berubah.
9. **Kredensial** tidak boleh muncul di data publik, export CV, atau log. Simpan password sebagai hash (bcrypt/argon2). Rahasia hanya di environment variable.
10. **Tidak menampilkan elemen kosong.** Link demo kosong tidak boleh menghasilkan tombol rusak; field opsional kosong harus tetap dirender rapi.

## 5. Model data (ringkas)

Entitas sesuai PRD bagian 7: `Administrator`, `Profile`, `Project`, `Experience`, `Education`, `Skill`, `Certification` (termasuk achievement), `CvConfig`, `CvSection`, `CvRecordSelection`, `CvExport`, `PortfolioSettings`.

- Satu `Profile` memiliki banyak Project, Experience, Education, Skill, Certification.
- Skill terhubung many-to-many ke Project dan Experience (bukan teks bebas).
- `Experience` satu form untuk employment, internship, freelance, organization, volunteering.
- Semua record karier punya `published` (default false). Project juga punya `featured` dan `order`.
- `CvConfig`: name, targetRole, summaryOverride, template, published (default false), lastGeneratedAt.
- `CvRecordSelection.source`: `MANUAL` atau `SUGGESTED`; simpan juga status accepted/rejected untuk saran.
- `CvExport`: cvId, generatedAt, fileReference, status.

Gunakan `onDelete` yang disengaja dan jelaskan alasannya di komentar skema.

## 6. Aturan CV dan PDF

- Minimal dua template: **Classic** (satu kolom, teks dulu) dan **Modern Minimal** (satu kolom, aksen halus).
- Tanpa ikon, grafik dekoratif, atau kolom visual untuk menyampaikan kualifikasi penting.
- Heading standar: Experience, Education, Skills, Projects. Urutan baca logis.
- PDF harus berisi teks yang bisa diseleksi (bukan gambar). Tulis tes ekstraksi teks untuk memverifikasi isi dan urutan.
- Format tanggal, judul peran, dan nama organisasi harus konsisten.
- Validasi sebelum export: data profil wajib (nama, headline), field wajib CV, dan peringatan overflow/layout.
- Ganti template tidak boleh mengubah data sumber atau pilihan konten.
- Saran konten (CV-04) bersifat **deterministik dan bisa dijelaskan** (cocokkan target role dengan tag/skill/teknologi). Tampilkan alasan tiap saran. **Jangan memakai AI/LLM** di MVP. Admin selalu menentukan pilihan akhir.
- Jangan mengklaim CV "pasti lolos ATS".

## 7. Aturan kerja agent

1. **Satu tugas per sesi.** Kerjakan hanya yang diminta. Jangan membangun fitur lain "sekalian".
2. **Baca dulu**, lalu rencanakan: sebelum menulis kode, sebutkan bagian PRD yang relevan (misalnya `PROF-01`, `CV-06`) dan rencana singkat file yang akan diubah.
3. **Ikuti urutan pengerjaan:** skema DB → fondasi (auth, layout, proteksi route) → CRUD Profile + Project → CRUD lainnya → portfolio publik → CV Manager → export PDF → finalisasi.
4. **Di luar scope MVP** (jangan dibuat): registrasi publik, multi-user, pembayaran, konten CV hasil AI, pencocokan pekerjaan AI, editor drag-and-drop, pelacak lamaran, akun recruiter/pesan.
5. **Penyederhanaan yang disepakati:** pengurutan pakai tombol naik/turun (bukan drag-and-drop); saran konten dikerjakan paling akhir; Achievements digabung ke Certification.
6. **Jangan menebak.** Jika PRD ambigu atau ada keputusan yang mengubah arsitektur, tanyakan ke pengguna.
7. **Jangan mengubah** `prisma/schema.prisma` tanpa membuat migrasi, dan jangan menghapus data/migrasi yang ada.
8. **Akhiri setiap tugas** dengan ringkasan: apa yang dibuat, file yang berubah, cara mencobanya, dan hal yang belum selesai atau diasumsikan. Jangan mengklaim sesuatu sudah berfungsi jika belum dijalankan.

## 8. Standar kode

- TypeScript strict; hindari `any`.
- Validasi input di server dengan Zod, bukan hanya di klien.
- Form: label yang jelas, pesan validasi per field, nilai yang sudah diisi tetap ada saat validasi gagal, tombol simpan/batal.
- Aksesibilitas: label form, navigasi keyboard, kontras cukup.
- Responsif: dashboard, portfolio, dan alur CV harus nyaman di desktop dan mobile; portfolio tanpa scroll horizontal untuk konten biasa.
- Pisahkan secara logis: data karier, presentasi portfolio, dan presentasi CV.
- Komponen kecil dan reusable; pola CRUD Project dipakai ulang untuk entitas lain.
- Komentar hanya untuk "mengapa", bukan "apa".

## 9. Perintah

```bash
npm install
npx prisma migrate dev      # jalankan migrasi lokal
npx prisma db seed          # data contoh
npm run dev                 # server pengembangan
npm run lint
npm run typecheck
npm run test
npm run build               # harus lulus sebelum deploy
```

Environment variable (jangan commit nilainya): `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`. Sediakan `.env.example` tanpa nilai rahasia.

## 10. Definition of done

Sebuah tugas selesai bila:

- Berfungsi sesuai requirement ID terkait di PRD dan lolos `lint`, `typecheck`, dan `build`.
- Ada tes untuk logika penting (filter published, validasi, penghapusan record yang direferensikan, ekstraksi teks PDF).
- Tidak ada kebocoran data privat ke halaman atau respons publik.
- Pengguna sudah diberi cara memverifikasi secara manual (langkah singkat di ringkasan akhir).

Checklist akhir MVP ada di PRD bagian 8 dan 10. Itu harus diverifikasi terhadap aplikasi sungguhan, bukan hanya dicentang.
