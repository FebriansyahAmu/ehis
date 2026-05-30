1. {Base URL}/aplicaresws/rest/ref/kelas
   Fungsi : Referensi Kamar
   Method : GET
   Format : Json
   Content-Type: application/json
   response :
   {"metadata":
   {"code":1,
   "message":"OK",
   "totalitems":16
   },
   "response":
   {"list":
   [{"kodekelas":"NON","namakelas":"-"},{"kodekelas":"VVP","namakelas":"VVIP"}]
   }
   }

2. {Base URL}/aplicaresws/rest/bed/update/{kodeppk}
   Fungsi : Update Ketersediaan Tempat Tidur
   Method : POST
   Format : Json
   Content-Type: application/json
   Parameter
   kodekelas: kode kelas ruang rawat sesuai dengan mapping BPJS Kesehatan
   koderuang: kode ruangan Rumah Sakit
   namaruang: nama ruang rawat Rumah Sakit
   kapasitas: Kapasitas ruang Rumah Sakit
   tersedia: Jumlah tempat tidur yang kosong / dapat ditempati pasien baru

- Untuk Rumah Sakit yang ingin mencantumkan informasi ketersediaan tempat tidur untuk pasien laki – laki, perempuan, laki – laki atau perempuan
  tersediapria : Jumlah tempat tidur yang kosong / dapat ditempati pasien baru laki – laki
  Tersediawanita : Jumlah tempat tidur yang kosong / dapat ditempati pasien baru perempuan
  tersediapriawanita : Jumlah tempat tidur yang kosong / dapat ditempati pasien baru laki – laki atau perempuan
  response :
  {
  "kodekelas":"VIP",
  "koderuang":"RG01",
  "namaruang":"Ruang Anggrek VIP",
  "kapasitas":"20",
  "tersedia":"10",
  "tersediapria":"0",
  "tersediawanita":"0",
  "tersediapriawanita":"0"
  }

3. {Base URL}/aplicaresws/rest/bed/create/{kodeppk}
   Fungsi : Insert Ruangan Baru
   Method : POST
   Format : Json
   Content-Type: application/json
   Parameter :
   kodekelas: kode kelas ruang rawat sesuai dengan mapping BPJS Kesehatan
   koderuang: kode ruangan Rumah Sakit
   namaruang: nama ruang rawat Rumah Sakit
   kapasitas: Kapasitas ruang Rumah Sakit
   tersedia: Jumlah tempat tidur yang kosong / dapat ditempati pasien baru

- Untuk Rumah Sakit yang ingin mencantumkan informasi ketersediaan tempat tidur untuk pasien laki – laki, perempuan, laki – laki atau perempuan
  tersediapria : Jumlah tempat tidur yang kosong / dapat ditempati pasien baru laki – laki
  Tersediawanita : Jumlah tempat tidur yang kosong / dapat ditempati pasien baru perempuan
  tersediapriawanita : Jumlah tempat tidur yang kosong / dapat ditempati pasien baru laki – laki atau perempuan
  response :
  { "kodekelas":"VIP",
  "koderuang":"RG01",
  "namaruang":"Ruang Anggrek VIP",
  "kapasitas":"20",
  "tersedia":"10",
  "tersediapria":"0",
  "tersediawanita":"0",
  "tersediapriawanita":"0"
  }

4. {Base URL}/aplicaresws/rest/bed/read/{kodeppk}/{start}/{limit}
   Fungsi : Melihat Data Ketersediaan Kamar RS
   Method : GET
   Format : Json
   Accept: application/json
   Parameter : nama atau kode faskes
   Start dan limit berfungsi untuk paging, jika Rumah Sakit ingin menampilkan data dari baris pertama sampai baris kesepuluh maka start = 1 dan limit = 1, nilai start dimulai dari 1

5. {Base URL}/aplicaresws/rest/bed/delete/{kodeppk}
   Fungsi : Hapus Ruangan
   Method : POST
   Format : Json
   Content-Type: application/json
   Parameter :
   kodekelas: kode kelas ruang rawat sesuai dengan mapping BPJS Kesehatan
   koderuang: kode ruangan Rumah Sakit
   response :

{ "kodekelas":"VIP",
"koderuang":"RG01"
}
