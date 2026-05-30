Api contracts
JKN

1. getToken :
   Method : GET
   Format : Json
   Header :
   x-username: {user akses}
   x-password: {password akses}

Response :  
{
"response": {
"token": "1231242353534645645"
},
"metadata": {
"message": "Ok",
"code": 200
}
}

2. Status Atrian
   Method : POST
   Format : Json
   Header :
   x-token: {token}
   x-username: {user akses}
   Request payload :
   {
   "kodepoli": "{memakai kode subspesialis BPJS}",
   "kodedokter": {kode dokter BPJS},
   "tanggalperiksa": "{tanggal rencana berobat}",
   "jampraktek": "{waktu praktek dokter yang diambil dari Aplikasi HFIS}"
   }  
   contoh penggunaan:
   {
   "kodepoli": "ANA",
   "kodedokter": 12346,
   "tanggalperiksa": "2020-01-28",
   "jampraktek": "08:00-16:00"
   }
   REsponse :
   {
   "response": {
   "namapoli": "Anak",
   "namadokter": "Dr. Hendra",
   "totalantrean": 25,
   "sisaantrean": 4,
   "antreanpanggil": "A-21",
   "sisakuotajkn": 5,
   "kuotajkn": 30,
   "sisakuotanonjkn": 5,
   "kuotanonjkn": 30,
   "keterangan": ""
   },
   "metadata": {
   "message": "Ok",
   "code": 200
   }
   }
   Catatan:
   Metadata code:
   200: Sukses
   201: Gagal
   Selain metadata code 200, agar message pada metadata diisi sesuai dengan kondisi di lapangan

3.Ambil Antrean
Method : POST
Format : Json
Header :
x-token: {token}
x-username: {user akses}
Request payload :
{
"nomorkartu": "{noka pasien BPJS,diisi kosong jika NON JKN}",
"nik": "{nika pasien}",
"nohp": "{no hp pasien}",
"kodepoli": "{memakai kode subspesialis BPJS}",
"norm": "{no rekam medis pasien}",
"tanggalperiksa": "{tanggal periksa}",
"kodedokter": {kode dokter BPJS},
"jampraktek": "{jam praktek dokter}",
"jeniskunjungan": {1 (Rujukan FKTP), 2 (Rujukan Internal), 3 (Kontrol), 4 (Rujukan Antar RS)},
"nomorreferensi": "{norujukan/kontrol pasien JKN,diisi kosong jika NON JKN}"
}  
contoh penggunaan:
{
"nomorkartu": "00012345678",
"nik": "3212345678987654",
"nohp": "085635228888",
"kodepoli": "ANA",
"norm": "123345",
"tanggalperiksa": "2021-01-28",
"kodedokter": 12345,
"jampraktek": "08:00-16:00",
"jeniskunjungan": 1,
"nomorreferensi": "0001R0040116A000001"
}

response :
{
"response": {
"nomorantrean": "A-12",
"angkaantrean": 12,
"kodebooking": "16032021A001",
"norm": "123345",
"namapoli": "Anak",
"namadokter": "Dr. Hendra",
"estimasidilayani": 1615869169000,
"sisakuotajkn": 5,
"kuotajkn": 30,
"sisakuotanonjkn": 5,
"kuotanonjkn": 30,
"keterangan": "Peserta harap 60 menit lebih awal guna pencatatan administrasi."
},
"metadata": {
"message": "Ok",
"code": 200
}
}

Catatan:
estimasidilayani : format dalam milisecond
Metadata code:
200: Sukses
201: Gagal
202: Pasien Baru
Ketika RS merespon code 202, mobile JKN akan mengirimkan data pasien baru (hit WS Info Pasien Baru).

4. Sisa Antrean
   Method : POST
   Format : Json
   Header :
   x-token: {token}
   x-username: {user akses}
   Request payload :
   {
   "kodebooking": "{kodebooking yang unik yang diambil dari WS Ambil Antrean}"
   }
   contoh penggunaan:
   {
   "kodebooking": "16032021A001"
   }
   response :
   {
   "response": {
   "nomorantrean": "A20",
   "namapoli": "Anak",
   "namadokter": "Dr. Hendra",
   "sisaantrean": 12,
   "antreanpanggil": "A-8",
   "waktutunggu": 9000,
   "keterangan": ""
   },
   "metadata": {
   "message": "Ok",
   "code": 200
   }
   }
   Catatan:

- Format waktu dalam detik dengan formula: SPM \* (sisa antrean-1)
- Metadata code:
  200: Sukses
  201: Gagal
  Selain metadata code 200, agar message pada metadata diisi sesuai dengan kondisi di lapangan

5. Batal Antrean
   Method : POST
   Format : Json
   Header :
   x-token: {token}
   x-username: {user akses}
   request payload :
   {
   "kodebooking": "{kodebooking yang didapat dari WS Ambil Antrean}",
   "keterangan": "{alasan pembatalan}"
   }  
   contoh penggunaan:  
   {
   "kodebooking": "16032021A001",
   "keterangan": "Ada kebutuhan mendadak"
   }

response :
{
"metadata": {
"message": "Ok",
"code": 200
}
}
Catatan:

- Format waktu dalam detik dengan formula: SPM \* (sisa antrean-1)
- Metadata code:
  200: Sukses
  201: Gagal
  Selain metadata code 200, agar message pada metadata diisi sesuai dengan kondisi di lapangan

