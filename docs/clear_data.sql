-- PERINGATAN: Menjalankan script ini akan MENGHAPUS semua data fungsional aplikasi.
-- Jalankan di Supabase SQL Editor. Tidak ada backup otomatis.

-- Reset penuh data aplikasi.
-- Catatan: Jika tabel room_occupancy belum pernah dibuat, jangan sertakan namanya.
-- Kita gunakan pendekatan aman: truncate tabel inti; jika room_occupancy ada akan ikut terhapus via CASCADE saat room di-truncate (karena FK ON DELETE CASCADE),
-- atau kita jalankan blok DO untuk menghapusnya bila ada.

BEGIN;
  TRUNCATE TABLE penalty, payment, expense RESTART IDENTITY CASCADE;
  TRUNCATE TABLE room RESTART IDENTITY CASCADE; -- occupancy akan cascade jika tabel ada
COMMIT;

-- Optional: hapus occupancy secara eksplisit hanya jika ada (tidak error kalau tidak ada)
DO $$
BEGIN
  IF to_regclass('public.room_occupancy') IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE room_occupancy RESTART IDENTITY CASCADE';
  END IF;
END$$;

-- Verifikasi (opsional)
-- SELECT count(*) as rooms FROM room;
-- SELECT count(*) as payments FROM payment;
-- SELECT count(*) as penalties FROM penalty;
-- SELECT count(*) as expenses FROM expense;
-- SELECT count(*) as occ FROM room_occupancy;
