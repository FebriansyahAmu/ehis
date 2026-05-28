Rujukan Resmi dari TrustMark BPJS

1.Insert Rujukan Payload:
{
"request": {
"t_rujukan": {
"noSep": "{nomor sep}",
"tglRujukan": "{tanggal rujukan, format : yyyy-MM-dd}",
"tglRencanaKunjungan":"{tanggal rencana kunjungan, format : yyyy-MM-dd}",
"ppkDirujuk": "{kode faskes, 8 digit}",
"jnsPelayanan": "{1-> rawat inap, 2-> rawat jalan}",
"catatan": "{catatan}",
"diagRujukan": "{kode diagnosa}",
"tipeRujukan": "{0->Penuh, 1->Partial, 2->balik PRB}",
"poliRujukan": "{kosong untuk tipe rujukan 2, harus diisi jika 0 atau 1}",
"user": "{user ws}"
}
}
}

2. Update Rujukan
   Method : PUT
   Payload :
   {
   "request": {
   "t_rujukan": {
   "noRujukan": "{nomor rujukan}",
   "tglRujukan": "{tanggal rujukan, format : yyyy-MM-dd}",
   "tglRencanaKunjungan":"{tanggal rencana kunjungan, format : yyyy-MM-dd}",
   "ppkDirujuk": "{kode faskes, 8 digit}",
   "jnsPelayanan": "{1-> rawat inap, 2-> rawat jalan}",
   "catatan": "{catatan}",
   "diagRujukan": "{kode diagnosa}",
   "tipeRujukan": "{0->Penuh, 1->Partial, 2->balik PRB}",
   "poliRujukan": "{kosong untuk tipe rujukan 2, harus diisi jika 0 atau 1}",
   "user": "{user ws}"
   }
   }
   }

3. List Spesialistik Rujukan
   Method : GET
   Parameter 1: Kode PPK Rujukan : 8 digit
   Parameter 2: Tanggal rujukan format : yyyy-MM-dd
   Response:
   {
   "metaData": {
   "code": "200",
   "message": "Ok"
   },
   "response": {
   "list": [
   {
   "kodeSpesialis": "005",
   "namaSpesialis": "Gastroenterologi-Hepatologi ",
   "kapasitas": "0",
   "jumlahRujukan": "0",
   "persentase": "0,00"
   },
   {
   "kodeSpesialis": "006",
   "namaSpesialis": "Geriatri ",
   "kapasitas": "0",
   "jumlahRujukan": "0",
   "persentase": "0,00"
   },
   {
   "kodeSpesialis": "007",
   "namaSpesialis": "Ginjal-Hipertensi ",
   "kapasitas": "0",
   "jumlahRujukan": "0",
   "persentase": "0,00"
   },
   {
   "kodeSpesialis": "008",
   "namaSpesialis": "Hematologi - Onkologi Medik ",
   "kapasitas": "0",
   "jumlahRujukan": "0",
   "persentase": "0,00"
   },
   {
   "kodeSpesialis": "010",
   "namaSpesialis": "Endokrin-Metabolik-Diabetes",
   "kapasitas": "0",
   "jumlahRujukan": "0",
   "persentase": "0,00"
   },
   {
   "kodeSpesialis": "017",
   "namaSpesialis": "Bedah Onkologi ",
   "kapasitas": "0",
   "jumlahRujukan": "0",
   "persentase": "0,00"
   },
   {
   "kodeSpesialis": "018",
   "namaSpesialis": "Bedah Digestif ",
   "kapasitas": "0",
   "jumlahRujukan": "0",
   "persentase": "0,00"
   },
   {
   "kodeSpesialis": "020",
   "namaSpesialis": "fetomaternal",
   "kapasitas": "0",
   "jumlahRujukan": "0",
   "persentase": "0,00"
   },
   {
   "kodeSpesialis": "021",
   "namaSpesialis": "onkologi ginekologi",
   "kapasitas": "0",
   "jumlahRujukan": "0",
   "persentase": "0,00"
   }
   ]
   }
   }

4. List Data Rujukan Keluar RS
   Method : GET
   Parameter 1: Tanggal Mulai
   Parameter 2: Tanggal Akhir
   Response :
   {
   "metaData": {
   "code": "200",
   "message": "Sukses"
   },
   "response": {
   "list": [
   {
   "noRujukan": "1828R0011221B000001",
   "tglRujukan": "2021-12-06",
   "jnsPelayanan": "2",
   "noSep": "1828r0011221v000001",
   "noKartu": "0002035020396",
   "nama": "SUSANTI",
   "ppkDirujuk": "1820R001",
   "namaPpkDirujuk": "RSUD SAWERIGADING PALOPO"
   },
   {
   "noRujukan": "1828R0011221B000006",
   "tglRujukan": "2021-12-08",
   "jnsPelayanan": "2",
   "noSep": "1828R0011221V000013",
   "noKartu": "0002059334728",
   "nama": "MARINGAN HALOMOAN NAPITUPULU",
   "ppkDirujuk": "0345R001",
   "namaPpkDirujuk": "RSU INCO SOROWAKO"
   },
   {
   "noRujukan": "1828R0011221B000002",
   "tglRujukan": "2021-12-13",
   "jnsPelayanan": "2",
   "noSep": "1828r0011221v000004",
   "noKartu": "0002045650173",
   "nama": "SUTRISNO",
   "ppkDirujuk": "1820R001",
   "namaPpkDirujuk": "RSUD SAWERIGADING PALOPO"
   },
   {
   "noRujukan": "1828R0011221B000003",
   "tglRujukan": "2021-12-15",
   "jnsPelayanan": "1",
   "noSep": "1828R0011221V000011",
   "noKartu": "0002042908222",
   "nama": "SARMAH",
   "ppkDirujuk": "1820R001",
   "namaPpkDirujuk": "RSUD SAWERIGADING PALOPO"
   }
   ]
   }
   }

