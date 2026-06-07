-- Seed master Triase IGD — protokol DEFAULT-IGD (mirror src/lib/master/triaseMock.ts DEFAULT_PROTOCOL).
-- Idempoten: guard pada eksistensi protokol (kode unik). Jalankan:
--   npx prisma db execute --file prisma/seed_triase.sql --schema prisma/schema
-- 6 level urgensi × 8 parameter = matrix kriteria triase ESI 5-level + DOA · PMK 47/2018.

DO $$
DECLARE
  pid     uuid;
  l_resus uuid; l_emerg uuid; l_urg uuid; l_less uuid; l_non uuid; l_doa uuid;
  p_air uuid; p_brt uuid; p_sir uuid; p_nad uuid; p_kes uuid; p_nye uuid; p_res uuid; p_con uuid;
BEGIN
  SELECT id INTO pid FROM "master"."triase_protocol" WHERE "kode" = 'DEFAULT-IGD';
  IF pid IS NOT NULL THEN
    RAISE NOTICE 'Triase DEFAULT-IGD sudah ada (%) — lewati seed.', pid;
    RETURN;
  END IF;

  pid := gen_random_uuid();
  INSERT INTO "master"."triase_protocol"
    ("id","kode","nama","deskripsi","protokol","status","is_default","version","created_at","updated_at")
  VALUES (pid, 'DEFAULT-IGD', 'Protokol Triase IGD RS (Default)',
    'Protokol triase 6 level berbasis ESI yang diadaptasi untuk konteks RS Indonesia. 8 parameter kriteria klinis.',
    'ESI 5-level (ENA 2020) + DOA · PMK 47/2018', 'Aktif', true, 0, now(), now());

  -- ── Level urgensi (kolom) ──
  l_resus := gen_random_uuid(); l_emerg := gen_random_uuid(); l_urg := gen_random_uuid();
  l_less  := gen_random_uuid(); l_non   := gen_random_uuid(); l_doa := gen_random_uuid();
  INSERT INTO "master"."triase_level"
    ("id","protocol_id","kode","label","tone","respons_time","prioritas","deskripsi","urutan")
  VALUES
    (l_resus, pid, 'resusitasi',  'Resusitasi',  'red-dark', 'Segera',      1, 'Mengancam jiwa segera, butuh resusitasi tanpa delay.', 0),
    (l_emerg, pid, 'emergency',   'Emergency',   'rose',     '< 10 menit',  2, 'Kondisi gawat darurat, intervensi cepat dalam 10 menit.', 1),
    (l_urg,   pid, 'urgent',      'Urgent',      'amber',    '< 30 menit',  3, 'Kondisi mendesak, perlu evaluasi medis dalam 30 menit.', 2),
    (l_less,  pid, 'lessUrgent',  'Less Urgent', 'emerald',  '< 60 menit',  4, 'Kondisi tidak mendesak, dapat ditangani dalam 60 menit.', 3),
    (l_non,   pid, 'nonUrgent',   'Non Urgent',  'sky',      '< 120 menit', 5, 'Keluhan ringan, dapat menunggu hingga 120 menit.', 4),
    (l_doa,   pid, 'doa',         'DOA',         'slate',    'Verifikasi',  6, 'Dead On Arrival — tanpa tanda kehidupan saat tiba.', 5);

  -- ── Parameter (baris) ──
  p_air := gen_random_uuid(); p_brt := gen_random_uuid(); p_sir := gen_random_uuid(); p_nad := gen_random_uuid();
  p_kes := gen_random_uuid(); p_nye := gen_random_uuid(); p_res := gen_random_uuid(); p_con := gen_random_uuid();
  INSERT INTO "master"."triase_parameter" ("id","protocol_id","kode","label","urutan")
  VALUES
    (p_air, pid, 'airway',    'Airway',            0),
    (p_brt, pid, 'breathing', 'Breathing / RR',    1),
    (p_sir, pid, 'sirkulasi', 'Sirkulasi / TD',    2),
    (p_nad, pid, 'nadi',      'Nadi',              3),
    (p_kes, pid, 'kesadaran', 'Kesadaran (GCS)',   4),
    (p_nye, pid, 'nyeri',     'Skala Nyeri (VAS)', 5),
    (p_res, pid, 'respons',   'Waktu Respons',     6),
    (p_con, pid, 'contoh',    'Contoh Kasus',      7);

  -- ── Sel matrix (parameter × level) ──
  INSERT INTO "master"."triase_criteria" ("id","parameter_id","level_id","nilai") VALUES
    -- Airway
    (gen_random_uuid(), p_air, l_resus, 'Tersumbat total / apnea'),
    (gen_random_uuid(), p_air, l_emerg, 'Tersumbat parsial, stridor'),
    (gen_random_uuid(), p_air, l_urg,   'Bebas, perlu bantuan'),
    (gen_random_uuid(), p_air, l_less,  'Bebas'),
    (gen_random_uuid(), p_air, l_non,   'Bebas'),
    (gen_random_uuid(), p_air, l_doa,   '—'),
    -- Breathing / RR
    (gen_random_uuid(), p_brt, l_resus, 'Tidak bernapas / RR < 8'),
    (gen_random_uuid(), p_brt, l_emerg, 'RR > 30, distress berat, sianosis'),
    (gen_random_uuid(), p_brt, l_urg,   'RR 21–30, distress sedang'),
    (gen_random_uuid(), p_brt, l_less,  'Normal, sesak ringan'),
    (gen_random_uuid(), p_brt, l_non,   'Normal'),
    (gen_random_uuid(), p_brt, l_doa,   '—'),
    -- Sirkulasi / TD
    (gen_random_uuid(), p_sir, l_resus, 'Henti jantung / TD tidak terukur'),
    (gen_random_uuid(), p_sir, l_emerg, 'TD < 90 mmHg (syok)'),
    (gen_random_uuid(), p_sir, l_urg,   'TD 90–100 mmHg'),
    (gen_random_uuid(), p_sir, l_less,  'Stabil'),
    (gen_random_uuid(), p_sir, l_non,   'Normal'),
    (gen_random_uuid(), p_sir, l_doa,   '—'),
    -- Nadi
    (gen_random_uuid(), p_nad, l_resus, 'Tidak teraba'),
    (gen_random_uuid(), p_nad, l_emerg, '< 50 atau > 130 ×/mnt'),
    (gen_random_uuid(), p_nad, l_urg,   '100–130 ×/mnt (lemah)'),
    (gen_random_uuid(), p_nad, l_less,  'Normal'),
    (gen_random_uuid(), p_nad, l_non,   'Normal'),
    (gen_random_uuid(), p_nad, l_doa,   '—'),
    -- Kesadaran (GCS)
    (gen_random_uuid(), p_kes, l_resus, '≤ 8 · Koma'),
    (gen_random_uuid(), p_kes, l_emerg, '9–12 · Somnolen'),
    (gen_random_uuid(), p_kes, l_urg,   '13–14 · Apatis / Delirium'),
    (gen_random_uuid(), p_kes, l_less,  '15 · Sadar penuh'),
    (gen_random_uuid(), p_kes, l_non,   '15'),
    (gen_random_uuid(), p_kes, l_doa,   '—'),
    -- Skala Nyeri (VAS)
    (gen_random_uuid(), p_nye, l_resus, '—'),
    (gen_random_uuid(), p_nye, l_emerg, '8–10 · Berat'),
    (gen_random_uuid(), p_nye, l_urg,   '5–7 · Sedang'),
    (gen_random_uuid(), p_nye, l_less,  '3–4 · Ringan-sedang'),
    (gen_random_uuid(), p_nye, l_non,   '0–2'),
    (gen_random_uuid(), p_nye, l_doa,   '—'),
    -- Waktu Respons
    (gen_random_uuid(), p_res, l_resus, 'Segera · detik'),
    (gen_random_uuid(), p_res, l_emerg, '< 10 menit'),
    (gen_random_uuid(), p_res, l_urg,   '< 30 menit'),
    (gen_random_uuid(), p_res, l_less,  '< 60 menit'),
    (gen_random_uuid(), p_res, l_non,   '< 120 menit'),
    (gen_random_uuid(), p_res, l_doa,   'Verifikasi kematian'),
    -- Contoh Kasus
    (gen_random_uuid(), p_con, l_resus, 'Henti napas / jantung, syok berat'),
    (gen_random_uuid(), p_con, l_emerg, 'STEMI, stroke, distress napas berat'),
    (gen_random_uuid(), p_con, l_urg,   'Fraktur, nyeri dada moderat, kejang'),
    (gen_random_uuid(), p_con, l_less,  'Luka ringan, nyeri sedang'),
    (gen_random_uuid(), p_con, l_non,   'ISPA ringan, kontrol rutin'),
    (gen_random_uuid(), p_con, l_doa,   'Meninggal saat tiba, tanpa tanda kehidupan');

  RAISE NOTICE 'Seed Triase DEFAULT-IGD selesai (protokol %).', pid;
END $$;
