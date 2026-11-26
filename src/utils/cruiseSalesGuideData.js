/**
 * Curated Cruise Sales Guide Reference Data & Default Seed Catalog.
 * Used as rich Day-1 operational reference + fallback & seed source for `travelops_cruise_guides`.
 */
import { COMPLETE_FLEETS_BY_BRAND } from './cruiseFleetCatalog.js';

export const CLIENT_PROFILES = [
  {
    id: 'family',
    label: 'Keluarga & Anak',
    shortDesc: 'Kids club, waterpark, karakter & connecting cabin',
    color: '#2563eb'
  },
  {
    id: 'halal',
    label: 'Halal / Muslim-Friendly',
    shortDesc: 'Dapur Halal tersertifikasi atau pre-order Halal',
    color: '#059669'
  },
  {
    id: 'first-timer',
    label: 'First-Timer / Value',
    shortDesc: 'Durasi 2–4 malam dari Singapura, harga bersahabat',
    color: '#d97706'
  },
  {
    id: 'honeymoon',
    label: 'Honeymoon & Couple',
    shortDesc: 'Romantis, kuliner premium, area dewasa tenang',
    color: '#db2777'
  },
  {
    id: 'senior',
    label: 'Lansia / Multi-Generasi',
    shortDesc: 'Kapal nyaman, tidak melelahkan, rute scenic',
    color: '#0891b2'
  },
  {
    id: 'luxury',
    label: 'Luxury & VVIP Suite',
    shortDesc: 'All-suite / VIP Club dengan butler & all-inclusive',
    color: '#7c3aed'
  }
];

export const CRUISE_REGIONS = [
  {
    id: 'singapore-sea',
    label: 'Singapura & Asia Tenggara',
    shortLabel: 'Singapura / SEA',
    bestMonths: 'Sepanjang Tahun (Peak: Jun–Jul & Nov–Jan)',
    peakMonths: [6, 7, 11, 12, 1],
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    durations: '2N – 5N (Populer: 3N & 4N)',
    homeports: 'Marina Bay Cruise Centre Singapore (MBCCS), Port Klang',
    popularPorts: 'Penang, Phuket, Melaka, Port Klang (KL), High Seas',
    popularBrands: ['Disney Cruise Line', 'StarDream / Resorts World Cruises', 'Royal Caribbean International'],
    visaAlert: 'Bebas Visa WNI untuk SG/MY/TH (wajib isi SG Arrival Card maks. H-3 sebelum tiba di Singapura).',
    weatherNotes: 'Perairan Selat Malaka umumnya sangat tenang — paling aman untuk klien yang takut mabuk laut.',
    sellingHook: 'Terbang 1,5 jam dari Jakarta, tanpa ribet visa, cocok untuk long weekend & first-timer!'
  },
  {
    id: 'japan-korea',
    label: 'Jepang & Korea Selatan',
    shortLabel: 'Jepang / Korea',
    bestMonths: 'Mar–Mei (Sakura) & Okt–Nov (Autumn)',
    peakMonths: [3, 4, 10, 11],
    activeMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    durations: '5N – 10N (Populer: 7N – 9N)',
    homeports: 'Yokohama (Tokyo), Kobe, Keelung, Shanghai',
    popularPorts: 'Shimizu (Mt. Fuji), Osaka/Kobe, Nagasaki, Kagoshima, Jeju, Busan',
    popularBrands: ['Princess Cruises', 'MSC Cruises', 'Royal Caribbean International', 'Celebrity Cruises'],
    visaAlert: 'PENTING: Rute Jepang yang singgah di Korea (Busan/Jeju) lalu kembali ke Jepang memerlukan Visa Jepang Multiple / E-Paspor Waiver & K-ETA / Visa Korea sesuai ketentuan terbaru!',
    weatherNotes: 'Sejuk & sangat indah di musim semi dan gugur; hindari puncak topan Agustus–awal September untuk tamu sensitif ombak.',
    sellingHook: 'Keliling 4–6 kota Jepang + Korea tanpa geret koper naik-turun Shinkansen dan tanpa ganti hotel!'
  },
  {
    id: 'europe-med',
    label: 'Eropa, Mediterania & Fjords',
    shortLabel: 'Eropa / Mediterania',
    bestMonths: 'Mei–Okt (Shoulder terbaik: Mei–Jun & Sep)',
    peakMonths: [6, 7, 8, 9],
    activeMonths: [4, 5, 6, 7, 8, 9, 10],
    durations: '7N – 12N (Populer: 7N)',
    homeports: 'Barcelona, Civitavecchia (Rome), Athens, Southampton, Kiel',
    popularPorts: 'Marseille, Genoa, Naples, Santorini, Mykonos, Dubrovnik, Geiranger',
    popularBrands: ['MSC Cruises', 'Royal Caribbean International', 'Celebrity Cruises', 'Norwegian Cruise Line (NCL)'],
    visaAlert: 'Wajib Visa Schengen — pastikan **Multiple Entry** bila rute singgah di negara non-Schengen (UK, Turki, Montenegro, Tunisia).',
    weatherNotes: 'Juli–Agustus sangat panas & ramai di Mediterania; Mei–Juni & September jauh lebih nyaman untuk lansia dan foto.',
    sellingHook: 'Kunjungi 3–4 negara Eropa dalam 1 minggu hanya dengan 1× bongkar koper & biaya jauh lebih hemat dari hotel darat Eropa!'
  },
  {
    id: 'alaska',
    label: 'Alaska & Glacier Bay',
    shortLabel: 'Alaska',
    bestMonths: 'Mei–Sep (Puncak: Jun–Ags)',
    peakMonths: [6, 7, 8],
    activeMonths: [5, 6, 7, 8, 9],
    durations: '7N (Roundtrip / One-Way + Land Tour)',
    homeports: 'Seattle (USA), Vancouver (Canada), Whittier / Seward',
    popularPorts: 'Juneau, Skagway, Ketchikan, Glacier Bay National Park, Victoria BC',
    popularBrands: ['Princess Cruises', 'Holland America Line', 'Celebrity Cruises', 'Norwegian Cruise Line (NCL)'],
    visaAlert: 'KRUSIAL: Rute dari Seattle umumnya singgah di Victoria (Kanada) dan rute Vancouver masuk AS — mayoritas memerlukan **Visa USA + Visa Canada**!',
    weatherNotes: 'Suhu dingin/sejuk (8–18°C), wajib bawa jaket waterproof berlapis. Kabin **Balcony** sangat disarankan untuk menikmati gletser langsung dari kamar!',
    sellingHook: 'Cara terbaik menikmati gletser raksasa & satwa liar Alaska — pemandangan spektakuler langsung dari balkon kamar!'
  },
  {
    id: 'australia-nz',
    label: 'Australia & New Zealand',
    shortLabel: 'Australia / NZ',
    bestMonths: 'Nov–Mar (Musim Panas Belahan Selatan)',
    peakMonths: [12, 1, 2],
    activeMonths: [11, 12, 1, 2, 3, 4],
    durations: '7N – 14N',
    homeports: 'Sydney, Brisbane, Melbourne, Auckland',
    popularPorts: 'Milford Sound, Doubtful Sound, Wellington, Hobart, Great Barrier Reef',
    popularBrands: ['Princess Cruises', 'Royal Caribbean International', 'Celebrity Cruises', 'Disney Cruise Line'],
    visaAlert: 'Memerlukan Visa Australia (Subkelas 600 Multiple) & Visa New Zealand bila menyambangi pelabuhan kedua negara.',
    weatherNotes: 'Laut Tasman kadang sedikit berombak — sarankan kabin Mid-Ship untuk kenyamanan maksimal.',
    sellingHook: 'Berlayar menembus Fjord Milford Sound New Zealand yang dramatis dengan cuaca musim panas yang cerah.'
  }
];