5.Get Data Detail Rujukan Keluar RS Berdasarkan Nomor Rujukan
Method : GET
Parameter 1: Nomor Rujukan
Response:
{
"metaData": {
"code": "200",
"message": "Sukses"
},
"response": {
"rujukan": {
"noRujukan": "1828R0011221B000001",
"noSep": "1828r0011221v000001",
"noKartu": "0002035020396",
"nama": "SUSANTI",
"kelasRawat": "3",
"kelamin": "P",
"tglLahir": "1988-04-08",
"tglSep": "2021-12-06",
"tglRujukan": "2021-12-06",
"tglRencanaKunjungan": "2021-12-06",
"ppkDirujuk": "1820R001",
"namaPpkDirujuk": "RSUD SAWERIGADING PALOPO",
"jnsPelayanan": "2",
"catatan": "TES DEVELOPMENT",
"diagRujukan": "C46.0",
"namaDiagRujukan": "Kaposi's sarcoma of skin",
"tipeRujukan": "0",
"namaTipeRujukan": "Rujukan Penuh",
"poliRujukan": "OBG",
"namaPoliRujukan": "OBGYN"
}
}
}

6. Get Data Jumlah SEP yang terbentuk berdasarkan No Rujukan yang masuk ke RS
   Method : GET
   Parameter 1: Jenis Rujukan 1 -> fktp, 2 -> fkrtl
   Parameter 2: No Rujukan
   Response :  
   {
   "metaData": {
   "code": "200",
   "message": "OK"
   },
   "response": {
   "jumlahSEP": "1"
   }
   }

7. INSERT RUJUKAN KHUSUS
   payload :
   {
   "noRujukan": "{norujukan}",
   "diagnosa": [
   {"kode": "{primer/sekunder};{kodediagnosa}"}
   ],
   "procedure": [
   {"kode": "{kodeprocedure}"}
   ],
   "user": "{user ws}"
   }

8. DELETE RUJUKAN KHUSUS
   method : delete
   payload:
   {
   "request": {
   "t_rujukan": {
   "idRujukan": "98865",
   "noRujukan": "0301U0331019P003283",
   "user": "Coba Ws"
   }
   }
   }
9. LIST RUJUKAN KHUSUS
   Method : GET
   Parameter 1: Bulan (1,2,3,4,5,6,7,8,9,10,11,12)
   Parameter 2: Tahun (4 digit)
   response :
   {
   "metaData": {
   "code": "200",
   "message": "OK"
   },
   "response": {
   "rujukan": [
   {
   "idrujukan": "98866",
   "norujukan": "0301U0331019P003283",
   "nokapst": "0000016553957",
   "nmpst": "MUZNI MUKHTAR",
   "diagppk": "N18",
   "tglrujukan_awal": "2021-03-22",
   "tglrujukan_berakhir": "2021-06-19"
   }
   ]
   }
   }

10. Fungsi : Pencarian data rujukan dari rumah sakit berdasarkan nomor rujukan
    Method : GET
    Parameter : Nomor Rujukan
    REsponse :
    {
    "metaData": {
    "code": "200",
    "message": "OK"
    },
    "response": {
    "rujukan": {
    "diagnosa": {
    "kode": "I21.9",
    "nama": "Acute myocardial infarction, unspecified"
    },
    "keluhan": "",
    "noKunjungan": "0304R0050217A000079",
    "pelayanan": {
    "kode": "1",
    "nama": "Rawat Inap"
    },
    "peserta": {
    "cob": {
    "nmAsuransi": null,
    "noAsuransi": null,
    "tglTAT": null,
    "tglTMT": null
    },
    "hakKelas": {
    "keterangan": "KELAS III",
    "kode": "3"
    },
    "informasi": {
    "dinsos": null,
    "noSKTM": null,
    "prolanisPRB": null
    },
    "jenisPeserta": {
    "keterangan": "PBI (APBN)",
    "kode": "21"
    },
    "mr": {
    "noMR": "971430",
    "noTelepon": null
    },
    "nama": "MUHAMMAD JUSAR",
    "nik": "1106081301530001",
    "noKartu": "0105986780439",
    "pisa": "1",
    "provUmum": {
    "kdProvider": "03050301",
    "nmProvider": "BASO"
    },
    "sex": "L",
    "statusPeserta": {
    "keterangan": "AKTIF",
    "kode": "0"
    },
    "tglCetakKartu": "2017-11-13",
    "tglLahir": "1953-07-01",
    "tglTAT": "2053-07-01",
    "tglTMT": "2013-01-01",
    "umur": {
    "umurSaatPelayanan": "63 tahun ,7 bulan ,23 hari",
    "umurSekarang": "64 tahun ,4 bulan ,12 hari"
    }
    },
    "poliRujukan": {
    "kode": "",
    "nama": ""
    },
    "provPerujuk": {
    "kode": "0304R005",
    "nama": "RSI IBNU SINA"
    },
    "tglKunjungan": "2017-02-24"
    }
    }
    }

