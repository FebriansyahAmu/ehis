1. INSERT SEP PAYLOAD:
   {
   "request":{
   "t_sep":{
   "noKartu":"{nokartu BPJS}",
   "tglSep":"{tanggal penerbitan sep format yyyy-mm-dd}",
   "ppkPelayanan":"{kode faskes pemberi pelayanan}",
   "jnsPelayanan":"{jenis pelayanan = 1. r.inap 2. r.jalan}",
   "klsRawat":{
   "klsRawatHak":"{sesuai kelas rawat peserta, 1. Kelas 1, 2. Kelas 2, 3. Kelas 3}",
   "klsRawatNaik":"{diisi jika naik kelas rawat, 1. VVIP, 2. VIP, 3. Kelas 1, 4. Kelas 2, 5. Kelas 3, 6. ICCU, 7. ICU, 8. Diatas Kelas 1}",
   "pembiayaan":"{1. Pribadi, 2. Pemberi Kerja, 3. Asuransi Kesehatan Tambahan. diisi jika naik kelas rawat}",
   "penanggungJawab":"{Contoh: jika pembiayaan 1 maka penanggungJawab=Pribadi. diisi jika naik kelas rawat}"
   },
   "noMR":"{nomor medical record RS}",
   "rujukan":{
   "asalRujukan":"{asal rujukan ->1.Faskes 1, 2. Faskes 2(RS)}",
   "tglRujukan":"{tanggal rujukan format: yyyy-mm-dd}",
   "noRujukan":"{nomor rujukan}",
   "ppkRujukan":"{kode faskes rujukam -> baca di referensi faskes}"
   },
   "catatan":"{catatan peserta}",
   "diagAwal":"{diagnosa awal ICD10 -> baca di referensi diagnosa}",
   "poli":{
   "tujuan":"{kode poli -> baca di referensi poli}",
   "eksekutif":"{poli eksekutif -> 0. Tidak 1.Ya}""
   },
   "cob":{
   "cob":"{cob -> 0.Tidak 1. Ya}"
   },
   "katarak":{
   "katarak":"{katarak --> 0.Tidak 1.Ya}"
   },
   "jaminan":{
   "lakaLantas":" 0 : Bukan Kecelakaan lalu lintas [BKLL], 1 : KLL dan bukan kecelakaan Kerja [BKK], 2 : KLL dan KK, 3 : KK",
   "noLP":"{No. LP}",
   "penjamin":{
   "tglKejadian":"{tanggal kejadian KLL format: yyyy-mm-dd}",
   "keterangan":"{Keterangan Kejadian KLL}",
   "suplesi":{
   "suplesi":"{Suplesi --> 0.Tidak 1. Ya}",
   "noSepSuplesi":"{No.SEP yang Jika Terdapat Suplesi}",
   "lokasiLaka":{
   "kdPropinsi":"{Kode Propinsi}",
   "kdKabupaten":"{Kode Kabupaten}",
   "kdKecamatan":"{Kode Kecamatan}"
   }
   }
   }
   },
   "tujuanKunj":{"0": Normal,
   "1": Prosedur,
   "2": Konsul Dokter},
   "flagProcedure":{"0": Prosedur Tidak Berkelanjutan,
   "1": Prosedur dan Terapi Berkelanjutan} ==> diisi "" jika tujuanKunj = "0",
   "kdPenunjang":{"1": Radioterapi,
   "2": Kemoterapi,
   "3": Rehabilitasi Medik,
   "4": Rehabilitasi Psikososial,
   "5": Transfusi Darah,
   "6": Pelayanan Gigi,
   "7": Laboratorium,
   "8": USG,
   "9": Farmasi,
   "10": Lain-Lain,
   "11": MRI,
   "12": HEMODIALISA} ==> diisi "" jika tujuanKunj = "0",
   "assesmentPel":{"1": Poli spesialis tidak tersedia pada hari sebelumnya,
   "2": Jam Poli telah berakhir pada hari sebelumnya,
   "3": Dokter Spesialis yang dimaksud tidak praktek pada hari sebelumnya,
   "4": Atas Instruksi RS} ==> diisi jika tujuanKunj = "2" atau "0" (politujuan beda dengan poli rujukan dan hari beda),
   "5": Tujuan Kontrol,
   "skdp":{
   "noSurat":"{Nomor Surat Kontrol}",
   "kodeDPJP":"{kode dokter DPJP --> baca di referensi dokter DPJP}"
   },
   "dpjpLayan":"000002", (tidak diisi jika jnsPelayanan = "1" (RANAP),
   "noTelp":"{nomor telepon}",
   "user":"{user pembuat SEP}"
   }
   }
   }

2. UPDATE SEP PAYLOAD :
   {
   "request": {
   "t_sep": {
   "noSep": "{nomor sep}",
   "klsRawat":{
   "klsRawatHak":"3",
   "klsRawatNaik":"",
   "pembiayaan":"",
   "penanggungJawab":""
   },
   "noMR": "{nomor medical record RS}",
   "catatan": "{catatan peserta}",
   "diagAwal": "{diagnosa awal ICD10 -> baca di referensi diagnosa}",
   "poli": {
   "tujuan": "IGD",
   "eksekutif": "{poli eksekutif -> 0. Tidak 1.Ya}"
   },
   "cob": {
   "cob": "{cob -> 0.Tidak 1. Ya}"
   },
   "katarak": {
   "katarak": "{katarak --> 0.Tidak 1.Ya}"
   },
   "jaminan": {
   "lakaLantas":" 0 : Bukan Kecelakaan lalu lintas [BKLL], 1 : KLL dan bukan kecelakaan Kerja [BKK], 2 : KLL dan KK, 3 : KK",
   "penjamin": {
   "tglKejadian": "{tgl kejadian KLL (yyyy-mm-dd)}",
   "keterangan": "{keterangan kejadian}",
   "suplesi": {
   "suplesi": "0",
   "noSepSuplesi": "{no SEP suplesi --> diambil dari Potensi Suplesi Jasa Raharja}",
   "lokasiLaka": {
   "kdPropinsi": "{kode propinsi}",
   "kdKabupaten": "{kode kabupaten}",
   "kdKecamatan": "{kode kecamatan}"
   }
   }
   }
   },
   "dpjpLayan":"46",
   "noTelp": "{nomor telepon peserta/pasien}",
   "user": "{user pembuat SEP}"
   }
   }
   }

3. DELETE SEP PAYLOAD :
   {
   "request": {
   "t_sep": {
   "noSep": "{nomor SEP}",
   "user": "{user pengguna SEP}"
   }
   }
   }

Potensi Suplesi Jasa Raharja

1.  SUPLESI JASA RAHARJA PAYLOAD :
    Method : GET
    Parameter 1 : No.Kartu Peserta
    Parameter 2 : Tgl.Pelayanan/SEP (yyyy-mm-dd)

        {
            "metaData":
                {
                    "code": "200",
                    "message": "Sukses"
                },
            "response":
                {
                "jaminan":
                    [
                        {
                            "noRegister": "1234",
                            "noSep": "0301R0110818V000008",
                            "noSepAwal": "0301R0110818V000008",
                            "noSuratJaminan": "-",
                            "tglKejadian": "2018-08-06",
                            "tglSep": "2018-08-08"
                        },
                                        {
                            "noRegister": "44222",
                            "noSep": "0301R0110818V000018",
                            "noSepAwal": "0301R0110818V000008",
                            "noSuratJaminan": "-",
                            "tglKejadian": "2018-08-06",
                            "tglSep": "2018-08-08"
                        }
                    ],
                }
        }

2.  DATA INDUK KECELAKAAN PAYLOAD :

Method : GET
Parameter 1 : No.Kartu Peserta

                    {
                        "metaData": {
                            "code": "200",
                            "message": "Ok"
                        },
                        "response": {
                            "list": [
                                {
                                    "noSEP": "0301R0110421V000439",
                                    "tglKejadian": "2021-04-16",
                                    "ppkPelSEP": "0301R011",
                                    "kdProp": "14",
                                    "kdKab": "0200",
                                    "kdKec": "6122",
                                    "ketKejadian": "kll",
                                    "noSEPSuplesi": "0301R0110421V000435, 0301R0110421V000436, 0301R0110421V000437, 0301R0110421V000438"
                                },
                                {
                                    "noSEP": "1111R0010421V001672",
                                    "tglKejadian": "2021-04-14",
                                    "ppkPelSEP": "1111R001",
                                    "kdProp": "10",
                                    "kdKab": "0115",
                                    "kdKec": "1192",
                                    "ketKejadian": "KLL",
                                    "noSEPSuplesi": null
                                }
                            ]
                        }
                    }

3. Approval Penjamin

PENGAJUAN SEP PAYLOAD :
{
"request": {
"t_sep": {
"noKartu": "{nomor kartu BPJS}",
"tglSep": "{tanggal penerbitan sep format yyyy-mm-dd}",
"jnsPelayanan": "{}jenis pelayanan (1.R.Inap 2.R.Jalan)}",
"jnsPengajuan": "{}jenis pengajuan (1. pengajuan backdate, 2. pengajuan finger print)}"
"keterangan": "{keterangan}",
"user": "{user pemakai}"
}
}

4. LIST DATA PERSETUJUAN SEP :
   GET DATA :
   Parameter 1: Bulan (1-12)
   Parameter 2: Tahun

Response :
{
"metaData": {
"code": "200",
"message": "Sukses"
},
"response": {
"list": [
{
"noKartu": "0002039003212",
"nama": "MARTA SENTANA",
"tglsep": "2021-11-23",
"jnspelayanan": "RJ",
"persetujuan": "Pengajuan",
"status": "Tgl.SEP Backdate"
}
]
}
}

5. UPDATE TANGGAL PULANG
   METHOD: PUT
   {
   "request":{
   "t_sep":{
   "noSep": "{nosep}",
   "statusPulang":"{1:Atas Persetujuan Dokter, 3:Atas Permintaan Sendiri, 4:Meninggal, 5:Lain-lain}",
   "noSuratMeninggal":"{diisi jika statusPulang 4, selain itu kosong}",
   "tglMeninggal":"{diisi jika statusPulang 4, selain itu kosong. format yyyy-MM-dd}",
   "tglPulang":"{format yyyy-MM-dd}",
   "noLPManual":"{diisi jika SEPnya adalah KLL}",
   "user":"{user}"
   }
   }
   }

6. LIST DATA UPDATE TANGGAL PULANG
   Method : GET
   Parameter 1: Bulan (1-12)
   Parameter 2: Tahun
   Parameter 3: Filter (Apabila dikosongkan akan menampilkan semua data pada bulan dan tahun pilihan)

Response:
{
"metaData": {
"code": "200",
"message": "Sukses"
},
"response": {
"list": [
{
"noSep": "0138R0221221V000032",
"noSepUpdating": "0112R0761221V000014",
"jnsPelayanan": "1",
"ppkTujuan": "0138R022",
"noKartu": "0002047251712",
"nama": "SURIP",
"tglSep": "2021-12-13",
"tglPulang": "2021-12-15",
"status": "",
"tglMeninggal": "",
"noSurat": "",
"keterangan": "3.1.Peserta NoKa 0002047251712 telah mendapat Pelayanan R.Inap pada tgl. 13/12/2021 dan belum dipulangkan di RS CITRA MEDIKA DEPOK Dgn No.SEP 0138R0221221V000032",
"user": "AdminUtam"
}
]
}
}

7. Integrasi SEP dengan Inacbgs
   GET
   Parameter: Nomor SEP
   {
   "metaData": {
   "code": "200",
   "message": "OK"
   },
   "response": {
   "pesertasep": {
   "kelamin": "P",
   "klsRawat": "3",
   "nama": "ANNA MIKRAD BA.",
   "noKartuBpjs": "0000001112958",
   "noMr": "0",
   "noRujukan": "222",
   "tglLahir": "1960-01-26",
   "tglPelayanan": "2016-09-22",
   "tktPelayanan": "2"
   }
   }
   }

8. DATA SEP INTERNAL
   GET
   Parameter : No SEP
   Response :
   {
   "metaData": {
   "code": "200",
   "message": "OK"
   },
   "response": {
   "count": "3",
   "list": [
   {
   "tujuanrujuk": "SAR",
   "nmtujuanrujuk": "SARAF",
   "nmpoliasal": "PENYAKIT DALAM",
   "tglrujukinternal": "2020-11-19",
   "nosep": "0905R0031020V000397",
   "nosepref": "0905R0031120V004160",
   "ppkpelsep": "0905R003",
   "nokapst": "0000038761391",
   "tglsep": "2020-10-02",
   "nosurat": "0905R0031120N000922",
   "flaginternal": "0",
   "kdpoliasal": "0000038761391",
   "kdpolituj": "SAR",
   "kdpenunjang": "0",
   "nmpenunjang": null,
   "diagppk": "I15",
   "kddokter": "24271",
   "nmdokter": "dr. Nurhayana Lubis, Sp.S",
   "flagprosedur": null,
   "opsikonsul": "1",
   "flagsep": "False",
   "fuser": "0905R003_anhar",
   "fdate": "2020-11-19",
   "nmdiag": "Secondary hypertension"
   },
   {
   "tujuanrujuk": "SAR",
   "nmtujuanrujuk": "SARAF",
   "nmpoliasal": "PENYAKIT DALAM",
   "tglrujukinternal": "2020-10-20",
   "nosep": "0905R0031020V000397",
   "nosepref": "0905R0031020V003695",
   "ppkpelsep": "0905R003",
   "nokapst": "0000038761391",
   "tglsep": "2020-10-02",
   "nosurat": "0905R0031020N000912",
   "flaginternal": "0",
   "kdpoliasal": "0000038761391",
   "kdpolituj": "SAR",
   "kdpenunjang": "0",
   "nmpenunjang": null,
   "diagppk": "I15",
   "kddokter": "24271",
   "nmdokter": "dr. Nurhayana Lubis, Sp.S",
   "flagprosedur": null,
   "opsikonsul": "1",
   "flagsep": "False",
   "fuser": "0905R003_ema",
   "fdate": "2020-10-20",
   "nmdiag": "Secondary hypertension"
   },
   {
   "tujuanrujuk": "SAR",
   "nmtujuanrujuk": "SARAF",
   "nmpoliasal": "PENYAKIT DALAM",
   "tglrujukinternal": "2020-10-06",
   "nosep": "0905R0031020V000397",
   "nosepref": "0905R0031020V000874",
   "ppkpelsep": "0905R003",
   "nokapst": "0000038761391",
   "tglsep": "2020-10-02",
   "nosurat": "0905R0031020N000230",
   "flaginternal": "0",
   "kdpoliasal": "0000038761391",
   "kdpolituj": "SAR",
   "kdpenunjang": "0",
   "nmpenunjang": null,
   "diagppk": "I15",
   "kddokter": "24271",
   "nmdokter": "dr. Nurhayana Lubis, Sp.S",
   "flagprosedur": null,
   "opsikonsul": "1",
   "flagsep": "False",
   "fuser": "0905R003_ema",
   "fdate": "2020-10-06",
   "nmdiag": "Secondary hypertension"
   }
   ]
   }
   }

9. HAPUS SEP INTERNAL
   method DELETE
   {
   "request": {
   "t_sep": {
   "noSep": "{nosep}",
   "noSurat": "{nosurat}",
   "tglRujukanInternal": "{tglRujukanInternal, format : yyyy-MM-dd",
   "kdPoliTuj": "{kdPoli, 3 digit}",
   "user": "{user}"
   }
   }
   }

10. GET Finger Print
    Method GET
    Parameter1: Nomor Kartu Peserta
    Parameter2: Tanggal Pelayanan
    Response:
    Jika telah dilakukan validasi fingerprint:
    {
    "metaData": {
    "code": "200",
    "message": "Ok"
    },
    "response": {
    "kode": "1",
    "status": "Peserta telah melakukan validasi finger print pada tanggal 2020-01-21"
    }
    }

Jika belum dilakukan validasi fingerprint:
{
"metaData": {
"code": "200",
"message": "Ok"
},
"response": {
"kode": "0",
"status": "Peserta belum melakukan validasi finger print"
}
}

12. Get List FingerPRint
    Method :GET
    Parameter: Tanggal Pelayanan
    {
    "metaData": {
    "code": "200",
    "message": "Ok"
    },
    "response": {
    "list": [
    {
    "noKartu": "0001244842648",
    "noSEP": "0301R0110120V009210"
    },
    {
    "noKartu": "0001244856813",
    "noSEP": "0301R0110120V009041"
    },
    {
    "noKartu": "0001244957229",
    "noSEP": "0301R0110120V009213"
    }
    ]
    }
    }

13.RANDOM QUESTION
Method : GET
Parameter1: Nomor Kartu Peserta
Parameter2: Tanggal Pelayanan
RESPONSE :
{
"metaData": {
"code": "200",
"message": "Ok"
},
"response": {
"faskes": [
{
"kode": "0177B030",
"nama": "Klinik Citra Madina"
},
{
"kode": "21061801",
"nama": "DAMAU"
},
{
"kode": "01031201",
"nama": "PEUKAN BADA"
}
]
}
} 14. POST RANDOM ANSWER
{
"request": {
"t_sep": {
"noKartu": "{nomor kartu}",
"tglSep": "{tanggal SEP}",
"jenPel":"{jenis pelayanan}",
"ppkPelSep": "{ppk pelayanan}",
"tglLahir": "{tgl lahir}",
"ppkPst": "{ppk peserta}",
"user": "{user}"
}
}
}
