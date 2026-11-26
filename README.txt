ADZZ Restaurant - UTS Pemrograman Internet
Designed & Developed by MuadzMuttaqin

CARA MEMAKAI
1. Ekstrak zip ini. Buka index.html dengan browser (klik dua kali).
2. Salin foto Anda ke folder images/ dan timpa file placeholder yang namanya sama
   (Windows akan bertanya "Replace the files": pilih Replace). Semua nama sudah sesuai
   daftar foto Anda, format .jpg.
3. Koneksi internet hanya dipakai untuk Google Fonts dan peta di contact.html.

DAFTAR GAMBAR YANG DIPAKAI (images/)
hero-1, hero-2, hero-3          Home (hero 3D: foto utama + dua foto bulat melayang)
cta-reservasi                   Latar ajakan reservasi (Home) dan header halaman Reservasi
about-resto, about-chef         About; juga dipakai di Gallery
menu-steak, menu-salmon, menu-rendang, menu-salad, menu-sup, menu-bruschetta,
menu-tiramisu, menu-pannacotta, menu-lava, menu-mocktail, menu-kopi, menu-lemontea
                                Kartu menu (12 hidangan); steak, salmon, lava juga di Signature Dishes
makanan-1 sampai makanan-4      Gallery
interior-1 sampai interior-4    Gallery

MENGGANTI DATA DUMMY
- Nama/deskripsi/harga menu : menu.html (atribut data-name dan data-price pada tiap kartu juga harus sama)
- Alamat, telepon, email    : footer di semua halaman dan contact.html
- Peta                      : contact.html, ganti src iframe dengan kode embed Google Maps
- Warna                     : variabel di :root pada css/style.css

MASKOT ADZZ CHEF
- Spritesheet: images/mascot/chef-welcome.png (8 frame sejajar, tiap frame 280 x 383 px, PNG transparan)
- Kode: elemen <aside class="muadzmuttaqin_mascot"> di tiap halaman, gaya di css/style.css bagian 20,
  animasi di js/script.js bagian 14 (initMascot).
- Ganti isi balon ucapan: edit teks di <p class="muadzmuttaqin_mascot-text"> pada tiap halaman.
- Animasi baru (DANCE, RECOMMEND, dst.): simpan spritesheet baru di images/mascot/ dengan frame sejajar,
  lalu ubah nama file di CSS (.muadzmuttaqin_mascot-sprite) dan konstanta FRAMES di JS.