export const CABIN_CATEGORIES = [
  {
    id: 'interior',
    name: 'Interior Stateroom',
    subtitle: 'Paling Ekonomis • Tanpa Jendela Luar',
    sizeRange: '13 – 17 m²',
    priceLevel: '$',
    accent: '#64748b',
    idealFor: 'First-timer hemat budget, anak muda/aktif yang seharian eksplor fasilitas kapal, atau grup corporate.',
    pros: [
      'Harga paling terjangkau — sisa budget bisa dialihkan ke belanja, shore excursion, atau paket minuman',
      'Ruangan gelap total sehingga kualitas tidur malam sangat nyenyak',
      'Beberapa kapal modern (Royal Caribbean) menyediakan Virtual Balcony (layar HD live pemandangan laut)'
    ],
    cons: [
      'Tidak ada cahaya matahari alami atau akses udara luar langsung',
      'Terasa sempit bila ditempati 3–4 orang dewasa sekaligus'
    ],
    salesTip: 'Cocok untuk tamu yang berprinsip "kamar cuma buat tidur & mandi". Hindari merekomendasikan untuk tamu klaustrofobia.'
  },
  {
    id: 'oceanview',
    name: 'Oceanview Stateroom',
    subtitle: 'Jendela Kaca Permanen (Tidak Bisa Dibuka)',
    sizeRange: '15 – 20 m²',
    priceLevel: '$$',
    accent: '#0284c7',
    idealFor: 'Keluarga dengan balita (aman tanpa pintu balkon terbuka) atau tamu yang butuh sinar matahari alami dengan budget menengah.',
    pros: [
      'Cahaya alami & pemandangan laut membuat kamar terasa lebih lega & membantu orientasi waktu',
      'Lebih aman bagi keluarga dengan anak kecil yang sangat aktif karena kaca tertutup rapat',
      'Sering kali berada di deck lebih rendah (dekat pusat gravitasi kapal → lebih minim guncangan)'
    ],
    cons: [
      'Jendela tidak dapat dibuka untuk menghirup angin laut',
      'Selisih harga ke Balcony pada beberapa pelayaran kadang tipis — selalu cek promo upgrade!'
    ],
    salesTip: 'Cek selisih harga dengan Balcony: jika beda tipis (<15%), jauh lebih mudah meng-upsell klien langsung ke Balcony.'
  },
  {
    id: 'balcony',
    name: 'Balcony / Veranda Stateroom',
    subtitle: 'Paling Laris • Balkon Privat dengan Kursi Santai',
    sizeRange: '18 – 25 m² (+ Balkon 3–6 m²)',
    priceLevel: '$$$',
    accent: '#0d9488',
    idealFor: 'Keluarga, pasangan honeymoon, tamu lansia, dan WAJIB untuk rute pemandangan seperti Alaska, Fjords & New Zealand.',
    pros: [
      'Ruang privat menghirup udara segar laut, sarapan pagi di balkon, atau menikmati sunset tanpa berdesakan',
      'Kamar terasa jauh lebih luas dan sangat membantu meredakan rasa pengap / mabuk laut',
      'Tersedia banyak opsi Connecting Balcony untuk keluarga besar (2 kamar saling terhubung di dalam)'
    ],
    cons: [
      'Perhatikan label "Obstructed View" (terhalang sekoci/tiang) — wajib cek deck plan sebelum lock kamar!'
    ],
    salesTip: 'Kategori dengan kepuasan pelanggan tertinggi. Selalu tawarkan Balcony terlebih dahulu sebagai standar rekomendasi utama.'
  },
  {
    id: 'suite',
    name: 'Suite & VIP Enclave',
    subtitle: 'The Palace • Concierge • Yacht Club • The Haven • The Retreat',
    sizeRange: '30 – 150+ m²',
    priceLevel: '$$$$',
    accent: '#7c3aed',
    idealFor: 'Klien VVIP, keluarga besar yang butuh ruang tamu terpisah, tamu lansia yang tidak mau antre boarding, dan Honeymoon mewah.',
    pros: [
      'Prioritas Check-In, Boarding & Disembarkation tanpa antre panjang di pelabuhan',
      'Akses area privat (kolam renang, sundeck, lounge & restoran eksklusif khusus tamu Suite)',
      'Layanan Butler / Concierge 24 jam + banyak benefit inklusif (WiFi, paket minuman, atau specialty dining tergantung brand)'
    ],
    cons: [
      'Kuota kamar sangat terbatas (cepat habis 6–12 bulan sebelumnya)',
      'Tarif gratuity per malam umumnya lebih tinggi dibanding kabin standar'
    ],
    salesTip: 'Highlight utama ke klien VIP Indonesia: "Tanpa antre saat naik/turun kapal di Singapura & ada restoran privat yang tenang!"'
  }
];

export const DECK_STRATEGY_TIPS = [
  {
    title: 'Formula Anti Mabuk Laut (Paling Stabil)',
    tone: '#10b981',
    points: [
      'Pilih posisi **Mid-Ship (Tengah Kapal)** — titik tumpu paling stabil seperti tengah jungkat-jungkit.',
      'Pilih **Deck Menengah ke Bawah (Deck 5–9)** — semakin tinggi deck, ayunan samping terasa lebih besar.',
      'Kabin **Balcony / Oceanview** membantu mata melihat garis cakrawala sehingga otak lebih cepat seimbang.'
    ]
  },
  {
    title: 'Posisi Kabin yang Sebaiknya Dihindari',
    tone: '#ef4444',
    points: [
      'Tepat di bawah **Pool Deck / Buffet / Jogging Track** — rawan suara kursi ditarik atau langkah lari sejak subuh.',
      'Tepat di atas **Teater Utama / Nightclub / Casino** — berisiko terdengar dentuman bass sampai larut malam.',
      'Paling depan (**Forward Deck Rendah**) — suara jangkar & hantaman ombak lebih terasa saat sandar pagi.',
      'Kabin berlabel **Obstructed View** — pastikan informasikan ke klien sejak awal bila pemandangan terhalang sekoci.'
    ]
  },
  {
    title: 'Tips Rooming Keluarga & Grup',
    tone: '#2563eb',
    points: [
      'Untuk keluarga 4–6 orang: minta **Connecting Cabin** (pintu penghubung di dalam kamar) jauh hari karena jumlahnya terbatas.',
      'Ingatkan klien bahwa tempat tidur ke-3 & ke-4 di kabin standar umumnya berupa **Sofa Bed** atau **Pullman Bed** (ranjang lipat dinding/plafon).',
      'Untuk tamu lansia/kursi roda: pilih kabin **dekat Lift (Elevator Lobby)** dan tanyakan ketersediaan **Accessible Cabin** berpintu lebar.'
    ]
  }
];

export const CABIN_GLOSSARY = [
  {
    term: 'Guarantee Cabin (GTY)',
    meaning: 'Tarif promo di mana klien memesan kategori (misal Balcony GTY), tetapi **nomor kabin & deck dipilihkan otomatis oleh pihak kapal** mendekati keberangkatan. Tidak bisa request posisi bersebelahan.'
  },
  {
    term: 'Connecting vs Adjoining',
    meaning: '**Connecting** = 2 kamar punya pintu penghubung langsung di dalam. **Adjoining** = 2 kamar hanya bersebelahan dinding tanpa pintu penghubung di dalam.'
  },
  {
    term: 'Single Supplement',
    meaning: 'Harga cruise umumnya dihitung berbasis **Twin Sharing (2 orang/kamar)**. Jika 1 orang menempati 1 kamar sendiri, biasanya dikenakan biaya **150%–200%** dari tarif per orang (kecuali kategori Solo Studio seperti di NCL).'
  },
  {
    term: 'Pullman & Sofa Bed',
    meaning: 'Tempat tidur tambahan untuk tamu ke-3/ke-4 dalam satu kabin: **Sofa Bed** (sofa dibuka jadi kasur) atau **Pullman Bed** (ranjang lipat dari dinding/plafon seperti bunk bed, disiapkan room attendant tiap malam).'
  },
  {
    term: 'Port Charges & Taxes (NCCF)',
    meaning: 'Biaya sandar pelabuhan, pajak pemerintah & biaya non-komisi (*Non-Commissionable Cruise Fare*). Pastikan jelas apakah harga yang dikutip ke klien sudah *All-In Port Tax* atau belum.'
  },
  {
    term: 'Onboard Credit (OBC)',
    meaning: 'Saldo belanja digital di akun kabin (diberikan dari promo brand/agent) yang dapat dipakai membayar specialty dining, belanja di kapal, spa, excursion, atau gratuity (sesuai ketentuan brand).'
  }
];

export const INCLUDED_ITEMS = [
  { title: 'Akomodasi Kabin & Housekeeping', detail: 'Kamar dibersihkan harian + layanan turn-down malam.' },
  { title: 'Makan Utama Sepuasnya', detail: 'Sarapan, makan siang, makan malam di Main Dining Room, Buffet & kafe/pizza inklusif.' },
  { title: 'Hiburan & Pertunjukan Kelas Dunia', detail: 'Teater panggung, musikal, live music, bioskop & deck party.' },
  { title: 'Fasilitas Rekreasi & Olahraga', detail: 'Kolam renang, jacuzzi, waterslide, gym/fitness center & jogging track.' },
  { title: 'Kids & Teen Club Dasar', detail: 'Aktivitas anak terjadwal sesuai kelompok usia dengan staf terlatih.' },
  { title: 'Minuman Dasar di Buffet', detail: 'Air putih, kopi/teh standar & jus sarapan (Disney juga free soft drink di deck!).' }
];

export const EXCLUDED_ITEMS = [
  { title: 'Gratuities / Service Charge (Tipping)', detail: 'Wajib per orang per malam (biasanya USD 16–25 atau SGD 27–34/malam), kecuali brand Ultra-Luxury All-Inclusive.' },
  { title: 'Port Charges & Government Taxes', detail: 'Bila tidak masuk harga promo dasar — selalu konfirmasi status *All-In* sebelum kirim penawaran.' },
  { title: 'Tiket Pesawat & Transfer Pelabuhan', detail: 'Tiket ke kota homeport (misal CGK–SIN) + transfer Bandara ke Cruise Terminal (MBCCS / HarbourFront).' },
  { title: 'Visa & Dokumen Perjalanan', detail: 'Pembuatan paspor, Visa negara singgah (Jepang/Schengen/US/Canada/Australia) & asuransi perjalanan.' },
  { title: 'Paket Minuman & Specialty Dining', detail: 'Soft drink (non-Disney), kopi barista, alkohol, serta restoran tematik berbayar (Steakhouse, Teppanyaki, dll).' },
  { title: 'WiFi Laut (Starlink) & Shore Excursions', detail: 'Paket internet harian di kapal, tur darat resmi di pelabuhan singgah, spa, laundry & biaya medis di klinik kapal.' }
];

export const DEFAULT_FX_RATES = {
  USD: 16200,
  SGD: 12100,
  EUR: 17400
};