6. Check in
   Method : POST
   Format : Json
   Header :
   x-token: {token}
   x-username: {user akses}
   request payload:
   {
   "kodebooking": "{kodebooking yang didapat dari WS Ambil Antren}",
   "waktu": {waktu pasien checkin format timestamp dalam milisecond}
   }  
    contoh penggunaan :  
   {
   "kodebooking": "16032021A001",
   "waktu": 1616559330000
   }
   response :
   "metadata": {
   "code": 200,
   "message": "OK"
   }
   Catatan:
   Metadata code:
   200: Sukses
   201: Gagal
   Selain metadata code 200, agar message pada metadata diisi sesuai dengan kondisi di lapangan.

7. Pasien Baru
   Method : POST
   Format : Json
   Header :
   x-token: {token}
   x-username: {user akses}
   request payload :
   {
   "nomorkartu": "{no kartu pasien JKN}",
   "nik": "{nika pasien}",
   "nomorkk": "{no kk pasien}",
   "nama": "{nama pasien}",
   "jeniskelamin": "{jenis kelamin pasien",
   "tanggallahir": "{tanggal lahir pasien}",
   "nohp": "{no hp pasien}",
   "alamat": "{alamat pasien}",
   "kodeprop": "{kode propinsi BPJS}",
   "namaprop": "{nama propinsi}",
   "kodedati2": "{kode kota/kab BPJS}",
   "namadati2": "{nama kota/kab}",
   "kodekec": "{kode kecamatan BPJS}",
   "namakec": "{nama kecamatan}",
   "kodekel": "{kode kelurahan BPJS}",
   "namakel": "{nama kelurahan}",
   "rw": "{no RT}",
   "rt": "{no RW}"
   }
   contoh penggunaan :
   {
   "nomorkartu": "00012345678",
   "nik": "3212345678987654",
   "nomorkk": "3212345678987654",
   "nama": "sumarsono",
   "jeniskelamin": "L",
   "tanggallahir": "1985-03-01",
   "nohp": "085635228888",
   "alamat": "alamat yang muncul merupakan alamat lengkap",
   "kodeprop": "11",
   "namaprop": "Jawa Barat",
   "kodedati2": "0120",
   "namadati2": "Kab. Bandung",
   "kodekec": "1319",
   "namakec": "Soreang",
   "kodekel": "D2105",
   "namakel": "Cingcin",
   "rw": "001",
   "rt": "013"
   }

response :
{
"response": {
"norm": "123456"
},
"metadata": {
"message": "Harap datang ke admisi untuk melengkapi data rekam medis",
"code": 200
}
}

Catatan:
Metadata code:
200: Sukses
201: Gagal
Selain metadata code 200, agar message pada metadata diisi sesuai dengan kondisi di lapangan.

8.Jadwal Operasi RS
Method : POST
Format : Json
Header :
x-token: {token}
x-username: {user akses}
request payload :  
{
"tanggalawal": "{tanggal awal pencarian}",
"tanggalakhir": "{tanggal akhir pencarian}"
}
contoh penggunaan :
{
"tanggalawal": "2019-12-11",
"tanggalakhir": "2019-12-13"
}

response :
{
"response": {
"list" : [{
"kodebooking": "123456ZXC",
"tanggaloperasi": "2019-12-11",
"jenistindakan": "operasi gigi",
"kodepoli": "001",
"namapoli": "Poli Bedah Mulut",
"terlaksana": 1,
"nopeserta": "0000000924782",
"lastupdate": 1577417743000
},
{
"kodebooking": "67890QWE",
"tanggaloperasi": "2019-12-11",
"jenistindakan": "operasi mulut",
"kodepoli": "001",
"namapoli": "Poli Bedah Mulut",
"terlaksana": 0,
"nopeserta": "",
"lastupdate": 1577417743000
}]
},
"metadata": {
"message": "Ok",
"code": 200
}
}

Catatan:

- Kode poli memakai kode subspesialis BPJS
- Metadata code:
  200: Sukses
  201: Gagal
  Selain metadata code 200, agar message pada metadata diisi sesuai dengan kondisi di lapangan.

9. Jadwal Operasi Pasien
   Method : POST
   Format : Json
   Header :
   x-token: {token}
   x-username: {user akses}
   request payload:
   {
   "nopeserta": "{no kartu pasien JKN}"
   }  
   contoh penggunaan :
   {
   "nopeserta": "0000000000123"
   }
   response:
   {
   "response": {
   "list" : [{
   "kodebooking": "123456ZXC",
   "tanggaloperasi": "2019-12-11",
   "jenistindakan": "operasi gigi",
   "kodepoli": "001",
   "namapoli": "Poli Bedah Mulut",
   "terlaksana": 0
   }]
   },
   "metadata": {
   "message": "Ok",
   "code": 200
   }
   }
   Catatan:

- Kode poli memakai kode subspesialis BPJS
- Metadata code:
  200: Sukses
  201: Gagal
  Selain metadata code 200, agar message pada metadata diisi sesuai dengan kondisi di lapangan.

10. Ambil antrean farmasi
    Method : POST
    Format : Json
    Header :
    x-token: {token}
    x-username: {user akses}
    request payload:  
    {
    "kodebooking": "00012345678"
    }
    response:
    {
    "response": {
    "jenisresep": "Racikan/Non Racikan",
    "nomorantrean": 1,
    "keterangan": ""
    },
    "metadata": {
    "message": "Ok",
    "code": 200
    }
    }

11.Status Antrean Farmasi
Method : POST
Format : Json
Header :
x-token: {token}
x-username: {user akses}
request payload:
{
"kodebooking": "00012345678"
}
response :
{
"response": {
"jenisresep": "Racikan/Non Racikan",
"totalantrean": 10,
"sisaantrean": 8,
"antreanpanggil": 2,
"keterangan": ""
},
"metadata": {
"message": "Ok",
"code": 200
}
}
