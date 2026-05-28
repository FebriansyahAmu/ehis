PEMBUATAN RENCANA KONTROL/SPRI

1. RencanaKontrol V2 insert
   payload :
   {
   "request": {
   "noSEP":"{nomor SEP}",
   "kodeDokter":"{kode dokter}",
   "poliKontrol":"{kode poli}",
   "tglRencanaKontrol":"{Rawat Jalan: diisi tanggal rencana kontrol, format: yyyy-MM-dd. Rawat Inap: diisi tanggal SPRI, format: yyyy-MM-dd}",
   "user":"{user pembuat rencana kontrol}",
   "formPRB": {
   "kdStatusPRB": "{kode penyakit PRB}", //(01. Diabetes Melitus,02. Hipertensi, 03. Asma, 04. Penyakit Jantung, 05. PPOK, 06. Skizofrenia, 07. Stroke, 08. Epilepsi, 09. SLE)
   "data": {
   /_ 01 _/ "HBA1C": {diisi null atau angka}, /_ 0.1 sd 15 _/
   /_ 01/07 _/ "GDP": {diisi null atau angka}, /_ 10 sd 500 _/
   /_ 01 _/ "GD2JPP": {diisi null atau angka}, /_ 10 sd 500 _/
   /_ 01/02 _/ "eGFR": {diisi null atau angka}, /_ 5 sd 150 _/
   /_ 01/07 _/ "TD_Sistolik": {diisi null atau angka}, /_ 20 sd 200 _/
   /_ 01/07 _/ "TD_Diastolik": {diisi null atau angka}, /_ 20 sd 200 _/
   /_ 01/07 _/ "LDL": {diisi null atau angka}, /_ 20 sd 500 _/
   /_ 02/04 _/ "Rata_TD_Sistolik": {diisi null atau angka}, /_ 20 sd 200 _/
   /_ 02/04 _/ "Rata_TD_Diastolik": {diisi null atau angka}, /_ 20 sd 200 _/
   /_ 02 _/ "JantungKoroner": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 02 _/ "Stroke": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 02 _/ "VaskularPerifer": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 02/04 _/ "Aritmia": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 02 _/ "AtrialFibrilasi": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 04 _/ "NadiIstirahat": {diisi null atau angka}, /_ 20 sd 200 _/
   /_ 04 _/ "SesakNapas3Bulan": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 04 _/ "NyeriDada3Bulan": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 04 _/ "SesakNapasAktivitas": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 04 _/ "NyeriDadaAktivitas": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 03 _/ "Terkontrol": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 03 _/ "Gejala2xMinggu": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 03 _/ "BangunMalam": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 03 _/ "KeterbatasanFisik": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 03 _/ "FungsiParu": {diisi null atau angka}, /_ 0 sd 100 _/
   /_ 05 _/ "SkorMMRC": {diisi null atau angka}, /_ 0 sd 40 _/
   /_ 05 _/ "Eksaserbasi1Tahun": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 05 _/ "MampuAktivitas": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 08 _/ "Epileptik6Bulan": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 08 _/ "EfekSampingOAB": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 08 _/ "HamilMenyusui": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 06 _/ "Remisi": {diisi null atau angka}, /_ 0 sd 100 _/
   /_ 06 _/ "TerapiRumatan": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 06 _/ "Usia": {diisi null atau angka}, /_ 1 sd 100 _/
   /_ 07 _/ "AsamUrat": {diisi null atau angka}, /_ 0.1 sd 20 _/
   /_ 09 _/ "RemisiSLE": {diisi null atau angka}, /_ 0 sd 100 _/
   /_ 09 _/ "Hamil": {diisi null atau angka} /_ 0 atau 1 _/
   }
   }
   }
   }