export const COMPLIANCE_RULES = [
  {
    id: 'passport',
    title: 'Masa Berlaku Paspor Wajib ≥ 6 Bulan',
    severity: 'critical',
    summary: 'Paspor semua penumpang (termasuk bayi & anak) WAJIB berlaku minimal **6 bulan terhitung dari tanggal SELESAI berlayar** + minimal 2–4 halaman kosong.',
    salesNote: 'Minta foto halaman identitas paspor saat booking untuk langsung cek expired date sebelum issued!'
  },
  {
    id: 'visa',
    title: 'Visa Multi-Entry & SG Arrival Card',
    severity: 'critical',
    summary: 'Penumpang bertanggung jawab atas visa semua pelabuhan yang disinggahi — **meskipun tidak berniat turun ke darat**, kapal tetap bisa menolak boarding jika syarat visa negara singgah tidak terpenuhi.',
    salesNote: 'Rute Singapura: isi SG Arrival Card gratis maksimal 3 hari sebelum masuk SG. Rute Jepang–Korea / Eropa / Alaska: cek syarat Multiple Entry sejak awal!'
  },
  {
    id: 'pregnancy',
    title: 'Aturan Ibu Hamil (Maksimal 23 Minggu)',
    severity: 'critical',
    summary: 'Mayoritas kapal pesiar **MELARANG ibu hamil yang memasuki usia kehamilan ≥ 24 minggu** (dihitung pada hari *terakhir* pelayaran, bukan hari berangkat!) demi keselamatan medis di laut.',
    salesNote: 'Ibu hamil < 24 minggu wajib membawa Surat Keterangan Dokter (*Fit to Sail*) berbahasa Inggris yang mencantumkan usia kehamilan & HPL.'
  },
  {
    id: 'infant',
    title: 'Usia Minimal Bayi (6 Bulan / 12 Bulan)',
    severity: 'warning',
    summary: 'Usia minimal bayi saat hari keberangkatan umumnya **6 bulan** untuk pelayaran biasa, dan **12 bulan** untuk pelayaran dengan 3+ hari berturut-turut di laut (trans-oceanic / rute panjang).',
    salesNote: 'Selalu hitung usia bayi berdasarkan tanggal lahir vs tanggal *sailing start* sebelum menerima deposit!'
  },
  {
    id: 'minor',
    title: 'Aturan Anak / Minor & Pendamping',
    severity: 'warning',
    summary: 'Minimal 1 tamu di setiap kabin harus berusia **≥ 18 tahun** (Asia/Eropa) atau **≥ 21 tahun** (rute berangkat dari Amerika Utara pada Royal Caribbean, Princess, NCL, Celebrity).',
    salesNote: 'Jika anak di bawah 18 tahun ikut bersama kakek/nenek/paman tanpa orang tua kandung, siapkan surat izin bermaterai/notaris + salinan KK/Akta Lahir.'
  },
  {
    id: 'halal',
    title: 'Makanan Halal & Alergi Khusus',
    severity: 'info',
    summary: 'Hanya **Genting Dream (StarDream Cruises)** yang memiliki dapur bersertifikat Halal penuh di Singapura. Brand barat (Disney, Royal Caribbean, MSC, dll) menyediakan **Halal Pre-Order** dengan request **H-45 s/d H-90 sebelum sailing**.',
    salesNote: 'Catat permintaan Halal / alergi kacang / kursi roda langsung di reservasi begitu DP masuk agar tidak terlewat batas waktu!'
  },
  {
    id: 'prohibited',
    title: 'Barang Terlarang di Atas Kapal (Keamanan Kebakaran)',
    severity: 'warning',
    summary: 'DILARANG membawa: **setrika baju / steamer**, **rice cooker / teko pemanas air**, **terminal colokan dengan surge protector**, lilin, drone, senjata tajam, serta minuman keras di luar kuota resmi kapal.',
    salesNote: 'Barang elektronik pemanas akan disita di keamanan terminal dan baru dikembalikan saat kapal selesai berlayar.'
  }
];

export const PRE_SAILING_TIMELINE = [
  {
    step: '1',
    timing: 'Saat Booking',
    title: 'Kunci Kabin, Cek Paspor & Deposit',
    detail: 'Verifikasi nama sesuai paspor (biaya ganti nama ketat!), masa berlaku paspor ≥ 6 bulan, usia bayi/hamil, dan input Special Request (Halal / Connecting / Kursi Roda).'
  },
  {
    step: '2',
    timing: 'H-90 s/d H-60',
    title: 'Final Payment (Pelunasan) & Urus Visa',
    detail: 'Pelunasan wajib sebelum batas Final Payment agar kabin tidak auto-cancel. Mulai proses visa Jepang/Schengen/US/Australia & pre-book paket WiFi/Minuman (diskon 20–35%).'
  },
  {
    step: '3',
    timing: 'H-45 s/d H-30',
    title: 'Online Check-In & Pilih Jam Boarding',
    detail: 'Download aplikasi resmi kapal, upload foto paspor & selfie, daftarkan kartu kredit/debit untuk akun onboard, lalu pilih *Boarding Arrival Time* seawal mungkin.'
  },
  {
    step: '4',
    timing: 'H-7 s/d H-3',
    title: 'Cetak Boarding Pass, Luggage Tag & SGAC',
    detail: 'Print *SetSail Pass / Boarding Pass* & *Luggage Tag* (pasang di koper sebelum diserahkan ke porter terminal). Isi SG Arrival Card maksimal H-3 untuk homeport Singapura.'
  },
  {
    step: '5',
    timing: 'Hari-H Berangkat',
    title: 'Tiba di Pelabuhan & Muster Drill Wajib',
    detail: 'Tiba sesuai jadwal boarding (**Gate tutup keras 90–120 menit sebelum kapal berangkat!**). Setelah naik kapal, wajib selesaikan *Muster Safety Drill* melalui aplikasi & datangi titik kumpul.'
  }
];

