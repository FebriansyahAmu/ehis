-- ════════════════════════════════════════════════════════════════════════════
-- Enrichment master Triase IGD (DEFAULT-IGD) — hasil riset 5 sistem triase
-- (ESI · ATS · CTAS · MTS · PMK 47/2018). NON-DESTRUKTIF & IDEMPOTEN:
--   • TIDAK menghapus baris apa pun yang sudah ada.
--   • Menambah item kriteria baru ke sel existing (guard NOT EXISTS by nilai).
--   • Menambah 4 parameter best-practice baru (guard by kode).
--   • Set tipe_nilai/satuan parameter numerik (idempoten — set ulang nilai sama).
-- Jalankan: npx prisma db execute --file prisma/seed_triase_enrich.sql
-- Aman dijalankan berulang.
-- ════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  pid   uuid;
  v     RECORD;
  v_pid uuid;  -- parameter id (lookup per baris)
  v_lid uuid;  -- level id (lookup per baris)
BEGIN
  SELECT id INTO pid FROM "master"."triase_protocol"
    WHERE "kode" = 'DEFAULT-IGD' AND "deleted_at" IS NULL;
  IF pid IS NULL THEN
    RAISE NOTICE 'Protokol DEFAULT-IGD tidak ditemukan — lewati enrichment.';
    RETURN;
  END IF;

  -- ── 1) Hint tipe nilai + satuan untuk parameter existing (idempoten) ──────────
  UPDATE "master"."triase_parameter" SET "tipe_nilai"='Numerik', "satuan"='×/mnt'
    WHERE "protocol_id"=pid AND "kode" IN ('breathing','nadi');
  UPDATE "master"."triase_parameter" SET "tipe_nilai"='Numerik', "satuan"='mmHg'
    WHERE "protocol_id"=pid AND "kode"='sirkulasi';
  UPDATE "master"."triase_parameter" SET "tipe_nilai"='Numerik', "satuan"='GCS'
    WHERE "protocol_id"=pid AND "kode"='kesadaran';
  UPDATE "master"."triase_parameter" SET "tipe_nilai"='Numerik', "satuan"='0–10'
    WHERE "protocol_id"=pid AND "kode"='nyeri';
  UPDATE "master"."triase_parameter" SET "tipe_nilai"='Teks'
    WHERE "protocol_id"=pid AND "kode"='contoh';

  -- ── 2) Parameter best-practice baru (idempoten by kode) ───────────────────────
  INSERT INTO "master"."triase_parameter" ("id","protocol_id","kode","label","urutan","tipe_nilai","satuan")
  SELECT gen_random_uuid(), pid, x.kode, x.label, x.urutan, x.tipe_nilai, x.satuan
  FROM (VALUES
    ('spo2',       'Saturasi (SpO₂)', 8,  'Numerik', '%'::text),
    ('suhu',       'Suhu',            9,  'Numerik', '°C'),
    ('perdarahan', 'Perdarahan',      10, 'Kategori', NULL),
    ('risiko',     'Risiko Perilaku', 11, 'Kategori', NULL)
  ) AS x(kode, label, urutan, tipe_nilai, satuan)
  WHERE NOT EXISTS (
    SELECT 1 FROM "master"."triase_parameter" p
     WHERE p."protocol_id"=pid AND p."kode"=x.kode
  );

  -- ── 3) Item kriteria (existing-param additions + new-param cells) ─────────────
  --  Guard NOT EXISTS by (parameter,level,nilai) → idempoten, tak gandakan.
  --  urutan: 0 = item paling utama; item existing seed lama tetap di urutan 0.
  FOR v IN
    SELECT * FROM (VALUES
      -- ── Airway (append) ──
      ('airway','resusitasi','Obstruksi total jalan napas',1),
      ('airway','resusitasi','Butuh airway definitif segera',2),
      ('airway','emergency','Risiko obstruksi (luka bakar inhalasi / edema)',1),
      ('airway','emergency','Butuh manuver jalan napas',2),
      ('airway','urgent','Sekret banyak / perlu suction berkala',1),
      -- ── Breathing / RR (append) ──
      ('breathing','resusitasi','Distress berat + kelelahan otot napas',1),
      ('breathing','resusitasi','Gasping / sianosis sentral',2),
      ('breathing','resusitasi','Bicara satu kata',3),
      ('breathing','emergency','Bicara penggal kata',1),
      ('breathing','emergency','Retraksi berat',2),
      ('breathing','urgent','Bicara kalimat pendek',1),
      ('breathing','lessUrgent','RR 21–24, distress ringan',1),
      ('breathing','nonUrgent','RR 12–20 (normal)',1),
      -- ── Sirkulasi / TD (append) ──
      ('sirkulasi','resusitasi','Syok berat',1),
      ('sirkulasi','resusitasi','Perdarahan tak terkontrol',2),
      ('sirkulasi','emergency','Hipoperfusi: akral dingin, CRT > 3 dtk, diaforesis, pucat',1),
      ('sirkulasi','urgent','Hemodynamic compromise borderline',1),
      ('sirkulasi','urgent','Krisis hipertensi bergejala',2),
      ('sirkulasi','lessUrgent','Perfusi baik, TD borderline tanpa gejala',1),
      -- ── Nadi (append) ──
      ('nadi','resusitasi','Nadi sentral lemah / PEA',1),
      ('nadi','emergency','< 40 atau > 140 ×/mnt (ESI danger-zone)',1),
      ('nadi','emergency','Nadi perifer lemah / thready',2),
      ('nadi','urgent','50–<60 ×/mnt atau iregular bergejala',1),
      ('nadi','lessUrgent','100–110 ×/mnt tanpa gejala',1),
      ('nadi','nonUrgent','60–100 ×/mnt (normal)',1),
      -- ── Kesadaran (append) ──
      ('kesadaran','resusitasi','Unresponsive (AVPU = U/P)',1),
      ('kesadaran','resusitasi','Penurunan kesadaran akut',2),
      ('kesadaran','emergency','Agitasi berat / violent',1),
      ('kesadaran','emergency','AVPU = P',2),
      ('kesadaran','urgent','Bingung baru · AVPU = V',1),
      ('kesadaran','lessUrgent','Alert',1),
      -- ── Skala Nyeri (append) ──
      ('nyeri','emergency','Nyeri berat sentral/viseral (dada, abdomen)',1),
      ('nyeri','urgent','Nyeri berat perifer (CTAS L3)',1),
      ('nyeri','lessUrgent','Nyeri ringan lokal',1),
      -- ── Contoh Kasus (append) ──
      ('contoh','resusitasi','Obstruksi jalan napas total',1),
      ('contoh','resusitasi','Status epileptikus',2),
      ('contoh','resusitasi','Trauma mayor + syok',3),
      ('contoh','resusitasi','Anafilaksis berat',4),
      ('contoh','emergency','STEMI / nyeri dada kardiak',1),
      ('contoh','emergency','Stroke akut (onset < 4,5 jam)',2),
      ('contoh','emergency','Sepsis',3),
      ('contoh','emergency','Overdosis',4),
      ('contoh','emergency','Perdarahan GIT aktif',5),
      ('contoh','emergency','Fraktur terbuka mayor',6),
      ('contoh','emergency','Luka bakar luas',7),
      ('contoh','urgent','Kolik abdomen / ginjal',1),
      ('contoh','urgent','Demam tinggi anak',2),
      ('contoh','urgent','Dehidrasi sedang',3),
      ('contoh','lessUrgent','Muntah/diare tanpa dehidrasi',1),
      ('contoh','lessUrgent','ISK',2),
      ('contoh','lessUrgent','Cedera minor',3),
      ('contoh','nonUrgent','Kontrol / resep ulang',1),
      ('contoh','nonUrgent','Keluhan kronik stabil',2),
      ('contoh','nonUrgent','Luka lecet kecil',3),
      -- ── SpO₂ (parameter baru) ──
      ('spo2','resusitasi','< 90% dengan distress berat',0),
      ('spo2','resusitasi','Sianosis sentral',1),
      ('spo2','emergency','< 92%',0),
      ('spo2','urgent','92–94%',0),
      ('spo2','lessUrgent','≥ 95%',0),
      ('spo2','nonUrgent','Normal (≥ 95%)',0),
      -- ── Suhu (parameter baru) ──
      ('suhu','resusitasi','Hipotermia berat < 32°C',0),
      ('suhu','resusitasi','Hipertermia > 41°C',1),
      ('suhu','emergency','> 38,3°C dengan tanda sepsis',0),
      ('suhu','emergency','< 35°C (hipotermia)',1),
      ('suhu','urgent','38–39°C',0),
      ('suhu','urgent','Demam pada imunokompromais',1),
      ('suhu','lessUrgent','37,5–38°C',0),
      ('suhu','nonUrgent','Afebris (36–37,4°C)',0),
      -- ── Perdarahan (parameter baru) ──
      ('perdarahan','resusitasi','Perdarahan masif tak terkontrol',0),
      ('perdarahan','resusitasi','Syok hemoragik',1),
      ('perdarahan','emergency','Perdarahan aktif signifikan',0),
      ('perdarahan','emergency','Perdarahan internal dicurigai',1),
      ('perdarahan','urgent','Perdarahan terkontrol / sedang',0),
      ('perdarahan','lessUrgent','Perdarahan minor (luka kecil)',0),
      ('perdarahan','nonUrgent','Tidak ada perdarahan aktif',0),
      -- ── Risiko Perilaku (parameter baru) ──
      ('risiko','resusitasi','Kekerasan/agresif bersenjata — bahaya segera',0),
      ('risiko','resusitasi','Percobaan bunuh diri berlangsung',1),
      ('risiko','emergency','Agitasi berat / risiko kekerasan',0),
      ('risiko','emergency','Risiko bunuh diri tinggi',1),
      ('risiko','urgent','Gelisah, distress psikologis sedang',0),
      ('risiko','urgent','Risiko menengah membahayakan diri',1),
      ('risiko','lessUrgent','Cemas, kooperatif',0),
      ('risiko','nonUrgent','Tenang, tanpa risiko',0)
    ) AS t(pkode, lkode, nilai, ord)
  LOOP
    SELECT id INTO v_pid FROM "master"."triase_parameter"
      WHERE "protocol_id"=pid AND "kode"=v.pkode;
    SELECT id INTO v_lid FROM "master"."triase_level"
      WHERE "protocol_id"=pid AND "kode"=v.lkode;
    IF v_pid IS NULL OR v_lid IS NULL THEN CONTINUE; END IF;

    IF NOT EXISTS (
      SELECT 1 FROM "master"."triase_criteria" c
       WHERE c."parameter_id"=v_pid AND c."level_id"=v_lid AND c."nilai"=v.nilai
    ) THEN
      INSERT INTO "master"."triase_criteria" ("id","parameter_id","level_id","nilai","urutan")
      VALUES (gen_random_uuid(), v_pid, v_lid, v.nilai, v.ord);
    END IF;
  END LOOP;

  RAISE NOTICE 'Enrichment Triase DEFAULT-IGD selesai (protokol %).', pid;
END $$;