2. RencanaKontrol v2 Update
   method : PUT
   payload :
   {
   "request": {
   "noSuratKontrol":"{nomor surat kontrol}",
   "noSEP":"{nomor SEP}",
   "kodeDokter":"{kode dokter}",
   "poliKontrol":"{kode poli}",
   "tglRencanaKontrol":"{tanggal rencana kontrol, format: yyyy-MM-dd}",
   "user":"{user pembuat rencana kontrol}",
   "formPRB": {
   "kdStatusPRB": "{kode penyakit PRB}", //(01. Diabetes Melitus,02. Hipertensi, 03. Asma, 04. Penyakit Jantung, 05. PPOK, 06. Skizofrenia, 07. Stroke, 08. Epilepsi, 09. SLE)
   "data": {
   /_ 01 _/ "HBA1C": {diisi null atau angka}, /_ 0.1 sd 15 _/
   /_ 01/07 _/ "GDP": {diisi null atau angka}, /_ 10 sd 500 _/
   /_ 01 _/ "GD2JPP": {diisi null atau angka}, /_ 10 sd 500 _/
   /_ 01/02 _/ "eGFR": {diisi null atau angka}, /_ 5 sd 150 _/
   /_ 01/07 _/ "TD_Sistolik": {diisi null atau angka}, /_ 20 sd 200 _/
   /_ 01/07 _/ "TD_Diastolik": {diisi null atau angka}, /_ 20 sd 200 _/
   /_ 01/07 _/ "LDL": {diisi null atau angka}, /_ 20 sd 500 _/
   /_ 02/04 _/ "Rata_TD_Sistolik": {diisi null atau angka}, /_ 20 sd 200 _/
   /_ 02/04 _/ "Rata_TD_Diastolik": {diisi null atau angka}, /_ 20 sd 200 _/
   /_ 02 _/ "JantungKoroner": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 02 _/ "Stroke": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 02 _/ "VaskularPerifer": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 02/04 _/ "Aritmia": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 02 _/ "AtrialFibrilasi": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 04 _/ "NadiIstirahat": {diisi null atau angka}, /_ 20 sd 200 _/
   /_ 04 _/ "SesakNapas3Bulan": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 04 _/ "NyeriDada3Bulan": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 04 _/ "SesakNapasAktivitas": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 04 _/ "NyeriDadaAktivitas": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 03 _/ "Terkontrol": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 03 _/ "Gejala2xMinggu": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 03 _/ "BangunMalam": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 03 _/ "KeterbatasanFisik": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 03 _/ "FungsiParu": {diisi null atau angka}, /_ 0 sd 100 _/
   /_ 05 _/ "SkorMMRC": {diisi null atau angka}, /_ 0 sd 40 _/
   /_ 05 _/ "Eksaserbasi1Tahun": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 05 _/ "MampuAktivitas": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 08 _/ "Epileptik6Bulan": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 08 _/ "EfekSampingOAB": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 08 _/ "HamilMenyusui": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 06 _/ "Remisi": {diisi null atau angka}, /_ 0 sd 100 _/
   /_ 06 _/ "TerapiRumatan": {diisi null atau angka}, /_ 0 atau 1 _/
   /_ 06 _/ "Usia": {diisi null atau angka}, /_ 1 sd 100 _/
   /_ 07 _/ "AsamUrat": {diisi null atau angka}, /_ 0.1 sd 20 _/
   /_ 09 _/ "RemisiSLE": {diisi null atau angka}, /_ 0 sd 100 _/
   /_ 09 _/ "Hamil": {diisi null atau angka} /_ 0 atau 1 _/
   }
   }
   }
   }
3. HAPUS RENCANA KONTROL
   method :DELETE
   payload :
   {
   "request": {
   "t_suratkontrol":{
   "noSuratKontrol": "0301R0010320K000004",
   "user": "xxx"
   }
   }
   }

4. RencanaKontro/INSERT SPRI
   payload :
   {
   "request":
   {
   "noKartu":"{nomor Kartu}",
   "kodeDokter":"{kode dokter}",
   "poliKontrol":"{poli kontrol}",
   "tglRencanaKontrol":"{tgl rencana kontrol, format:yyyy-MM-dd}",
   "user":"{user pembuat spri}"
   }
   }
5. UPDATE SPRI
   payload :
   {
   "request":
   {
   "noSPRI":"{nomor SPRI}",
   "kodeDokter":"{kode dokter}",
   "poliKontrol":"{poli kontrol}",
   "tglRencanaKontrol":"{tgl rencana kontrol, format:yyyy-MM-dd}",
   "user":"{user pembuat spri}"
   }
   }
6. Fungsi : Melihat data SEP untuk keperluan rencana kontrol
   Method : GET
   Parameter: Nomor SEP Peserta
   response :
   {
   "metaData": {
   "code": "200",
   "message": "Sukses"
   },
   "response": {
   "noSep": "0301R0010819V006059",
   "tglSep": "2019-10-17",
   "jnsPelayanan": "Rawat Jalan",
   "poli": "HDL - HEMODIALISA",
   "diagnosa": "Z49.1 - Extracorporeal dialysis",
   "peserta": {
   "noKartu": "0000018965349",
   "nama": "RASBEN",
   "tglLahir": "1957-11-10",
   "kelamin": "L",
   "hakKelas": "-"
   },
   "provUmum": {
   "kdProvider": "03100202",
   "nmProvider": "KAMPUNG TELENG"
   },
   "provPerujuk": {
   "kdProviderPerujuk": "03100202",
   "nmProviderPerujuk": "KAMPUNG TELENG",
   "asalRujukan": "1",
   "noRujukan": "031002020619P000413",
   "tglRujukan": "2019-10-17"
   }
   }
   }