export const SALES_OBJECTION_PLAYBOOK = [
  {
    id: 'seasick',
    category: 'Kenyamanan',
    objection: '"Saya takut mabuk laut di kapal pesiar, goyang gak ya?"',
    shortAnswer: 'Kapal pesiar modern dilengkapi sirip stabilizer hidrolik raksasa dan bobotnya 100.000–200.000+ ton — jauh berbeda dengan kapal feri biasa.',
    keyPoints: [
      'Rute Singapura–Penang–Phuket melewati Selat Malaka yang ombaknya relatif sangat tenang.',
      'Pilih kabin di **Mid-Ship (tengah kapal)** dan deck menengah/bawah agar nyaris tidak terasa goyang.',
      'Tersedia klinik kapal & obat anti-mabuk bila diperlukan.'
    ],
    waScript:
      'Tenang Bapak/Ibu 😊 Kapal pesiar modern bobotnya sangat besar (150.000–200.000 ton) dan sudah dilengkapi stabilizer canggih, jadi rasanya jauh berbeda dengan kapal feri — hampir seperti menginap di hotel resort di atas air.\n\nTips dari kami agar makin nyaman:\n1. Pilih kabin di area tengah kapal (Mid-Ship) & tipe Balcony agar bisa melihat udara segar.\n2. Untuk rute Singapura (Selat Malaka), perairannya umumnya sangat tenang.\n\nKalau berkenan, saya bisa pilihkan posisi nomor kabin yang paling stabil ya!'
  },
  {
    id: 'bored',
    category: 'Aktivitas',
    objection: '"Di kapal terus selama 3–4 hari nanti bosan gak ya?"',
    shortAnswer: 'Justru banyak tamu merasa waktu 3 malam kurang! Di atas kapal ada ratusan aktivitas harian seperti kota resort terapung.',
    keyPoints: [
      'Pertunjukan panggung kelas Broadway, live music, bioskop, dan hiburan tematik berbeda setiap malam.',
      'Waterpark, kolam renang, gym, belanja duty-free, hingga Kids Club terpisah untuk anak-anak.',
      'Kuliner beragam tersedia hampir 24 jam — plus jadwal harian (*Daily Compass / Navigator*) selalu penuh acara.'
    ],
    waScript:
      'Justru kebanyakan tamu setelah mencoba bilang 3 malam terasa kurang cepat, Bapak/Ibu 😄 Kapal pesiar sekarang seperti resort bintang 5 terapung!\n\nSetiap hari ada jadwal hiburan berbeda: pertunjukan teater kelas Broadway, kolam renang & waterslide, live music, Kids Club gratis untuk anak-anak, gym/spa, sampai pilihan kuliner yang buka hampir sepanjang hari. Ditambah lagi kapal juga sandar di pelabuhan tujuan sehingga tetap bisa jalan-jalan ke darat. Jadi pasti seru untuk semua usia!'
  },
  {
    id: 'value',
    category: 'Harga & Value',
    objection: '"Kok kelihatannya mahal dibanding liburan darat / tour biasa?"',
    shortAnswer: 'Harga cruise terlihat di depan karena sudah menggabungkan Hotel + Transportasi Antar Kota/Negara + Makan 3–5× sehari + Hiburan kelas dunia dalam 1 paket!',
    keyPoints: [
      'Tidak perlu bayar hotel terpisah tiap malam, transportasi antar kota, atau pusing cari makan 3× sehari.',
      'Hanya 1× bongkar koper untuk mengunjungi beberapa destinasi sekaligus — hemat waktu dan tenaga.',
      'Sering tersedia promo Kids Sail Promo / diskon 2nd Guest di periode tertentu.'
    ],
    waScript:
      'Kalau dihitung totalnya, cruise sebenarnya sangat *worth it* Bapak/Ibu ✨ Karena dalam 1 harga sudah termasuk:\n• Akomodasi kamar setara hotel berbintang\n• Transportasi antar kota/negara sambil tidur nyenyak (cukup 1× bongkar koper!)\n• Makan sepuasnya 3–5× sehari di restoran & buffet\n• Pertunjukan panggung, kolam renang, waterpark & Kids Club gratis\n\nKalau kita hitung terpisah hotel + makan + tiket wahana di Singapura/Jepang/Eropa, biayanya sering kali jauh lebih tinggi dibanding paket cruise ini. Mau saya bantu hitungkan estimasi total all-in sesuai jumlah peserta?'
  },
  {
    id: 'halal',
    category: 'Halal & Kuliner',
    objection: '"Kami Muslim, makanan di atas kapal halal dan aman gak?"',
    shortAnswer: 'Sangat bisa aman! Pilihan paling nyaman adalah Genting Dream (dapur bersertifikat Halal JAKIM), atau pre-order Halal meal pada Disney / Royal Caribbean / MSC.',
    keyPoints: [
      'Genting Dream (StarDream Cruises): memiliki bagian dapur & buffet **Halal Certified resmi** + ruang salat.',
      'Disney, Royal Caribbean, Celebrity, MSC: menyediakan **Halal-certified pre-ordered meals** (wajib request H-45 s/d H-90 sebelum sailing) + pilihan seafood & vegetarian melimpah.',
      'Tim kami bantu inputkan permintaan Halal langsung saat reservasi.'
    ],
    waScript:
      'Untuk kebutuhan makanan Halal sangat bisa kami bantu aturkan, Bapak/Ibu 🌙\n\nAda 2 opsi nyaman:\n1. **Genting Dream (dari Singapura)** — memiliki dapur & buffet khusus bersertifikat Halal resmi (JAKIM) serta ruang salat, sehingga paling praktis dan tenang.\n2. **Disney Adventure / Royal Caribbean / MSC** — tersedia fasilitas *Halal-certified pre-ordered meals* (cukup kami daftarkan minimal 45–60 hari sebelum keberangkatan) plus beragam pilihan seafood & vegetarian.\n\nBapak/Ibu lebih prefer opsi yang mana? Nanti saya kirimkan detail jadwal dan harganya.'
  },
  {
    id: 'senior',
    category: 'Keluarga & Lansia',
    objection: '"Saya bawa orang tua / pengguna kursi roda, apakah cocok naik cruise?"',
    shortAnswer: 'Cruise justru liburan PALING ramah lansia & multi-generasi karena minim jalan jauh antar hotel dan 100% fasilitas kapal aksesibel lift!',
    keyPoints: [
      'Tidak perlu angkat koper berpindah-pindah hotel atau duduk lama di bus setiap hari.',
      'Semua deck terhubung lift; tersedia *Accessible Stateroom* berpintu lebar & kamar mandi tanpa undakan (pesan lebih awal).',
      'Anak muda tetap bisa bermain wahana, sementara orang tua bersantai di balkon/lounge — berkumpul lagi saat makan malam.'
    ],
    waScript:
      'Justru kapal pesiar adalah pilihan liburan paling nyaman untuk orang tua & liburan keluarga multi-generasi, Bapak/Ibu 💙\n\n• Cukup 1× check-in & bongkar koper — tidak perlu capek pindah hotel atau naik-turun bus jauh.\n• Seluruh area kapal terhubung lift dan ramah kursi roda (bisa kami pilihkan posisi kamar dekat lift atau tipe Accessible Cabin bila tersedia).\n• Orang tua bisa bersantai menikmati pemandangan laut & restoran nyaman, sementara anak/cucu tetap seru dengan wahana kapal — lalu seluruh keluarga berkumpul saat makan malam.\n\nJika diperlukan, kami juga bisa bantu daftarkan layanan *wheelchair assistance* saat boarding di pelabuhan.'
  },
  {
    id: 'excursion',
    category: 'Operasional',
    objection: '"Kalau turun jalan-jalan di pelabuhan (Shore Excursion), bagaimana kalau telat balik ke kapal?"',
    shortAnswer: 'Kapal TIDAK akan menunggu tamu yang jalan sendiri (kecuali ikut Shore Excursion resmi dari kapal!). Wajib kembali minimal 1 jam sebelum jadwal "All Aboard".',
    keyPoints: [
      'Ikut **Shore Excursion resmi kapal** → jaminan 100% kapal menunggu jika bus tur terjebak macet.',
      'Jika eksplor mandiri → selalu sisakan buffer **minimal 1,5–2 jam** sebelum jam *All Aboard* dan perhatikan **Ship Time** (waktu kapal kadang beda zona waktu dengan darat!).',
      'Bawa kartu akses kapal (*SeaPass/Keycard*), fotokopi paspor & nomor kontak agen pelabuhan lokal.'
    ],
    waScript:
      'Pertanyaan bagus sekali, Bapak/Ibu! Ini hal penting yang selalu kami ingatkan ke tamu cruise:\n\n1. Jika mengambil **Shore Excursion resmi dari kapal**, pihak kapal **menjamin akan menunggu** bila terjadi keterlambatan/macet di perjalanan.\n2. Jika ingin jalan mandiri di pelabuhan, pastikan selalu mengikuti **waktu kapal (Ship Time)** dan sudah kembali di pelabuhan **minimal 1–1,5 jam sebelum jam All Aboard**, karena kapal tidak dapat menunggu tamu mandiri.\n\nNanti sebelum berangkat kami juga kirimkan panduan lengkap persiapan & tips turun di setiap pelabuhan ya!'
  },
  {
    id: 'kids-baby',
    category: 'Keluarga & Anak',
    objection: '"Apakah bayi / balita boleh ikut? Ada biayanya gak?"',
    shortAnswer: 'Bayi minimal usia **6 bulan** (rute biasa) atau **12 bulan** (rute panjang 3+ hari di laut berturut-turut) boleh ikut. Tarif bayi/anak mengikuti kebijakan masing-masing kapal.',
    keyPoints: [
      'Di kapal pesiar, bayi tetap dihitung sebagai 1 penumpang (*manifest keselamatan sekoci*), sehingga tetap ada biaya tiket/port tax (walau sering ada promo Kids Sail Promo).',
      'Gratuity bayi: berbeda per brand (Genting Dream gratis <2 thn; Royal Caribbean & Disney berlaku untuk semua usia).',
      'Kids Club gratis umumnya mulai usia 3 tahun (syarat *potty trained*); di bawah 3 tahun tersedia nursery berbayar terbatas.'
    ],
    waScript:
      'Boleh sekali Bapak/Ibu 👶 Selama usia bayi saat tanggal berangkat sudah minimal **6 bulan** (atau **12 bulan** untuk pelayaran panjang dengan 3+ hari di laut berturut-turut).\n\nSebagai info awal, karena aturan kapasitas keselamatan kapal, bayi tetap didaftarkan sebagai 1 penumpang (namun di beberapa periode sering ada promo khusus anak/tamu ke-3 & ke-4). Boleh dibantu infokan tanggal lahir si kecil dan rencana bulan keberangkatannya agar saya cekkan promo terbaiknya?'
  },
  {
    id: 'payment-cancel',
    category: 'Pembayaran & Aturan',
    objection: '"Bisa ganti nama atau batal mendadak gak kalau ada halangan?"',
    shortAnswer: 'Aturan cruise jauh lebih ketat dibanding hotel biasa — pelunasan umumnya H-90 s/d H-60 dan pembatalan setelah periode tersebut dikenakan penalti bertingkat hingga 100%.',
    keyPoints: [
      'Selalu pastikan **nama sesuai paspor** sebelum DP/issued — perubahan semua nama di 1 kabin dianggap *cancellation*.',
      'Sangat disarankan menambahkan **Asuransi Perjalanan (Travel Insurance)** sejak saat DP untuk melindungi risiko sakit/batal mendadak.',
      'Tarif promo (*Non-Refundable Deposit*) biasanya menghanguskan DP jika dibatalkan atau pindah tanggal.'
    ],
    waScript:
      'Untuk pemesanan kapal pesiar, jadwal pelunasan umumnya **60–90 hari sebelum keberangkatan** dan setelah melewati batas tersebut berlaku ketentuan biaya pembatalan bertingkat dari pihak kapal (serta perubahan seluruh nama peserta dianggap pembatalan).\n\nSupaya Bapak/Ibu jauh lebih tenang, kami selalu merekomendasikan melengkapi **Asuransi Perjalanan** sejak awal pemesanan agar terlindungi bila ada kendala kesehatan atau perubahan tak terduga. Sebelum lock kamar, cukup kirimkan foto paspor seluruh peserta ya agar kami pastikan ejaan nama & masa berlakunya aman 100%!'
  }
];

