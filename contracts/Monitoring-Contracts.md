Monitoring

1. Data Kunjungan
   Fungsi : Data Kunjungan
   Method : GET
   Parameter 1 : Tanggal SEP format: yyyy-mm-dd
   Parameter 2 : Jenis Pelayanan (1. Inap 2. Jalan)
   response :
   {
   "metaData": {
   "code": "200",
   "message": "Sukses"
   },
   "response": {
   "sep": [
   {
   "diagnosa": "K65.0",
   "jnsPelayanan": "R.Inap",
   "kelasRawat": "2",
   "nama": "HANIF ABDURRAHMAN",
   "noKartu": "0001819122189",
   "noSep": "0301R00110170000004",
   "noRujukan": "0301U01108180200084",
   "poli": null,
   "tglPlgSep": "2017-10-03",
   "tglSep": "2017-10-01"
   },
   {
   "diagnosa": "I50.0",
   "jnsPelayanan": "R.Inap",
   "kelasRawat": "3",
   "nama": "ASRIZAL",
   "noKartu": "0002283324674",
   "noSep": "0301R00110170000005",
   "noRujukan": "0301U01108180200184",
   "poli": null,
   "tglPlgSep": "2017-10-10",
   "tglSep": "2017-10-01"
   }
   ]
   }
   }

2.Data Klaim
Fungsi : Data Klaim
Method : GET
Parameter 1 : Tanggal Pulang format: yyyy-mm-dd
Parameter 2 : Jenis Pelayanan (1. Inap 2. Jalan)
Parameter 3 : Status Klaim (1. Proses Verifikasi 2. Pending Verifikasi 3. Klaim)
reseponse :
"metaData": {
"code": "200",
"message": "Sukses"
},
"response": {
"klaim": [
{
"Inacbg": {
"kode": "N-3-15-0",
"nama": "DIALYSIS"
},
"biaya": {
"byPengajuan": "991200",
"bySetujui": "0",
"byTarifGruper": "991200",
"byTarifRS": "1170689",
"byTopup": "0"
},
"kelasRawat": "3",
"noFPK": "",
"noSEP": "0301R00109170001280",
"peserta": {
"nama": "NUR",
"noKartu": "0033681422715",
"noMR": "974956"
},
"poli": "Hemodialisa",
"status": "Proses Verifikasi",
"tglPulang": "2017-09-02",
"tglSep": "2017-09-02"
},
{
"Inacbg": {
"kode": "N-3-15-0",
"nama": "DIALYSIS"
},
"biaya": {
"byPengajuan": "991200",
"bySetujui": "0",
"byTarifGruper": "991200",
"byTarifRS": "1015000",
"byTopup": "0"
},
"kelasRawat": "3",
"noFPK": "",
"noSEP": "0301R00109170000094",
"peserta": {
"nama": "YUH",
"noKartu": "0223416974628",
"noMR": "878410"
},
"poli": "Hemodialisa",
"status": "Proses Verifikasi",
"tglPulang": "2017-09-02",
"tglSep": "2017-09-02"
}
]
}
}

3. Data History Pelayanan Peserta
   Fungsi : Histori Pelayanan Per Peserta
   Method : GET
   Parameter 1 : No.Kartu Peserta
   Parameter 2 : Tgl Mulai Pencarian (yyyy-mmdd)
   Parameter 3 : Tgl Akhir Pencarian (yyyy-mmdd)
   response :
   {
   "metaData": {
   "code": "200",
   "message": "Sukses"
   },
   "response": {
   "histori": [
   {
   "diagnosa": "A00.1 - Cholera due to Vibrio cholerae 01, biovar eltor",
   "jnsPelayanan": "1",
   "kelasRawat": "Kelas 1",
   "namaPeserta": "STAMI",
   "noKartu": "0001160271256",
   "noSep": "0301R0110818V200084",
   "noRujukan": "0301U01108180200084",
   "poli": "",
   "ppkPelayanan": "RS YOS SUDARSO",
   "tglPlgSep": "2018-07-11",
   "tglSep": "2018-07-09"
   },
   {
   "diagnosa": "A00.1 - Cholera due to Vibrio cholerae 01, biovar eltor",
   "jnsPelayanan": "2",
   "kelasRawat": null,
   "namaPeserta": "STAMI",
   "noKartu": "0001160271256",
   "noSep": "0301R0110818V100085",
   "noRujukan": "0301U01108180201084",
   "poli": "",
   "ppkPelayanan": "RS YOS SUDARSO",
   "tglPlgSep": "2018-08-09",
   "tglSep": "2018-08-09"
   }
   ]
   }
   }
4. Data Klaim Jaminan Jasa Raharja
   Fungsi : Monitoring Klaim Jasa Raharja
   Method : GET
   Parameter 1 : Jenis Pelayanan (1. Rawat Inap, 2. Rawat Jalan)
   Parameter 2 : Tgl Mulai Pencarian (yyyy-mmdd)
   Parameter 3 : Tgl Akhir Pencarian (yyyy-mmdd)
   response :
   {
   "metaData": {
   "code": "200",
   "message": "Sukses"
   },
   "response": {
   "jaminan": [
   {
   "sep":
   {
   "noSEP":"0301R0110818V100085",
   "tglSEP":"2018-08-09",
   "tglPlgSEP":"2018-08-09",
   "noMr":"AA-01-11",
   "jnsPelayanan":"2",
   "poli":"INT",
   "diagnosa":"A00.1",
   "peserta":
   {
   "noKartu":"0001161271256",
   "nama":"JASA RAHARJA",
   "noMR":"AA-01-11"
   }
   },
   "jasaRaharja":
   {
   "tglKejadian":"2018-08-09",
   "noRegister":"AA-JR-0801",
   "ketStatusDijamin":"Dijamin",
   "ketStatusDikirim":"Sukses",
   "biayaDijamin":"100000",
   "plafon":"20000000",
   "jmlDibayar":"10000",
   "resultsJasaRaharja":"Sukses"
   }
   },
   {
   "sep":
   {
   "noSEP":"0301R0110818V100185",
   "tglSEP":"2018-08-09",
   "tglPlgSEP":"2018-08-09",
   "noMr":"AA-01-11",
   "jnsPelayanan":"2",
   "poli":"INT",
   "diagnosa":"A00.1",
   "peserta":
   {
   "noKartu":"0003361271256",
   "nama":"JASA RAHARJA",
   "noMR":"AA-01-11"
   }
   },
   "jasaRaharja":
   {
   "tglKejadian":"2018-08-09",
   "noRegister":"AA-JR-0801",
   "ketStatusDijamin":"Dijamin",
   "ketStatusDikirim":"Sukses",
   "biayaDijamin":"100000",
   "plafon":"20000000",
   "jmlDibayar":"10000",
   "resultsJasaRaharja":"Sukses"
   }
   }
   ]
   }
   }