7. carin nomor surat kontrol Fungsi : Melihat data SEP untuk keperluan rencana kontrol
   Method : GET
   Parameter: Nomor Surat Kontrol Peserta
   response :
   {
   "response": {
   "noSuratKontrol": "0301R0111125K000002",
   "tglRencanaKontrol": "2025-11-25",
   "tglTerbit": "2025-11-18",
   "jnsKontrol": "2",
   "poliTujuan": "BED",
   "namaPoliTujuan": "BEDAH",
   "kodeDokter": "31348",
   "namaDokter": "CIiNatXXAXSkrIrPId,ManFs.SDDMe",
   "flagKontrol": "False",
   "kodeDokterPembuat": "31348",
   "namaDokterPembuat": "CIiNatXXAXSkrIrPId,ManFs.SDDMe",
   "namaJnsKontrol": "Kontrol",
   "sep": {
   "noSep": "0301R0110725V000006",
   "tglSep": "2025-07-30",
   "jnsPelayanan": "Rawat Jalan",
   "poli": "BED - BEDAH",
   "diagnosa": "E10 - Insulin-dependent diabetes mellitus",
   "peserta": {
   "noKartu": "0002482505324",
   "nama": "ARMSTIOFIALR",
   "tglLahir": "1983-09-07",
   "kelamin": "P",
   "hakKelas": "-"
   },
   "provUmum": {
   "kdProvider": "10210901",
   "nmProvider": "KERTASEMAYA"
   },
   "provPerujuk": {
   "kdProviderPerujuk": "0050B107",
   "nmProviderPerujuk": "Klinik Sehat Gajah Mada",
   "asalRujukan": "1",
   "noRujukan": "0050B1070924P000001",
   "tglRujukan": "2025-10-01"
   }
   },
   "formPRB": {
   "kdStatusPRB": null,
   "data": {
   "HBA1C": null,
   "GDP": null,
   "GD2JPP": null,
   "eGFR": null,
   "TD_Sistolik": null,
   "TD_Diastolik": null,
   "LDL": null,
   "Rata_TD_Sistolik": null,
   "Rata_TD_Diastolik": null,
   "JantungKoroner": null,
   "Stroke": null,
   "VaskularPerifer": null,
   "Aritmia": null,
   "AtrialFibrilasi": null,
   "SesakNapas3Bulan": null,
   "NyeriDada3Bulan": null,
   "Terkontrol": null,
   "Gejala2xMinggu": null,
   "BangunMalam": null,
   "KeterbatasanFisik": null,
   "FungsiParu": null,
   "SkorMMRC": null,
   "Eksaserbasi1Tahun": null,
   "MampuAktivitas": null,
   "Epileptik6Bulan": null,
   "EfekSampingOAB": null,
   "HamilMenyusui": null,
   "Remisi": null,
   "TerapiRumatan": null,
   "Usia": null,
   "AsamUrat": null,
   "RemisiSLE": null,
   "Hamil": null,
   "NadiIstirahat": null,
   "SesakNapasAktivitas": null,
   "NyeriDadaAktivitas": null
   }
   }
   },
   "metaData": {
   "code": "200",
   "message": "Sukses"
   }
   }

Catatan:
Ketika pembuatan SPRI atau jenis kontrol 1 tidak ada referensi nomor SEP asalnya, jadi field response SEP kosong atau null.
Sedangkan jika pembuatan surat kontrol atau jenis kontrol 2, akan terisi field response SEP karena terdapat referensi nomor SEP asal ketika pembuatan surat kontrol tersebut.

8. Data nomor surat kontrol berdasarkan no Kartu
   Fungsi : Data Rencana Kontrol By No Kartu
   Method : GET
   Parameter 1: Bulan. Contoh: Januari => 01
   Parameter 2: Tahun
   Parameter 3: Nomor Kartu
   Parameter 4: Format filter --> 1: tanggal entri, 2: tanggal rencana kontrol
   response :
   {
   "metaData":{
   "code":"200",
   "message":"Sukses"
   },
   "response":{
   "list":[
   {
   "noSuratKontrol":"0117R0770122K000004",
   "jnsPelayanan":"Rawat Inap",
   "jnsKontrol":"2",
   "namaJnsKontrol":"Surat Kontrol",
   "tglRencanaKontrol":"2022-01-06",
   "tglTerbitKontrol":"2022-01-05",
   "noSepAsalKontrol":"0117R0770122V000003",
   "poliAsal":"INT",
   "namaPoliAsal":"-",
   "poliTujuan":"INT",
   "namaPoliTujuan":"PENYAKIT DALAM",
   "tglSEP":"2022-01-04",
   "kodeDokter":"296676",
   "namaDokter":"ABD KADIR",
   "noKartu":"0002035874204",
   "nama":"ANI AZKIA",
   "terbitSEP":"Belum"
   }
   ]
   }
   }