const BASE_SEED_CRUISE_GUIDES = [
  {
    id: 'disney-cruise-line',
    brandName: 'Disney Cruise Line',
    tagline: 'Pengalaman liburan keluarga paling magis di laut — rumah bagi Disney Adventure dari Singapura.',
    segment: 'Family Premium',
    budgetTier: 4,
    featuredShips: [
      {
        name: 'Disney Adventure',
        tonnage: '208.000 GT',
        capacity: '~6.700 tamu',
        yearBuilt: '2025/2026',
        highlight: 'Homeport Singapura, 7 area tematik (Marvel Landing, Disney Imagination Garden, San Fransokyo Street, Toy Story Place)'
      },
      {
        name: 'Disney Wish',
        tonnage: '144.000 GT',
        capacity: '4.000 tamu',
        yearBuilt: '2022',
        highlight: 'AquaMouse water coaster, Worlds of Marvel & Arendelle Frozen Dining'
      },
      {
        name: 'Disney Treasure',
        tonnage: '144.000 GT',
        capacity: '4.000 tamu',
        yearBuilt: '2024',
        highlight: 'Tema petualangan Coco, Aladdin & Haunted Mansion Parlor'
      }
    ],
    homeports: ['Singapore (MBCCS)', 'Port Canaveral (USA)', 'Barcelona / Civitavecchia (Seasonal)'],
    regions: ['singapore-sea', 'europe-med', 'alaska', 'australia-nz'],
    targetProfiles: ['family', 'first-timer', 'honeymoon'],
    halalStatus: 'Pre-Order Halal',
    halalNotes:
      'Menyediakan Halal-certified pre-packaged/pre-ordered meals (wajib request minimal 45–60 hari sebelum keberangkatan melalui agent/portal Disney) serta pilihan vegetarian & seafood melimpah.',
    gratuityCurrency: 'USD',
    gratuityStandard: 16,
    gratuitySuite: 27.25,
    gratuityNotes:
      'USD 16/orang/malam untuk Stateroom standar; USD 27.25/orang/malam untuk Concierge Stateroom & Suites (berlaku untuk semua usia termasuk anak).',
    minInfantMonths: 6,
    pregnancyMaxWeeks: 23,
    minBookingAge: 18,
    vipClubName: 'Disney Concierge',
    typicalDurations: ['3N', '4N', '5N', '7N'],
    highlights: [
      'Meet & Greet karakter Disney, Pixar & Marvel tanpa perlu antre di theme park darat',
      'Rotational Dining unik — tamu pindah restoran tematik tiap malam dengan pelayan yang sama',
      'Soft drink, kopi, teh & es krim gratis di deck hampir sepanjang hari (jarang ada di brand lain!)',
      'Pertunjukan panggung kelas Broadway original Disney & kembang api di laut (rute tertentu)',
      'Kids Club (Oceaneer Club) & Teen Club kelas dunia + area khusus dewasa (Quiet Cove)'
    ],
    inclusions: [
      'Akomodasi kabin dengan desain split-bathroom (kamar mandi & toilet terpisah — favorit keluarga!)',
      'Makan utama Rotational Dining, Buffet, Quick Service & 24-jam Room Service standar',
      'Minuman soda/soft drink, kopi & teh gratis di beverage station deck',
      'Semua pertunjukan panggung Broadway Disney, bioskop film terbaru & Kids Club'
    ],
    salesTips: [
      'Jual ke keluarga Indonesia dengan highlight: tidak perlu jauh ke Orlando/Tokyo — cukup terbang ke Singapura 1,5 jam sudah naik Disney Adventure!',
      'Tekankan kelebihan split-bathroom (2 ruang mandi terpisah) & free soft drink di deck yang menghemat banyak pengeluaran keluarga.',
      'Ingatkan klien bahwa kamar Disney cepat sekali habis di musim libur sekolah Juni & Desember — dorong booking lebih awal (H-6 s/d H-12 bulan).',
      'Disney Adventure fokus pengalaman di kapal (3N/4N At Sea) sehingga tidak perlu urus visa tambahan selain paspor & SG Arrival Card.'
    ],
    dressCode: 'Cruise Casual di sebagian besar malam; tersedia Pirate Night / semi-formal opsional; dilarang baju renang/tank top di restoran utama.',
    websiteUrl: 'https://disneycruise.disney.go.com',
    accentColor: '#2563eb',
    sortOrder: 10,
    isActive: true,
    updatedBy: 'System Seed'
  },
  {
    id: 'stardream-cruises',
    brandName: 'StarDream / Resorts World Cruises',
    tagline: 'Raja cruise Asia dari Singapura — 100% ramah Muslim dengan dapur bersertifikat Halal JAKIM.',
    segment: 'Value & Family',
    budgetTier: 2,
    featuredShips: [
      {
        name: 'Genting Dream',
        tonnage: '150.695 GT',
        capacity: '3.352 tamu',
        yearBuilt: '2016',
        highlight: 'Homeport Singapura sepanjang tahun, The Lido Halal Certified, Waterslide Park & Zipline di atas laut'
      },
      {
        name: 'Star Voyager',
        tonnage: '77.441 GT',
        capacity: '~1.940 tamu',
        yearBuilt: 'Refurb 2025',
        highlight: 'Rute fleksibel Asia Tenggara (Jakarta/Singapura/Melaka/Bangkok/Ho Chi Minh musiman)'
      },
      {
        name: 'Star Navigator',
        tonnage: '75.338 GT',
        capacity: '~1.856 tamu',
        yearBuilt: 'Refurb 2025',
        highlight: 'Rute Taiwan, Jepang & Hong Kong dengan kuliner Asia autentik'
      }
    ],
    homeports: ['Singapore (MBCCS)', 'Port Klang (KL)', 'Jakarta (Seasonal)', 'Hong Kong / Keelung'],
    regions: ['singapore-sea', 'japan-korea'],
    targetProfiles: ['halal', 'family', 'first-timer', 'senior'],
    halalStatus: 'Certified Halal Kitchen',
    halalNotes:
      'Genting Dream memiliki dapur & buffet khusus bersertifikat Halal resmi (JAKIM Malaysia / OIC-SMIIC friendly) di The Lido — pilihan nomor #1 paling tenang untuk tamu Muslim Indonesia!',
    gratuityCurrency: 'SGD',
    gratuityStandard: 27,
    gratuitySuite: 34,
    gratuityNotes:
      'Estimasi SGD 27/orang/malam untuk Interior–Balcony; SGD 34/orang/malam untuk The Palace Suite (bayi < 2 tahun gratis gratuity; harga dapat berubah mengikuti ketentuan terbaru).',
    minInfantMonths: 6,
    pregnancyMaxWeeks: 23,
    minBookingAge: 18,
    vipClubName: 'The Palace',
    typicalDurations: ['2N', '3N', '4N', '5N'],
    highlights: [
      'Satu-satunya mega-cruise di Singapura dengan sertifikasi Halal resmi & ruang salat (prayer room)',
      'Kuliner sangat cocok dengan lidah Indonesia & Asia (nasi, mie, dim sum, masakan Melayu/Chinese)',
      'Durasi singkat 2N–3N cocok untuk liburan long weekend atau first-timer yang ingin coba cruise',
      'The Palace: konsep ship-within-a-ship dengan butler 24 jam, kolam renang privat & dining eksklusif',
      'Waterslide Park 6 seluncuran, ropes course, zipline, rock climbing & Zouk Beach Club'
    ],
    inclusions: [
      'Akomodasi kabin sesuai kategori',
      'Makan hingga 3–5x sehari di restoran inklusif (Dream Dining Room & The Lido Buffet termasuk sudut Halal)',
      'Pertunjukan teater Zodiac Theatre, kolam renang, waterslide & fasilitas olahraga utama',
      'Khusus The Palace: prioritas check-in, butler 24 jam, The Palace Restaurant & set menu di specialty dining tertentu'
    ],
    salesTips: [
      'Paling mudah di-closing untuk tamu Muslim & rombongan keluarga besar Indonesia karena tidak perlu khawatir soal makanan Halal dan cita rasa Asia.',
      'Tawarkan upgrade ke Balcony Deluxe atau The Palace untuk klien VIP/orang tua agar dapat prioritas boarding tanpa antre panjang di MBCCS.',
      'Cocok untuk paket Corporate Incentive 2N/3N weekend karena waktu cuti minim dan meeting room tersedia lengkap.'
    ],
    dressCode: 'Smart Casual; tidak ada kewajiban tuxedo/gaun malam formal; nyaman untuk segala usia.',
    websiteUrl: 'https://www.rwcruises.com',
    accentColor: '#d97706',
    sortOrder: 20,
    isActive: true,
    updatedBy: 'System Seed'
  },
  {
    id: 'royal-caribbean',
    brandName: 'Royal Caribbean International',
    tagline: 'Mega-kapal paling inovatif dengan wahana spektakuler & hiburan kelas dunia untuk segala usia.',
    segment: 'Contemporary',
    budgetTier: 3,
    featuredShips: [
      {
        name: 'Ovation of the Seas',
        tonnage: '168.666 GT',
        capacity: '4.180 tamu',
        yearBuilt: '2016',
        highlight: 'Homeport Singapura musiman, North Star 360°, RipCord by iFLY skydiving, FlowRider & SeaPlex bumper cars'
      },
      {
        name: 'Anthem of the Seas',
        tonnage: '168.666 GT',
        capacity: '4.180 tamu',
        yearBuilt: '2015',
        highlight: 'Quantum Class di Singapura/Asia, pertunjukan musikal We Will Rock You & Two70° multimedia show'
      },
      {
        name: 'Spectrum of the Seas',
        tonnage: '169.379 GT',
        capacity: '4.246 tamu',
        yearBuilt: '2019',
        highlight: 'Dirancang khusus untuk pasar Asia (Shanghai/Jepang/HK) dengan Sky Pad & Suite Enclave eksklusif'
      },
      {
        name: 'Icon of the Seas',
        tonnage: '248.663 GT',
        capacity: '5.610 tamu',
        yearBuilt: '2024',
        highlight: 'Kapal pesiar terbesar di dunia (rute Karibia/Miami) dengan 8 neighborhoods & waterpark Category 6'
      }
    ],
    homeports: ['Singapore (MBCCS)', 'Tokyo / Shanghai / Hong Kong', 'Barcelona / Rome', 'Seattle / Vancouver', 'Sydney'],
    regions: ['singapore-sea', 'japan-korea', 'europe-med', 'alaska', 'australia-nz'],
    targetProfiles: ['family', 'first-timer', 'honeymoon'],
    halalStatus: 'Pre-Order Halal',
    halalNotes:
      'Tersedia Halal-certified pre-packaged meals di Main Dining Room (wajib request minimal 45–90 hari sebelum berlayar via Special Needs form), plus buffet Windjammer kaya pilihan seafood, India & vegetarian.',
    gratuityCurrency: 'USD',
    gratuityStandard: 18.5,
    gratuitySuite: 21,
    gratuityNotes:
      'USD 18.50/orang/malam untuk Standard Stateroom hingga Junior Suite; USD 21.00/orang/malam untuk Grand Suite ke atas (berlaku untuk semua usia).',
    minInfantMonths: 6,
    pregnancyMaxWeeks: 23,
    minBookingAge: 21,
    vipClubName: 'Royal Suite Class',
    typicalDurations: ['3N', '4N', '5N', '7N', '9N'],
    highlights: [
      'Wahana ikonik di laut: kapsul kaca North Star, simulator terjun payung iFLY, selancar FlowRider & bumper cars',
      'Pertunjukan produksi besar kelas Broadway, ice skating show & teater robotik Two70°',
      'Adventure Ocean Kids Club terbagi berdasarkan rentang usia (3–17 tahun) — anak pasti betah!',
      'Pilihan kabin sangat beragam termasuk Virtual Balcony (kabin interior dengan layar real-time pemandangan laut)'
    ],
    inclusions: [
      'Akomodasi kabin & layanan housekeeping harian',
      "Makan sepuasnya di Main Dining Room, Windjammer Buffet, Sorrento's Pizza, Cafe Promenade & El Loco Fresh",
      'Hampir semua wahana utama (FlowRider, Rock Climbing, Bumper Cars, Ice Skating, Teater & Kids Club)',
      'Air putih, es teh, lemonade, kopi & teh standar di restoran/buffet'
    ],
    salesTips: [
      'Highlight paling ampuh untuk anak muda & keluarga dengan anak remaja: aktivitasnya jauh lebih menantang & modern dibanding cruise klasik.',
      'Perhatikan aturan usia minimum pemesan utama: rute Asia/Eropa/Australia umumnya 18 tahun, tetapi rute berangkat dari Amerika Utara wajib 21 tahun.',
      'Bisa pre-book paket WiFi VOOM (Starlink) & Beverage Package sebelum berangkat lewat Cruise Planner karena diskonnya bisa 20–35% lebih murah daripada beli di kapal!'
    ],
    dressCode: 'Casual di siang hari, Smart Casual saat makan malam, serta 1–2 Formal / Dress Your Best Night (opsional — bisa tetap makan di buffet jika ingin santai).',
    websiteUrl: 'https://www.royalcaribbean.com',
    accentColor: '#0284c7',
    sortOrder: 30,
    isActive: true,
    updatedBy: 'System Seed'
  },
  {
    id: 'princess-cruises',
    brandName: 'Princess Cruises',
    tagline: 'Spesialis rute Jepang & Alaska dengan pelayanan premium & teknologi OceanMedallion super praktis.',
    segment: 'Premium',
    budgetTier: 4,
    featuredShips: [
      {
        name: 'Diamond Princess',
        tonnage: '115.875 GT',
        capacity: '2.670 tamu',
        yearBuilt: '2004 (Refurb)',
        highlight: 'Dibuat di Jepang! Punya Izumi Japanese Bath (onsen tradisional di laut) & Kai Sushi — favorit rute Sakura/Autumn Jepang'
      },
      {
        name: 'Discovery Princess',
        tonnage: '145.281 GT',
        capacity: '3.660 tamu',
        yearBuilt: '2022',
        highlight: 'Royal Class modern untuk rute Alaska & Pasifik dengan Sky Suites ber-balkon 270°'
      },
      {
        name: 'Sun Princess',
        tonnage: '177.882 GT',
        capacity: '4.300 tamu',
        yearBuilt: '2024',
        highlight: 'Kapal terbaru Sphere Class dengan The Dome kaca spektakuler untuk rute Mediterania & Karibia'
      }
    ],
    homeports: ['Yokohama (Tokyo)', 'Singapore (Seasonal)', 'Vancouver / Whittier (Alaska)', 'Rome / Barcelona', 'Sydney'],
    regions: ['japan-korea', 'alaska', 'europe-med', 'australia-nz', 'singapore-sea'],
    targetProfiles: ['senior', 'honeymoon', 'family'],
    halalStatus: 'Pre-Order Halal',
    halalNotes:
      'Dapat mengajukan permintaan menu khusus / dietary request (termasuk Halal terbatas / vegetarian / seafood) minimal 60 hari sebelum sailing; konfirmasi tergantung ketersediaan pelabuhan.',
    gratuityCurrency: 'USD',
    gratuityStandard: 17,
    gratuitySuite: 19,
    gratuityNotes:
      'USD 17/orang/malam (Interior–Balcony), USD 18 (Mini-Suite/Cabana), USD 19 (Suite). Paket Princess Plus (sekitar USD 60/hari) sudah termasuk Gratuity + WiFi + Beverage!',
    minInfantMonths: 6,
    pregnancyMaxWeeks: 23,
    minBookingAge: 21,
    vipClubName: 'Sanctuary Collection / Reserve',
    typicalDurations: ['7N', '9N', '10N', '14N'],
    highlights: [
      'Teknologi MedallionClass (kunci pintu otomatis tanpa tap, pesan makan/minum diantar ke posisi duduk mana pun di kapal!)',
      'Pemandu & izin akses terbanyak ke Glacier Bay National Park di Alaska',
      'Rute keliling Jepang (Yokohama–Mt. Fuji–Kobe–Busan–Nagasaki) sangat lengkap tanpa repot pindah hotel & geret koper di Shinkansen',
      'Suasana elegan, tenang & tidak terlalu ramai — sangat disukai pasangan dewasa dan orang tua'
    ],
    inclusions: [
      'Akomodasi kabin & perangkat wearable OceanMedallion gratis',
      'Main Dining Room, World Fresh Marketplace Buffet, International Cafe 24 jam & Slice Pizzeria',
      'Movies Under the Stars (bioskop layar raksasa pinggir kolam) & pertunjukan Princess Theater'
    ],
    salesTips: [
      'Selalu tawarkan add-on Princess Plus (~USD 60/orang/hari): sudah termasuk Gratuity (~USD 17) + WiFi (~USD 25) + Plus Beverage (~USD 65) — nilainya sangat hemat sehingga mudah di-upsell!',
      'Untuk rute Jepang (Diamond Princess), pastikan klien paham perlu Visa Jepang Multiple / Waiver E-Paspor bila keluar masuk perairan Korea (Busan) lalu balik ke Jepang.',
      'Sangat kuat untuk segmen 45+ tahun, keluarga multi-generasi, dan pasangan yang mencari ketenangan.'
    ],
    dressCode: 'Smart Casual sehari-hari + 1–2 Formal Nights per pelayaran 7 malam.',
    websiteUrl: 'https://www.princess.com',
    accentColor: '#0369a1',
    sortOrder: 40,
    isActive: true,
    updatedBy: 'System Seed'
  },
  {
    id: 'msc-cruises',
    brandName: 'MSC Cruises',
    tagline: 'Gaya elegan Eropa dengan harga kompetitif, promo ramah keluarga & MSC Yacht Club super eksklusif.',
    segment: 'Contemporary',
    budgetTier: 2,
    featuredShips: [
      {
        name: 'MSC Bellissima',
        tonnage: '171.598 GT',
        capacity: '4.488 tamu',
        yearBuilt: '2019',
        highlight: 'Populer di rute Tokyo/Jepang–Korea–Taiwan dengan LED Sky Dome Promenade 96m & Carousel Productions'
      },
      {
        name: 'MSC World Europa',
        tonnage: '215.863 GT',
        capacity: '5.264 tamu',
        yearBuilt: '2022',
        highlight: 'Flagship futuristik Mediterania (Barcelona–Marseille–Genoa–Naples–Malta) dengan perosotan kering 11 deck'
      },
      {
        name: 'MSC Euribia',
        tonnage: '184.011 GT',
        capacity: '4.842 tamu',
        yearBuilt: '2023',
        highlight: 'Kapal ramah lingkungan untuk rute Norwegian Fjords & Eropa Utara'
      }
    ],
    homeports: ['Tokyo (Yokohama)', 'Barcelona / Rome / Genoa', 'Kiel / Copenhagen', 'Dubai / Abu Dhabi'],
    regions: ['japan-korea', 'europe-med'],
    targetProfiles: ['family', 'first-timer', 'luxury', 'honeymoon'],
    halalStatus: 'Pre-Order Halal',
    halalNotes:
      'Tersedia menu Halal pre-packaged di restoran utama dengan pemberitahuan minimal 60 hari sebelum keberangkatan (tergantung region; sangat baik di rute Timur Tengah/Dubai & Mediterania).',
    gratuityCurrency: 'EUR',
    gratuityStandard: 12,
    gratuitySuite: 16,
    gratuityNotes:
      'Rute Eropa/Mediterania sekitar EUR 12/dewasa/malam (anak 2–11 thn 50%, <2 thn gratis); rute Asia/Jepang sekitar USD 16–18/orang/malam.',
    minInfantMonths: 6,
    pregnancyMaxWeeks: 23,
    minBookingAge: 18,
    vipClubName: 'MSC Yacht Club',
    typicalDurations: ['4N', '5N', '7N', '8N'],
    highlights: [
      'Harga sangat kompetitif untuk rute Jepang (MSC Bellissima) & Mediterania — sering ada promo Kids Sail Free/Reduced',
      'Interior glamor khas Italia (tangga kristal Swarovski, Galleria promenade ber-LED raksasa)',
      'MSC Yacht Club: area VIP serba all-inclusive (butler 24 jam, minuman premium, WiFi & restoran privat) dengan harga lebih masuk akal dari brand ultra-luxury',
      'Program Status Match: member hotel/cruise lain bisa menyamakan level loyalti di MSC!'
    ],
    inclusions: [
      'Akomodasi kabin sesuai Experience (Bella / Fantastica / Aurea / Yacht Club)',
      'Makan utama di Main Dining Room & Marketplace Buffet (buka hingga 20 jam/hari)',
      'Teater gaya Eropa, kolam renang, waterpark & LEGO/Chicco Kids Club'
    ],
    salesTips: [
      'Jelaskan perbedaan Experience ke klien: Bella (paling murah, kabin dipilihkan kapal & tidak bisa pilih jam makan) vs Fantastica (bisa pilih nomor kabin, sarapan ke kamar gratis & bebas pilih jam makan).',
      'Untuk tamu VIP yang mau Eropa/Jepang tapi ingin eksklusif, dorong langsung ke MSC Yacht Club — conversion rate dan komisinya tinggi!',
      'Di rute Eropa/Mediterania, pastikan klien menggunakan Visa Schengen Multiple Entry bila itinerary mampir ke negara non-Schengen (misal UK/Turki/Tunisia).'
    ],
    dressCode: 'Smart Casual + Gala Night & White Party (ikonik di MSC — sarankan tamu bawa baju putih!).',
    websiteUrl: 'https://www.msccruises.com',
    accentColor: '#4f46e5',
    sortOrder: 50,
    isActive: true,
    updatedBy: 'System Seed'
  },
  {
    id: 'celebrity-cruises',
    brandName: 'Celebrity Cruises',
    tagline: 'Modern Luxury bergaya butik hotel bintang 5 — kuliner berkelas, desain artistik & ideal untuk pasangan.',
    segment: 'Premium',
    budgetTier: 4,
    featuredShips: [
      {
        name: 'Celebrity Solstice',
        tonnage: '121.878 GT',
        capacity: '2.852 tamu',
        yearBuilt: '2008 (Revitalized)',
        highlight: 'Rute Asia Tenggara (Singapura–Thailand–Vietnam–Hong Kong) dengan The Lawn Club rumput asli di deck atas'
      },
      {
        name: 'Celebrity Millennium',
        tonnage: '91.000 GT',
        capacity: '2.218 tamu',
        yearBuilt: '2000 (Revolutionized)',
        highlight: 'Rute mendalam Singapura–Bali–Jepang–Korea dengan ukuran kapal yang bisa masuk pelabuhan unik'
      },
      {
        name: 'Celebrity Edge & Ascent',
        tonnage: '140.600 GT',
        capacity: '3.260 tamu',
        yearBuilt: '2018–2023',
        highlight: 'Infinite Veranda cabin, Magic Carpet platform melayang di sisi kapal & kuliner Chef Daniel Boulud'
      }
    ],
    homeports: ['Singapore (MBCCS)', 'Tokyo / Hong Kong', 'Barcelona / Rome / Athens', 'Vancouver / Seattle', 'Sydney'],
    regions: ['singapore-sea', 'japan-korea', 'europe-med', 'alaska', 'australia-nz'],
    targetProfiles: ['honeymoon', 'senior', 'luxury'],
    halalStatus: 'Pre-Order Halal',
    halalNotes:
      'Bisa request Halal meals minimal 45–90 hari sebelumnya via Special Needs (satu grup dengan Royal Caribbean) plus kualitas restoran sehat, seafood & vegetarian yang sangat tinggi.',
    gratuityCurrency: 'USD',
    gratuityStandard: 18,
    gratuitySuite: 23,
    gratuityNotes:
      'USD 18/orang/malam (Standard–Concierge/AquaClass); USD 23/orang/malam untuk The Retreat Suites. Tersedia tarif All Included (Basic Beverage + Basic WiFi).',
    minInfantMonths: 6,
    pregnancyMaxWeeks: 23,
    minBookingAge: 21,
    vipClubName: 'The Retreat',
    typicalDurations: ['7N', '10N', '12N', '14N'],
    highlights: [
      'Suasana lebih tenang & dewasa dibanding kapal keluarga — nyaris tanpa keramaian wahana anak',
      'Kualitas kuliner & wine list termasuk yang terbaik di kelas premium cruise',
      'Kategori AquaClass memberikan akses eksklusif ke restoran sehat Blu & Thermal Suite spa gratis',
      'Rute Asia 12N Singapura–Bangkok–Ho Chi Minh–Hong Kong sangat populer untuk liburan panjang'
    ],
    inclusions: [
      'Akomodasi kabin berdesain kontemporer (atau Infinite Veranda di Edge Series)',
      'Main Dining (4 restoran utama berbeda di Edge Series), Oceanview Cafe & Spa Cafe',
      'Hiburan panggung modern, live music lounge & akses fitness center'
    ],
    salesTips: [
      'Pilihan utama untuk klien Honeymoon, Anniversary, dan pasangan mapan yang tidak ingin kapal penuh anak kecil berlarian.',
      'Bandingkan tarif Cruise-Only vs All Included sejak awal agar klien melihat transparansi biaya minum & WiFi.',
      'AquaClass sangat mudah dijual ke pasangan pencinta spa & makanan sehat.'
    ],
    dressCode: 'Smart Casual & Evening Chic (elegan modern, tidak sekaku tuxedo tradisional).',
    websiteUrl: 'https://www.celebritycruises.com',
    accentColor: '#0f766e',
    sortOrder: 60,
    isActive: true,
    updatedBy: 'System Seed'
  },
  {
    id: 'norwegian-cruise-line',
    brandName: 'Norwegian Cruise Line (NCL)',
    tagline: 'Freestyle Cruising — bebas jadwal makan, bebas dress code kaku & punya kabin khusus Solo Traveler.',
    segment: 'Contemporary',
    budgetTier: 3,
    featuredShips: [
      {
        name: 'Norwegian Spirit',
        tonnage: '75.904 GT',
        capacity: '2.018 tamu',
        yearBuilt: 'Renovasi Total 2020',
        highlight: 'Rute Asia (Singapura–Bali–Jepang–Korea–Taiwan) dengan suasana modern lebih dewasa'
      },
      {
        name: 'Norwegian Prima & Viva',
        tonnage: '143.535 GT',
        capacity: '3.099 tamu',
        yearBuilt: '2022–2023',
        highlight: 'Trek gokart 3 tingkat di atas laut, Ocean Boulevard 360° & Indulge Food Hall'
      },
      {
        name: 'Norwegian Encore',
        tonnage: '169.116 GT',
        capacity: '3.998 tamu',
        yearBuilt: '2019',
        highlight: 'Favorit rute Alaska dari Seattle dengan Observation Lounge kaca raksasa'
      }
    ],
    homeports: ['Singapore / Tokyo / Seoul', 'Barcelona / Rome / Athens', 'Seattle (Alaska)', 'Sydney / Auckland'],
    regions: ['singapore-sea', 'japan-korea', 'europe-med', 'alaska', 'australia-nz'],
    targetProfiles: ['first-timer', 'family', 'honeymoon'],
    halalStatus: 'No-Pork / Veg Options',
    halalNotes:
      'Pilihan buffet & restoran sangat beragam (termasuk menu India, seafood & vegetarian); untuk Halal khusus harus konfirmasi ketersediaan ke NCL Access Desk minimal 45–60 hari sebelumnya.',
    gratuityCurrency: 'USD',
    gratuityStandard: 20,
    gratuitySuite: 25,
    gratuityNotes: 'USD 20/orang/malam (Studio–Club Balcony); USD 25/orang/malam (The Haven & Suites).',
    minInfantMonths: 6,
    pregnancyMaxWeeks: 23,
    minBookingAge: 21,
    vipClubName: 'The Haven',
    typicalDurations: ['7N', '9N', '10N', '12N'],
    highlights: [
      'Konsep Freestyle Cruising: makan jam berapa saja tanpa dibagi giliran Early/Late Seating & tanpa kewajiban jas formal',
      'Program promo More At Sea: bundling paket minuman, specialty dining, WiFi & kredit shore excursion',
      'Punya kategori Solo Studio Cabin & Solo Lounge — solusi terbaik untuk tamu jalan sendiri tanpa kena Single Supplement 100%!',
      'The Haven: area suite mewah berpintu akses kartu khusus dengan butler & restoran privat'
    ],
    inclusions: [
      'Akomodasi kabin & layanan harian',
      "Main Dining Rooms, Garden Cafe Buffet, The Local / O'Sheehan's Bar & Grill (buka 24 jam!)",
      'Pertunjukan kelas Broadway, komedi & aktivitas deck'
    ],
    salesTips: [
      'Senjata pamungkas jika ada klien Solo Traveler yang mengeluh harga Single Supplement terlalu mahal — langsung arahkan ke NCL Solo Studio/Solo Balcony!',
      'Cocok untuk klien muda/profesional yang tidak suka aturan formal atau jam makan yang kaku.',
      'Ingatkan klien bahwa paket More At Sea tetap mengenakan pajak/gratuity atas paket minuman & specialty dining.'
    ],
    dressCode: 'Cruise Casual sepanjang pelayaran — paling santai & fleksibel di antara cruise internasional.',
    websiteUrl: 'https://www.ncl.com',
    accentColor: '#0891b2',
    sortOrder: 70,
    isActive: true,
    updatedBy: 'System Seed'
  },
  {
    id: 'costa-cruises',
    brandName: 'Costa Cruises',
    tagline: 'Nuansa liburan Italia yang meriah dengan tarif sangat bersahabat untuk rute Mediterania & Asia.',
    segment: 'Value & Family',
    budgetTier: 2,
    featuredShips: [
      {
        name: 'Costa Serena',
        tonnage: '114.147 GT',
        capacity: '3.780 tamu',
        yearBuilt: '2007 (Refurb)',
        highlight: 'Aktif di rute Asia (Jepang, Korea, Taiwan, Hong Kong & charter Asia Tenggara) dengan harga paling terjangkau'
      },
      {
        name: 'Costa Toscana',
        tonnage: '186.364 GT',
        capacity: '5.224 tamu',
        yearBuilt: '2021',
        highlight: 'Kapal modern bertenaga LNG di Mediterania Barat dengan kuliner autentik Italia'
      }
    ],
    homeports: ['Barcelona / Rome / Savona', 'Tokyo / Fukuoka / Busan', 'Hong Kong / Keelung'],
    regions: ['europe-med', 'japan-korea'],
    targetProfiles: ['first-timer', 'family'],
    halalStatus: 'No-Pork / Veg Options',
    halalNotes:
      'Tidak memiliki dapur bersertifikat Halal penuh; fokus masakan Italia/Mediterania & Asia dengan pilihan pasta, seafood dan vegetarian yang luas.',
    gratuityCurrency: 'EUR',
    gratuityStandard: 11,
    gratuitySuite: 11,
    gratuityNotes: 'Sekitar EUR 11/dewasa/malam untuk rute Eropa (anak 4–14 thn 50%, <4 thn gratis); rute Asia sekitar USD 16/orang/malam.',
    minInfantMonths: 6,
    pregnancyMaxWeeks: 23,
    minBookingAge: 18,
    vipClubName: 'Costa Suite Club',
    typicalDurations: ['4N', '5N', '7N'],
    highlights: [
      'Salah satu titik harga paling ramah untuk merasakan cruise Eropa Mediterania (Italia–Prancis–Spanyol)',
      'Kuliner Italia autentik (pizza, gelato, pasta buatan sendiri) & suasana pesta yang hangat',
      'Sering hadir dengan rute singkat Jepang–Korea yang cocok untuk rombongan group tour'
    ],
    inclusions: ['Akomodasi kabin', 'Main Dining Room & Buffet harian', 'Hiburan panggung, live music, kolam renang & Squok Kids Club'],
    salesTips: [
      'Ideal untuk klien price-sensitive yang ingin mencoba cruise Eropa pertama kali dengan budget efisien.',
      'Informasikan bahwa pengumuman di kapal Eropa dilakukan dalam multi-bahasa (Italia, Inggris, Prancis, Spanyol, Jerman) dengan nuansa internasional yang meriah.'
    ],
    dressCode: 'Casual sehari-hari + 1 Gala/White Night.',
    websiteUrl: 'https://www.costacruises.com',
    accentColor: '#eab308',
    sortOrder: 80,
    isActive: true,
    updatedBy: 'System Seed'
  },
  {
    id: 'holland-america-line',
    brandName: 'Holland America Line',
    tagline: 'Klasik, berkelas & kaya wawasan destinasi — pilihan favorit lansia, pencinta musik live & Alaska.',
    segment: 'Premium',
    budgetTier: 4,
    featuredShips: [
      {
        name: 'Westerdam',
        tonnage: '82.348 GT',
        capacity: '1.964 tamu',
        yearBuilt: '2004 (Refurb)',
        highlight: 'Kapal ukuran menengah yang intim untuk rute panjang Asia (Singapura–Jepang–Hong Kong–Thailand 14N)'
      },
      {
        name: 'Koningsdam',
        tonnage: '99.863 GT',
        capacity: '2.650 tamu',
        yearBuilt: '2016',
        highlight: "Pinnacle Class dengan Music Walk (B.B. King's Blues Club, Rolling Stone Lounge) — unggulan Alaska"
      }
    ],
    homeports: ['Vancouver / Seattle (Alaska)', 'Singapore / Yokohama / Hong Kong', 'Amsterdam / Rotterdam'],
    regions: ['alaska', 'japan-korea', 'singapore-sea', 'europe-med', 'australia-nz'],
    targetProfiles: ['senior', 'honeymoon'],
    halalStatus: 'Pre-Order Halal',
    halalNotes: 'Dapat mengajukan permintaan Halal / Kosher / dietary khusus minimal 60–90 hari sebelum pelayaran melalui Ship Services.',
    gratuityCurrency: 'USD',
    gratuityStandard: 17,
    gratuitySuite: 19,
    gratuityNotes:
      'USD 17/orang/malam (Standard–Signature Suite); USD 19/orang/malam (Neptune & Pinnacle Suite). Tersedia paket Have It All (Shore Excursions + Drinks + Specialty Dining + WiFi).',
    minInfantMonths: 6,
    pregnancyMaxWeeks: 23,
    minBookingAge: 21,
    vipClubName: 'Club Orange / Neptune Lounge',
    typicalDurations: ['7N', '10N', '14N'],
    highlights: [
      'Ukuran kapal sedang (<2.700 tamu): jalan dari kamar ke restoran dekat & nyaman untuk tamu lansia',
      'Pengalaman destinasi paling mendalam + izin terbanyak berlayar ke Glacier Bay Alaska',
      'Music Walk terkenal: pertunjukan blues, rock & klasik live setiap malam',
      'Kabin umumnya sedikit lebih lega dengan ruang penyimpanan baik untuk pelayaran panjang 10–14 malam'
    ],
    inclusions: [
      'Akomodasi kabin dengan fasilitas ramah senior',
      'Main Dining Room, Lido Market Buffet, Dive-In Burger & New York Deli',
      'Pertunjukan Music Walk, kelas memasak & seminar destinasi'
    ],
    salesTips: [
      'Rekomendasi nomor #1 untuk klien pensiunan / orang tua yang mengutamakan kenyamanan, ketenangan, dan rute panjang tanpa keriuhan kapal waterpark.',
      'Tawarkan paket Have It All karena sudah mencakup kredit Shore Excursion yang sangat terpakai di rute Alaska & Eropa Utara.'
    ],
    dressCode: 'Smart Casual + 1–2 Dressy Nights per minggu.',
    websiteUrl: 'https://www.hollandamerica.com',
    accentColor: '#1e3a8a',
    sortOrder: 90,
    isActive: true,
    updatedBy: 'System Seed'
  },
  {
    id: 'silversea-cruises',
    brandName: 'Silversea Cruises',
    tagline: 'Ultra-Luxury All-Inclusive — semua kamar adalah Suite dengan Butler pribadi, minuman premium & gratuity sudah termasuk.',
    segment: 'Ultra-Luxury',
    budgetTier: 5,
    featuredShips: [
      {
        name: 'Silver Nova & Silver Ray',
        tonnage: '54.700 GT',
        capacity: '728 tamu',
        yearBuilt: '2023–2024',
        highlight: 'Desain asimetris penuh kaca dengan rasio ruang-per-tamu tertinggi & konsep kuliner S.A.L.T.'
      },
      {
        name: 'Silver Muse',
        tonnage: '40.700 GT',
        capacity: '596 tamu',
        yearBuilt: '2017',
        highlight: 'Rute eksklusif Jepang, Asia Tenggara, Australia & Mediterania dengan 8 restoran fine dining'
      }
    ],
    homeports: ['Singapore / Tokyo / Hong Kong', 'Monte Carlo / Rome / Athens', 'Vancouver / Seward (Alaska)', 'Sydney / Auckland'],
    regions: ['singapore-sea', 'japan-korea', 'europe-med', 'alaska', 'australia-nz'],
    targetProfiles: ['luxury', 'honeymoon', 'senior'],
    halalStatus: 'Pre-Order Halal',
    halalNotes:
      'Tim kuliner fine-dining & butler siap mengakomodasi permintaan Halal/dietary personal secara bespoke (wajib diinformasikan minimal 60–90 hari sebelumnya saat booking).',
    gratuityCurrency: 'Included',
    gratuityStandard: 0,
    gratuitySuite: 0,
    gratuityNotes:
      'ALL-INCLUSIVE: Gratuity/Tipping, fine dining, champagne & minuman premium, WiFi, layanan Butler pribadi, dan 1 shore excursion/pelabuhan (tarif All-Inclusive) SUDAH TERMASUK!',
    minInfantMonths: 6,
    pregnancyMaxWeeks: 23,
    minBookingAge: 18,
    vipClubName: 'All-Suite Butler Service',
    typicalDurations: ['7N', '10N', '12N', '14N'],
    highlights: [
      '100% All-Suite dengan Butler pribadi untuk setiap kamar (termasuk bongkar-pasang koper & reservasi khusus)',
      'Bebas pusing biaya tambahan: tipping, fine dining, minuman premium, WiFi & shore excursion dasar sudah termasuk',
      'Rasio staf hampir 1:1 dengan tamu — pelayanan sangat personal & intim tanpa antre',
      'Kapal berukuran butik bisa sandar langsung di pusat kota/pelabuhan ikonik yang tidak bisa dimasuki kapal besar'
    ],
    inclusions: [
      '100% Oceanview/Veranda Suite dengan Butler 24 jam & minibar diisi sesuai selera tamu',
      'Gratuities / Tipping sudah termasuk sepenuhnya',
      'Fine dining di restoran utama & mayoritas restoran spesialisasi + champagne & minuman premium sepanjang hari',
      'WiFi & opsi Door-to-Door transfer (khusus tarif Door-to-Door) serta shore excursion inklusif'
    ],
    salesTips: [
      'Cocok untuk klien VVIP, C-Level, keluarga pengusaha, atau Honeymoon luxury yang tidak ingin repot menghitung biaya tambahan di atas kapal.',
      'Tekankan ke klien bahwa jika dibandingkan total biaya Suite kapal mainstream + minuman + WiFi + gratuity + excursion, harga All-Inclusive Silversea sering kali sangat sepadan dengan kualitas jauh di atasnya!'
    ],
    dressCode: 'Elegant Casual di malam hari + 1–2 Formal Optional nights pada pelayaran 7+ malam.',
    websiteUrl: 'https://www.silversea.com',
    accentColor: '#7c3aed',
    sortOrder: 100,
    isActive: true,
    updatedBy: 'System Seed'
  }
];

export const SEED_CRUISE_GUIDES = BASE_SEED_CRUISE_GUIDES.map((guide) => ({
  ...guide,
  featuredShips: COMPLETE_FLEETS_BY_BRAND[guide.id] || guide.featuredShips
}));