11.Pencarian data rujukan dari rumah sakit berdasarkan nomor kartu
Method :GET
Parameter : Nomor kartu
REsponse :
{
"metaData": {
"code": "200",
"message": "OK"
},
"response": {
"rujukan": {
"diagnosa": {
"kode": "I21.9",
"nama": "Acute myocardial infarction, unspecified"
},
"keluhan": "",
"noKunjungan": "0304R0050217A000079",
"pelayanan": {
"kode": "1",
"nama": "Rawat Inap"
},
"peserta": {
"cob": {
"nmAsuransi": null,
"noAsuransi": null,
"tglTAT": null,
"tglTMT": null
},
"hakKelas": {
"keterangan": "KELAS III",
"kode": "3"
},
"informasi": {
"dinsos": null,
"noSKTM": null,
"prolanisPRB": null
},
"jenisPeserta": {
"keterangan": "PBI (APBN)",
"kode": "21"
},
"mr": {
"noMR": "971430",
"noTelepon": null
},
"nama": "MUHAMMAD JUSAR",
"nik": "1106081301530001",
"noKartu": "0105986780439",
"pisa": "1",
"provUmum": {
"kdProvider": "03050301",
"nmProvider": "BASO"
},
"sex": "L",
"statusPeserta": {
"keterangan": "AKTIF",
"kode": "0"
},
"tglCetakKartu": "2017-11-13",
"tglLahir": "1953-07-01",
"tglTAT": "2053-07-01",
"tglTMT": "2013-01-01",
"umur": {
"umurSaatPelayanan": "63 tahun ,7 bulan ,23 hari",
"umurSekarang": "64 tahun ,4 bulan ,12 hari"
}
},
"poliRujukan": {
"kode": "",
"nama": ""
},
"provPerujuk": {
"kode": "0304R005",
"nama": "RSI IBNU SINA"
},
"tglKunjungan": "2017-02-24"
}
}
}

12. Fungsi : Pencarian data rujukan dari rumah sakit berdasarkan nomor kartu
    Method : GET
    Parameter : Nomor kartu
    response :
    {
    "metaData": {
    "code": "200",
    "message": "OK"
    },
    "response": {
    "rujukan":
    [
    {
    "diagnosa": {
    "kode": "I21.9",
    "nama": "Acute myocardial infarction, unspecified"
    },
    "keluhan": "",
    "noKunjungan": "0304R0050217A000079",
    "pelayanan": {
    "kode": "1",
    "nama": "Rawat Inap"
    },
    "peserta": {
    "cob": {
    "nmAsuransi": null,
    "noAsuransi": null,
    "tglTAT": null,
    "tglTMT": null
    },
    "hakKelas": {
    "keterangan": "KELAS III",
    "kode": "3"
    },
    "informasi": {
    "dinsos": null,
    "noSKTM": null,
    "prolanisPRB": null
    },
    "jenisPeserta": {
    "keterangan": "PBI (APBN)",
    "kode": "21"
    },
    "mr": {
    "noMR": "971430",
    "noTelepon": null
    },
    "nama": "MUHAMMAD JUSAR",
    "nik": "1106081301530001",
    "noKartu": "0105986780439",
    "pisa": "1",
    "provUmum": {
    "kdProvider": "03050301",
    "nmProvider": "BASO"
    },
    "sex": "L",
    "statusPeserta": {
    "keterangan": "AKTIF",
    "kode": "0"
    },
    "tglCetakKartu": "2017-11-13",
    "tglLahir": "1953-07-01",
    "tglTAT": "2053-07-01",
    "tglTMT": "2013-01-01",
    "umur": {
    "umurSaatPelayanan": "63 tahun ,7 bulan ,23 hari",
    "umurSekarang": "64 tahun ,4 bulan ,12 hari"
    }
    },
    "poliRujukan": {
    "kode": "",
    "nama": ""
    },
    "provPerujuk": {
    "kode": "0304R005",
    "nama": "RSI IBNU SINA"
    },
    "tglKunjungan": "2017-02-24"
    }
    ]
    }
    }