9. Data Nomor Surat Kontrol
   Fungsi : Data Rencana Kontrol
   Method : GET
   Format : Json
   Content-Type: Application/x-www-form-urlencoded
   Parameter 1: Tanggal awal format : yyyy-MM-dd
   Parameter 2: Tanggal akhir format : yyyy-MM-dd
   Parameter 3: Format filter --> 1: tanggal entri, 2: tanggal rencana kontrol
   reseponse :
   {
   "metaData": {
   "code": "200",
   "message": "Sukses"
   },
   "response": {
   "list": [
   {
   "noSuratKontrol": "0301R0110321K000002",
   "jnsPelayanan": "Rawat Jalan",
   "jnsKontrol": "2",
   "namaJnsKontrol": "Surat Kontrol",
   "tglRencanaKontrol": "2021-03-18",
   "tglTerbitKontrol": "2021-03-16",
   "noSepAsalKontrol": "0301R0111018V000006",
   "poliAsal": "INT",
   "namaPoliAsal": "PENYAKIT DALAM",
   "poliTujuan": "INT",
   "namaPoliTujuan": "PENYAKIT DALAM",
   "tglSEP": "2021-03-16",
   "kodeDokter": "31479",
   "namaDokter": "Prof.dr.Yulius,SpPD, KGEH",
   "noKartu": "0001882053808",
   "nama": "mela handayani"
   }
   ]
   }
   }

   10.Data Poli/Spesialistik
   Fungsi : Data Rencana Kontrol
   Method : GET
   Format : Json
   Content-Type: Application/x-www-form-urlencoded
   Parameter 1: Jenis kontrol --> 1: SPRI, 2: Rencana Kontrol
   Parameter 2: Nomor --> jika jenis kontrol = 1, maka diisi nomor kartu; jika jenis kontrol = 2, maka diisi nomor SEP
   Parameter 3: Tanggal rencana kontrol --> format yyyy-MM-dd
   reseponse :
   {
   "metaData": {
   "code": "200",
   "message": "Sukses"
   },
   "response": {
   "list": [
   {
   "kodePoli": "004",
   "namaPoli": "Alergi-Immunologi Klinik ",
   "kapasitas": "30",
   "jmlRencanaKontroldanRujukan": "0",
   "persentase": "0.00"
   },
   {
   "kodePoli": "005",
   "namaPoli": "Gastroenterologi-Hepatologi ",
   "kapasitas": "12",
   "jmlRencanaKontroldanRujukan": "0",
   "persentase": "0.00"
   },
   {
   "kodePoli": "008",
   "namaPoli": "Hematologi - Onkologi Medik ",
   "kapasitas": "24",
   "jmlRencanaKontroldanRujukan": "0",
   "persentase": "0.00"
   },
   {
   "kodePoli": "013",
   "namaPoli": "Reumatologi ",
   "kapasitas": "24",
   "jmlRencanaKontroldanRujukan": "0",
   "persentase": "0.00"
   },
   {
   "kodePoli": "015",
   "namaPoli": "Kardiovaskular ",
   "kapasitas": "24",
   "jmlRencanaKontroldanRujukan": "0",
   "persentase": "0.00"
   },
   {
   "kodePoli": "023",
   "namaPoli": "obstetri ginekologi sosial",
   "kapasitas": "12",
   "jmlRencanaKontroldanRujukan": "0",
   "persentase": "0.00"
   }
   ]
   }
   }

10. Data Dokter
    Fungsi : Data Rencana Kontrol
    Method : GET
    Format : Json
    Content-Type: Application/x-www-form-urlencoded
    Parameter 1: Jenis kontrol --> 1: SPRI, 2: Rencana Kontrol
    Parameter 2: Kode poli
    Parameter 3: Tanggal rencana kontrol --> format yyyy-MM-dd
    response :
    {
    "metaData": {
    "code": "200",
    "message": "Sukses"
    },
    "response": {
    "list": [
    {
    "kodeDokter": "31528",
    "namaDokter": "Dr.John Wick",
    "jadwalPraktek": "16:00 - 18:00",
    "kapasitas": "12"
    },
    {
    "kodeDokter": "31348",
    "namaDokter": "Dr. Luffy",
    "jadwalPraktek": "10:00 - 12:00",
    "kapasitas": "12"
    }
    ]
    }
    }
