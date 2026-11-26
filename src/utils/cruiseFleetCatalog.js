/**
 * Complete Operating Fleet Catalog (149 Active Ships across 10 Major Cruise Brands, 2025/2026).
 * Verified active vessels only (excludes retired/transferred ships).
 *
 * Compact helper `s(...)` builds canonical per-ship sales intelligence objects:
 *   { name, shipClass, tonnage, capacity, decks, yearBuilt, deployment, bestFor, highlight }
 */

const s = (name, shipClass, tonnage, capacity, decks, yearBuilt, deployment, bestFor, highlight) => ({
  name,
  shipClass,
  tonnage,
  capacity,
  decks,
  yearBuilt,
  deployment,
  bestFor,
  highlight
});

export const COMPLETE_FLEETS_BY_BRAND = {
  // 1. DISNEY CRUISE LINE — 8 Active Ships (2025/2026)
  'disney-cruise-line': [
    s(
      'Disney Adventure',
      'Global Class',
      '208.000 GT',
      '6.700 tamu',
      20,
      '2026',
      'Singapura (Homeport Sepanjang Tahun)',
      'Keluarga Asia, Fans Disney & Marvel',
      'Kapal Disney terbesar & pertama berbasis di Singapura! 7 area tematik: Marvel Landing (Ironcycle Test Run coaster), Disney Imagination Garden, San Fransokyo Street, Toy Story Place & Wayfinder Bay.'
    ),
    s(
      'Disney Destiny',
      'Wish Class',
      '144.000 GT',
      '4.000 tamu',
      15,
      '2025',
      'Fort Lauderdale / Bahama & Karibia',
      'Keluarga & Fans Heroes/Villains',
      'Tema "Heroes & Villains" (Black Panther, Lion King Pride Lands Dining, Cruella, Pirates of the Caribbean lounge & AquaMouse water coaster).'
    ),
    s(
      'Disney Treasure',
      'Wish Class',
      '144.000 GT',
      '4.000 tamu',
      15,
      '2024',
      'Port Canaveral / Karibia 7N',
      'Keluarga & Petualangan',
      'Grand Hall terinspirasi Aladdin, restoran Plaza de Coco, Haunted Mansion Parlor, Jungle Cruise lounge & pertunjukan Broadway Moana.'
    ),
    s(
      'Disney Wish',
      'Wish Class',
      '144.000 GT',
      '4.000 tamu',
      15,
      '2022',
      'Port Canaveral / Bahama 3N–4N',
      'First-Timer Disney & Keluarga',
      'AquaMouse atraksi air pertama Disney, restoran Arendelle: A Frozen Dining Adventure, Worlds of Marvel & Star Wars Hyperspace Lounge.'
    ),
    s(
      'Disney Fantasy',
      'Dream Class',
      '129.690 GT',
      '4.000 tamu',
      14,
      '2012',
      'Karibia & Eropa (Musiman)',
      'Keluarga Liburan 5N–7N',
      'AquaDuck water coaster kaca melingkari deck, Animator\'s Palate interaktif, pertunjukan Aladdin & Frozen serta Europa adult district.'
    ),
    s(
      'Disney Dream',
      'Dream Class',
      '129.690 GT',
      '4.000 tamu',
      14,
      '2011 (Refurb 2024)',
      'Bahama, Karibia & Eropa',
      'Keluarga & Multi-Generasi',
      'AquaDuck water coaster, Beauty and the Beast musical, Millennium Falcon kids zone & kabin dalam dengan Magical Porthole virtual.'
    ),
    s(
      'Disney Wonder',
      'Classic Class',
      '84.130 GT',
      '2.713 tamu',
      11,
      '1999 (Refurb 2019)',
      'Alaska, Australia & Selandia Baru',
      'Keluarga Scenic & Alaska/ANZ',
      'Ukuran lebih intim untuk rute Alaska & Australia/NZ; memiliki Tiana\'s Place (Princess and the Frog live jazz dining) & Frozen stage musical.'
    ),
    s(
      'Disney Magic',
      'Classic Class',
      '83.969 GT',
      '2.713 tamu',
      11,
      '1998 (Refurb 2023)',
      'Bahama, Karibia & Mediterania',
      'Keluarga & Fans Klasik Disney',
      'Kapal pertama Disney dengan Rapunzel\'s Royal Table dining, Tangled: The Musical, AquaDunk drop slide & Soul Cat Lounge.'
    )
  ],

  // 2. STARDREAM / RESORTS WORLD CRUISES — 3 Active Ships (2025/2026)
  'stardream-cruises': [
    s(
      'Genting Dream',
      'Dream Class (Dream Cruises)',
      '150.695 GT',
      '3.352 tamu',
      18,
      '2016',
      'Singapura (MBCCS) & Port Klang — Sepanjang Tahun',
      'Keluarga Muslim (Halal), First-Timer & Incentive',
      'Flagship Asia Tenggara dengan dapur bersertifikat Halal JAKIM di The Lido, ruang salat, The Palace VIP Butler Enclave, Waterslide Park 6 seluncuran, Zipline & Zouk Beach Club.'
    ),
    s(
      'Star Voyager',
      'Sun Class (Star Cruises)',
      '77.441 GT',
      '1.940 tamu',
      14,
      '1997 (Refurb 2025)',
      'Singapura, Jakarta (Musiman), Melaka, Bangkok, Ho Chi Minh, HK',
      'Value Asia Tenggara & Liburan Singkat',
      'Sebelumnya dikenal sebagai Star Scorpio/Pacific Explorer; rute fleksibel Asia Tenggara (termasuk musiman dari Jakarta/Tanjung Priok & Singapura) dengan kuliner Asia & Palace Suites.'
    ),
    s(
      'Star Navigator',
      'Leo Class (Star Cruises)',
      '75.338 GT',
      '1.856 tamu',
      13,
      '1999 (Refurb 2025)',
      'Keelung/Kaohsiung (Taiwan), Jepang (Okinawa/Kyushu) & Hong Kong',
      'Wisata Asia Timur & Kuliner Oriental',
      'Sebelumnya beroperasi sebagai Resorts World One; fokus pelayaran ramah keluarga Asia Timur (Taiwan–Jepang–Hong Kong) dengan Caesar\'s Slide, Parthenon Pool & The Palace.'
    )
  ],

  // 3. ROYAL CARIBBEAN INTERNATIONAL — 30 Active Ships (7 Classes, 2025/2026)
  'royal-caribbean': [
    // Icon Class (3)
    s(
      'Legend of the Seas',
      'Icon Class',
      '250.800 GT',
      '5.610 tamu',
      20,
      '2026',
      'Mediterania Barat (Barcelona/Rome) & Karibia',
      'Keluarga Mega-Resort & Eropa Modern',
      'Kapal Icon Class ketiga & pertama yang berlayar di Eropa (Mediterania) sebelum ke Karibia; 8 neighborhoods, Category 6 waterpark & Crown\'s Edge.'
    ),
    s(
      'Star of the Seas',
      'Icon Class',
      '248.663 GT',
      '5.610 tamu',
      20,
      '2025',
      'Port Canaveral / Karibia 7N',
      'Keluarga & Multi-Generasi',
      'Saudara kembar Icon of the Seas dengan 6 seluncuran Category 6, Surfside family neighborhood, AquaDome raksasa & 40+ restoran/bar.'
    ),
    s(
      'Icon of the Seas',
      'Icon Class',
      '248.663 GT',
      '5.610 tamu',
      20,
      '2024',
      'Miami / Karibia & Perfect Day at CocoCay',
      'Keluarga Ultimate Bucket-List',
      'Kapal pesiar pelopor generasi terbesar di dunia: 7 kolam renang, waterpark terbesar di laut (Category 6), AquaDome, Central Park & Ultimate Family Townhouse 3 lantai.'
    ),
    // Oasis Class (6)
    s(
      'Utopia of the Seas',
      'Oasis Class',
      '236.473 GT',
      '5.668 tamu',
      18,
      '2024',
      'Port Canaveral / Bahama 3N–4N',
      'Anak Muda, Grup & Liburan Singkat',
      'Kapal Oasis Class pertama khusus pelayaran 3–4 malam weekend; punya Royal Railway immersive train dining, perosotan kering Ultimate Abyss terpanjang & Pesky Parrot bar.'
    ),
    s(
      'Wonder of the Seas',
      'Oasis Class',
      '236.860 GT',
      '5.734 tamu',
      18,
      '2022',
      'Port Canaveral / Miami (Karibia)',
      'Keluarga Besar & Hiburan Spektakuler',
      'Oasis Class dengan 8 neighborhood termasuk Suite Neighborhood privat, Mason Jar Southern dining, Wonder Playscape & AquaTheater show.'
    ),
    s(
      'Symphony of the Seas',
      'Oasis Class',
      '228.081 GT',
      '5.518 tamu',
      18,
      '2018',
      'Miami / New Jersey (Karibia & Bahama)',
      'Keluarga & Pencinta Broadway Show',
      'Pertunjukan musikal Hairspray, Hiro di AquaTheater, Ultimate Abyss, Bionic Bar robot bartender & Ultimate Family Suite dengan perosotan di dalam kamar.'
    ),
    s(
      'Harmony of the Seas',
      'Oasis Class',
      '226.963 GT',
      '5.479 tamu',
      18,
      '2016',
      'Galveston / Eropa (Musiman)',
      'Keluarga & Grup Wisata',
      'Perpaduan Central Park rimbun, Boardwalk, 3 seluncuran Perfect Storm, Ultimate Abyss 10 deck & musikal Broadway Grease.'
    ),
    s(
      'Allure of the Seas',
      'Oasis Class',
      '225.282 GT',
      '5.400 tamu',
      18,
      '2010 (Amplified 2025)',
      'Eropa (Barcelona/Rome) & Karibia',
      'Keluarga & First-Timer Eropa',
      'Baru selesai renovasi besar Royal Amplified 2025: kini dilengkapi Ultimate Abyss, Perfect Storm waterpark, Pesky Parrot & musikal Mamma Mia!'
    ),
    s(
      'Oasis of the Seas',
      'Oasis Class',
      '226.838 GT',
      '5.400 tamu',
      18,
      '2009 (Amplified 2019)',
      'Fort Lauderdale / Karibia',
      'Keluarga & Pencinta Hiburan',
      'Pelopor konsep 7 neighborhood (Central Park & Boardwalk), sudah di-upgrade dengan Ultimate Abyss, Perfect Storm, Portside BBQ & musikal Cats.'
    ),
    // Quantum & Quantum Ultra Class (5)
    s(
      'Odyssey of the Seas',
      'Quantum Ultra Class',
      '167.704 GT',
      '4.198 tamu',
      16,
      '2021',
      'Eropa (Rome/Yunani) & New Jersey',
      'Keluarga & Pasangan Modern',
      'Quantum Ultra modern dengan SeaPlex indoor terbesar, North Star 360°, RipCord by iFLY, Teppanyaki, Giovanni\'s Italian Kitchen & Playmakers.'
    ),
    s(
      'Spectrum of the Seas',
      'Quantum Ultra Class',
      '169.379 GT',
      '4.246 tamu',
      16,
      '2019',
      'Shanghai, Hong Kong & Jepang–Korea',
      'Pasar Asia & Keluarga VIP',
      'Dirancang khusus untuk pasar Asia: memiliki Suite Enclave eksklusif di haluan, kuliner Sichuan Red & Hot Pot, North Star, iFLY & teater Two70°.'
    ),
    s(
      'Ovation of the Seas',
      'Quantum Class',
      '168.666 GT',
      '4.180 tamu',
      16,
      '2016',
      'Singapura (Musiman), Asia, Alaska & Los Angeles',
      'Keluarga Indonesia & First-Timer',
      'Favorit rute Singapura (3N–5N Penang/Phuket) & Alaska; dilengkapi kapsul kaca North Star, simulator terjun payung iFLY, FlowRider, bumper cars SeaPlex & Two70°.'
    ),
    s(
      'Anthem of the Seas',
      'Quantum Class',
      '168.666 GT',
      '4.180 tamu',
      16,
      '2015',
      'Singapura (Musiman), Australia & Alaska',
      'Keluarga & Pencinta Musikal',
      'Sangat populer di homeport Singapura & Sydney; menyuguhkan musikal We Will Rock You, North Star, iFLY, Bionic Bar & Solarium indoor ber-AC.'
    ),
    s(
      'Quantum of the Seas',
      'Quantum Class',
      '168.666 GT',
      '4.180 tamu',
      16,
      '2014',
      'Australia (Brisbane), Alaska & Los Angeles',
      'Keluarga & Aktivitas Modern',
      'Kapal pertama Quantum Class dengan North Star, RipCord by iFLY, SeaPlex roller skating/bumper cars, FlowRider & kabin Virtual Balcony.'
    ),
    // Freedom Class (3)
    s(
      'Independence of the Seas',
      'Freedom Class',
      '154.407 GT',
      '3.634 tamu',
      15,
      '2008 (Amplified 2018)',
      'Eropa Utara (Southampton) & Miami',
      'Keluarga & Remaja Aktif',
      'Dilengkapi Splashaway Bay waterpark anak, Perfect Storm dual slides, Laser Tag, Escape Room, FlowRider & gelanggang ice skating Studio B.'
    ),
    s(
      'Liberty of the Seas',
      'Freedom Class',
      '155.889 GT',
      '3.634 tamu',
      15,
      '2007 (Refurb 2021)',
      'New Jersey / Bermuda, Kanada & Eropa',
      'Keluarga Value & Grup',
      'Memiliki boomerang water slide Tidal Wave (unik di armada Royal), FlowRider, Royal Promenade, ice skating show & Splashaway Bay.'
    ),
    s(
      'Freedom of the Seas',
      'Freedom Class',
      '155.889 GT',
      '3.634 tamu',
      15,
      '2006 (Amplified 2020)',
      'Miami / Fort Lauderdale (Bahama & Karibia)',
      'Keluarga & Value 3N–5N',
      'Hasil renovasi US$116 juta: kolam gaya resort Caribbean, Perfect Storm slides, Splashaway Bay, Playmakers Sports Bar & El Loco Fresh.'
    ),
    // Voyager Class (5)
    s(
      'Mariner of the Seas',
      'Voyager Class',
      '138.279 GT',
      '3.114 tamu',
      15,
      '2003 (Amplified 2018)',
      'Galveston / Karibia',
      'Keluarga & Weekend Getaway',
      'Dilengkapi Perfect Storm water slides, FlowRider, Laser Tag, Escape Room, Bamboo Room tiki bar & Royal Promenade.'
    ),
    s(
      'Navigator of the Seas',
      'Voyager Class',
      '139.999 GT',
      '3.368 tamu',
      15,
      '2002 (Amplified 2019)',
      'Los Angeles / Meksiko & Singapura (2026/2027)',
      'Keluarga & Rute Asia/Pasifik',
      'Punya water coaster The Blaster terpanjang di laut, Riptide mat racer, kolam resort 2 tingkat, Hooked Seafood & dijadwalkan hadir di Singapura!'
    ),
    s(
      'Adventure of the Seas',
      'Voyager Class',
      '137.276 GT',
      '3.114 tamu',
      15,
      '2001 (Refurb 2018)',
      'Port Canaveral / Karibia 6N–8N',
      'Keluarga & Harga Kompetitif',
      'Menghadirkan FlowRider, Perfect Storm slides, Splashaway Bay, Studio B ice skating & Royal Promenade dengan harga lebih ramah dari Oasis Class.'
    ),
    s(
      'Explorer of the Seas',
      'Voyager Class',
      '137.308 GT',
      '3.286 tamu',
      15,
      '2000 (Refurb 2023)',
      'Eropa (Ravenna/Barcelona) & Karibia',
      'Keluarga & Rute Mediterania Timur',
      'Populer di rute Yunani–Kroasia–Italia dengan fasilitas FlowRider, water slides, ice skating, rock climbing & Royal Promenade.'
    ),
    s(
      'Voyager of the Seas',
      'Voyager Class',
      '137.276 GT',
      '3.602 tamu',
      15,
      '1999 (Amplified 2019)',
      'Australia (Sydney), Alaska & Eropa',
      'Keluarga & Rute Jarak Jauh',
      'Kapal perintis Royal Promenade yang telah direnovasi dengan Perfect Storm slides, FlowRider, Laser Tag, Vitality Spa & ice skating.'
    ),
    // Radiance Class (4)
    s(
      'Jewel of the Seas',
      'Radiance Class',
      '90.090 GT',
      '2.112 tamu',
      13,
      '2004 (Refurb 2022)',
      'Karibia Selatan (San Juan) & Eropa',
      'Pasangan & Pencinta Destinasi',
      'Penuh dinding kaca panorama laut & lift kaca, Solarium tenang khusus dewasa, Chops Grille & ukuran pas untuk pelabuhan eksotis.'
    ),
    s(
      'Serenade of the Seas',
      'Radiance Class',
      '90.090 GT',
      '2.146 tamu',
      13,
      '2003 (Refurb 2022)',
      'Alaska (Vancouver), Terusan Panama & Amerika Selatan',
      'Scenic Cruiser & Multi-Generasi',
      'Terkenal sebagai kapal Ultimate World Cruise; memiliki jendela kaca luas, kolam Solarium indoor-outdoor & suasana hangat tidak terlalu ramai.'
    ),
    s(
      'Brilliance of the Seas',
      'Radiance Class',
      '90.090 GT',
      '2.142 tamu',
      13,
      '2002 (Refurb 2023)',
      'Eropa (Yunani/Italia) & Karibia',
      'Pasangan & Destinasi Budaya',
      'Desain kaca panoramik dengan Centrum 9 lantai, meja biliar self-leveling gyroscopic, rock climbing & restoran Giovanni\'s Table.'
    ),
    s(
      'Radiance of the Seas',
      'Radiance Class',
      '90.090 GT',
      '2.143 tamu',
      13,
      '2001 (Refurb 2022)',
      'Alaska (Vancouver–Seward) & Australia/NZ',
      'Pencinta Alam & Lansia',
      'Dirancang untuk rute pemandangan dramatis (Alaska & Selandia Baru) dengan lebih dari 3 hektare bidang kaca & restoran outdoor Windjammer.'
    ),
    // Vision Class (4)
    s(
      'Vision of the Seas',
      'Vision Class',
      '78.340 GT',
      '2.050 tamu',
      11,
      '1998 (Refurb 2022)',
      'Baltimore / Bermuda, Bahama & Kanada',
      'Dewasa & Cruise Klasik Intim',
      'Suasana ramah & mudah dijelajahi tanpa jalan jauh; cocok untuk tamu yang menyukai pelayanan akrab & pelayaran santai.'
    ),
    s(
      'Enchantment of the Seas',
      'Vision Class',
      '82.910 GT',
      '2.252 tamu',
      11,
      '1997 (Refurb 2022)',
      'Tampa / Karibia Barat & Meksiko',
      'Value Cruiser & Pasangan',
      'Kapal Vision Class yang pernah diperpanjang sehingga area kolam & jembatan gantung deck atasnya lebih lega.'
    ),
    s(
      'Rhapsody of the Seas',
      'Vision Class',
      '78.878 GT',
      '2.040 tamu',
      11,
      '1997 (Refurb 2022)',
      'San Juan / Karibia Selatan & Mediterania',
      'Destinasi Port-Intensive & Value',
      'Ukuran ringkas mampu sandar di pelabuhan kecil Karibia & Eropa; memiliki Solarium tenang, Centrum akrobatik & Chops Grille.'
    ),
    s(
      'Grandeur of the Seas',
      'Vision Class',
      '73.817 GT',
      '1.992 tamu',
      11,
      '1996 (Refurb 2022)',
      'Tampa / Fort Lauderdale (Karibia)',
      'Lansia & Pencinta Cruise Tradisional',
      'Kapal paling klasik & intim di armada Royal Caribbean; fokus pelayanan hangat, hiburan teater & akses pelabuhan kecil.'
    )
  ],

  // 4. PRINCESS CRUISES — 17 Active Ships (4 Classes, 2025/2026)
  'princess-cruises': [
    // Sphere Class (2)
    s(
      'Star Princess',
      'Sphere Class',
      '177.882 GT',
      '4.300 tamu',
      21,
      '2025',
      'Mediterania, Karibia & Alaska (2026)',
      'Premium Modern & Multi-Generasi',
      'Kapal terbaru Princess bertenaga LNG dengan The Dome kubah kaca spektakuler, The Piazza 3 tingkat, Sanctuary Collection VIP & hiburan Spellbound.'
    ),
    s(
      'Sun Princess',
      'Sphere Class',
      '177.882 GT',
      '4.300 tamu',
      21,
      '2024',
      'Mediterania (Barcelona/Rome/Athens) & Karibia',
      'Pasangan, Keluarga Premium & Foodie',
      'Generasi baru Princess dengan The Dome kaca 2 lantai, Princess Arena teater fleksibel, Love by Britto fine dining & suite Signature/Sanctuary.'
    ),
    // Royal Class (6)
    s(
      'Discovery Princess',
      'Royal Class',
      '145.281 GT',
      '3.660 tamu',
      19,
      '2022',
      'Alaska (Seattle), Pasifik & Australia',
      'Keluarga Premium & Alaska',
      'Royal Class termuda dengan Sky Suites ber-balkon 270°, SeaWalk jembatan kaca di atas laut, Take Five jazz club & MedallionClass.'
    ),
    s(
      'Enchanted Princess',
      'Royal Class',
      '145.281 GT',
      '3.660 tamu',
      19,
      '2021',
      'Karibia, Kanada/New England & Mediterania',
      'Pasangan & Pencinta Kuliner',
      'Memiliki 2 Sky Suites megah, The Catch by Rudi seafood fine dining, Bistro Sur La Mer, 360° dining experience & The Enclave thermal spa.'
    ),
    s(
      'Sky Princess',
      'Royal Class',
      '145.281 GT',
      '3.660 tamu',
      19,
      '2019',
      'Eropa Utara (Southampton/Fjords) & Karibia',
      'Pasangan & Eropa Utara',
      'Desain khusus untuk MedallionClass sejak awal: Wakeview pool buritan, Sky Suites, Phantom Bridge escape room & Take Five jazz lounge.'
    ),
    s(
      'Majestic Princess',
      'Royal Class',
      '144.216 GT',
      '3.560 tamu',
      19,
      '2017 (Refurb 2025)',
      'Mediterania, Kanada & Australia/NZ',
      'Tamu Asia & Multi-Generasi',
      'Punya Hollywood Pool Club indoor ber-AC, restoran Harmony Cantonese & Noodle Bar (sangat ramah lidah Asia!) serta SeaWalk kaca.'
    ),
    s(
      'Regal Princess',
      'Royal Class',
      '142.229 GT',
      '3.560 tamu',
      19,
      '2014',
      'Inggris Raya (British Isles) & Galveston',
      'Pasangan & Wisata Sejarah Eropa',
      'Terkenal dengan rute keliling Inggris/Skotlandia/Irlandia; memiliki SeaWalk kaca, Piazza megah & Movies Under the Stars.'
    ),
    s(
      'Royal Princess',
      'Royal Class',
      '142.229 GT',
      '3.560 tamu',
      19,
      '2013',
      'Alaska (Seattle/Vancouver) & Australia',
      'Alaska & Multi-Generasi',
      'Pelopor SeaWalk jembatan kaca melayang 39m di atas laut, Princess Live! TV studio, Crown Grill & The Sanctuary dewasa.'
    ),
    // Grand Class (7)
    s(
      'Ruby Princess',
      'Grand Class',
      '113.561 GT',
      '3.080 tamu',
      19,
      '2008',
      'San Francisco / Alaska, Hawaii & Meksiko',
      'Lansia & Rute 10N–16N',
      'Rute pulang-pergi praktis dari San Francisco ke Alaska & Hawaii dengan The Sanctuary, Crown Grill, Sabatini\'s & Movies Under the Stars.'
    ),
    s(
      'Emerald Princess',
      'Grand Class',
      '113.561 GT',
      '3.080 tamu',
      19,
      '2007',
      'Eropa, Terusan Panama & Karibia',
      'Pasangan Dewasa & Destinasi',
      'Kapal nyaman berkapasitas ~3.000 tamu dengan Piazza bergaya Italia, International Cafe 24 jam & Skywalkers Nightclub panorama.'
    ),
    s(
      'Crown Princess',
      'Grand Class',
      '113.561 GT',
      '3.080 tamu',
      19,
      '2006',
      'Australia (Sydney/Brisbane) & World Cruise',
      'Rute Australia/NZ & Long Voyage',
      'Andalan pelayaran Australia, New Zealand & World Cruise dengan suasana elegan klasik & Lotus Spa.'
    ),
    s(
      'Caribbean Princess',
      'Grand Class',
      '112.894 GT',
      '3.140 tamu',
      19,
      '2004 (Refurb 2019)',
      'Alaska (Vancouver–Whittier) & Karibia',
      'Keluarga & Alaska',
      'Dilengkapi area anak Reef Family Splash Zone, Steamers Seafood, Planks BBQ & akses langsung ke Glacier Bay Alaska.'
    ),
    s(
      'Sapphire Princess',
      'Grand Class',
      '115.875 GT',
      '2.670 tamu',
      18,
      '2004 (Refurb 2022)',
      'Jepang/Asia (Musiman), Eropa Utara & Amerika Selatan',
      'Pasangan & Wisata Budaya',
      'Dibangun di galangan Mitsubishi Jepang; saudara kembar Diamond Princess dengan ruang kabin & area publik lapang.'
    ),
    s(
      'Diamond Princess',
      'Grand Class',
      '115.875 GT',
      '2.670 tamu',
      18,
      '2004 (Refurb 2019)',
      'Yokohama (Tokyo) — Jepang, Korea & Singapura (Musiman)',
      'Spesialis Jepang Sakura/Autumn & Lansia',
      'KAPAL PALING IKONIK RUTE JEPANG! Dibuat di Nagasaki, memiliki Izumi Japanese Bath (onsen tradisional terbesar di laut) & restoran Kai Sushi.'
    ),
    s(
      'Grand Princess',
      'Grand Class',
      '107.517 GT',
      '2.600 tamu',
      18,
      '1998 (Refurb 2019)',
      'Alaska, Australia & Karibia Selatan',
      'Lansia & Pencinta Cruise Klasik',
      'Ukuran nyaman dengan rasio ruang lega, banyak kabin balkon berundak, Piazza & The Sanctuary.'
    ),
    // Coral Class (2)
    s(
      'Island Princess',
      'Coral Class (Panamax)',
      '92.822 GT',
      '2.200 tamu',
      16,
      '2003',
      'World Cruise, Eropa & Terusan Panama',
      'Lansia & Pelayaran Panjang',
      'Dirancang khusus seukuran Terusan Panama; kapasitas lebih kecil (~2.200 tamu) sehingga nyaman & bisa merapat di pelabuhan unik dunia.'
    ),
    s(
      'Coral Princess',
      'Coral Class (Panamax)',
      '91.627 GT',
      '2.000 tamu',
      16,
      '2002',
      'Alaska (Glacier Bay), Terusan Panama & Australia',
      'Lansia, Scenic & Glacier Bay',
      'Salah satu kapal favorit untuk Alaska & Terusan Panama: deck observasi luas, Bayou Cafe & lebih dari 700 kabin balkon.'
    )
  ],

  // 5. MSC CRUISES — 24 Active Ships (6 Classes, 2025/2026)
  'msc-cruises': [
    // World Class (3)
    s(
      'MSC World Asia',
      'World Class',
      '215.863 GT',
      '5.264 tamu',
      22,
      '2026 (Akhir 2026)',
      'Mediterania Barat (Barcelona/Marseille/Genoa/Naples)',
      'Keluarga Modern & VIP Yacht Club',
      'Kapal World Class ketiga bertenaga LNG dengan sentuhan seni Asia, Promenade outdoor ber-LED, perosotan kering 12 deck & MSC Yacht Club terbesar.'
    ),
    s(
      'MSC World America',
      'World Class',
      '215.863 GT',
      '5.264 tamu',
      22,
      '2025',
      'Miami / Karibia & Ocean Cay MSC Marine Reserve',
      'Keluarga & Generasi Muda',
      'Flagship terbaru di Miami dengan 7 distrik tematik, ayunan ekstrem Cliffhanger di atas laut, Eataly di laut & Family Aventura.'
    ),
    s(
      'MSC World Europa',
      'World Class',
      '215.863 GT',
      '5.264 tamu',
      22,
      '2022',
      'Mediterania Barat (Barcelona–Marseille–Genoa–Naples–Malta)',
      'Keluarga, First-Timer Eropa & Yacht Club',
      'Flagship futuristik Mediterania: World Promenade ikonik, perosotan kering Venom Drop 11 deck, 33 restoran/bar & MSC Yacht Club mewah.'
    ),
    // Meraviglia / Meraviglia-Plus Class (5)
    s(
      'MSC Euribia',
      'Meraviglia-Plus Class',
      '184.011 GT',
      '4.842 tamu',
      19,
      '2023',
      'Norwegian Fjords (Eropa Utara) & Dubai/Timur Tengah',
      'Keluarga, Fjords & Dubai (Halal-Friendly)',
      'Kapal bertenaga LNG dengan lukisan lambung ikonik #SaveTheSea, kubah LED 93m, Ocean Cay Aquapark & sangat populer di rute Dubai + Fjords.'
    ),
    s(
      'MSC Virtuosa',
      'Meraviglia-Plus Class',
      '181.541 GT',
      '4.842 tamu',
      19,
      '2021',
      'Eropa Utara (Southampton/Fjords) & Karibia Selatan',
      'Keluarga & Pencinta Teknologi',
      'Memiliki bartender robot humanoid pertama di laut (Rob di MSC Starship Club), kubah LED Galleria & Carousel Lounge.'
    ),
    s(
      'MSC Grandiosa',
      'Meraviglia-Plus Class',
      '181.541 GT',
      '4.842 tamu',
      19,
      '2019',
      'Mediterania, Karibia & Brasil',
      'Keluarga & Grup Wisata Eropa',
      'Promenade indoor LED raksasa, 2 pertunjukan akrobat Carousel Productions, Polar Aquapark & Yacht Club lengkap.'
    ),
    s(
      'MSC Bellissima',
      'Meraviglia Class',
      '171.598 GT',
      '4.488 tamu',
      19,
      '2019',
      'Tokyo (Yokohama), Jepang, Korea & Taiwan',
      'Keluarga Indonesia & Rute Jepang Value',
      'KAPAL PALING LARIS MSC DI ASIA! Berbasis musiman di Tokyo/Keelung dengan kubah LED 96m, LEGO Kids Club, Arizona Aquapark & MSC Yacht Club.'
    ),
    s(
      'MSC Meraviglia',
      'Meraviglia Class',
      '171.598 GT',
      '4.488 tamu',
      19,
      '2017',
      'New York / Bahama, Bermuda & Kanada',
      'Keluarga & Berangkat dari New York',
      'Berlayar sepanjang tahun dari Brooklyn (New York) dengan Galleria LED, bowling full-size, Polar Aquapark & Yacht Club.'
    ),
    // Seaside / Seaside-EVO Class (4)
    s(
      'MSC Seascape',
      'Seaside-EVO Class',
      '170.400 GT',
      '4.540 tamu',
      20,
      '2022',
      'Miami / Galveston (Karibia)',
      'Pencinta Sun Deck & Wahana Seru',
      'Punya wahana lengan robot ekstrem ROBOTRON di deck atas, promenade kaca pinggir air & Bridge of Sighs lantai kaca.'
    ),
    s(
      'MSC Seashore',
      'Seaside-EVO Class',
      '170.400 GT',
      '4.540 tamu',
      20,
      '2021',
      'Port Canaveral / Bahama & Karibia 3N–7N',
      'Keluarga & Liburan Pantai',
      'Tema desain New York (Times Square 4 deck & replika Patung Liberty), kolam infinity buritan & Yacht Club ekstra luas.'
    ),
    s(
      'MSC Seaview',
      'Seaside Class',
      '153.516 GT',
      '4.132 tamu',
      20,
      '2018',
      'Mediterania Barat & Amerika Selatan',
      'Keluarga & Musim Panas Mediterania',
      'Dirancang memaksimalkan ruang outdoor tepi laut dengan Waterfront Boardwalk 360°, zipline & lift kaca panorama.'
    ),
    s(
      'MSC Seaside',
      'Seaside Class',
      '153.516 GT',
      '4.132 tamu',
      20,
      '2017',
      'Miami / Mediterania (Musiman)',
      'Keluarga & Pencinta Kolam/Pantai',
      'Konsep "Ship that Follows the Sun" dengan area outdoor sangat luas, Forest Aquaventure Park & MSC Yacht Club.'
    ),
    // Fantasia Class (4)
    s(
      'MSC Preziosa',
      'Fantasia Class',
      '139.072 GT',
      '3.502 tamu',
      18,
      '2013',
      'Eropa Utara (Hamburg/Fjords) & Amerika Selatan',
      'Keluarga Value & Eropa Utara',
      'Punya tangga kristal Swarovski, seluncuran air Vertigo transparan yang menjorok ke laut & MSC Yacht Club.'
    ),
    s(
      'MSC Divina',
      'Fantasia Class',
      '139.072 GT',
      '3.502 tamu',
      18,
      '2012',
      'Mediterania & Miami (Karibia)',
      'Pasangan & Penggemar Gaya Italia',
      'Terinspirasi Sophia Loren dengan kolam infinity Garden Pool, tangga Swarovski, Eataly & MSC Yacht Club elegan.'
    ),
    s(
      'MSC Splendida',
      'Fantasia Class',
      '137.936 GT',
      '3.274 tamu',
      18,
      '2009',
      'Mediterania Timur & Amerika Selatan',
      'Keluarga Value & Grup',
      'Interior klasik Italia yang mewah dengan Aurea Spa bergaya Bali, 4 kolam renang & MSC Yacht Club.'
    ),
    s(
      'MSC Fantasia',
      'Fantasia Class',
      '137.936 GT',
      '3.274 tamu',
      18,
      '2008',
      'Mediterania Timur (Yunani/Kroasia/Italia)',
      'First-Timer Eropa Hemat',
      'Kapal pertama MSC yang memperkenalkan konsep VIP MSC Yacht Club, tangga Swarovski & alun-alun Piazza Italia.'
    ),
    // Musica Class (4)
    s(
      'MSC Magnifica',
      'Musica Class',
      '95.128 GT',
      '2.518 tamu',
      16,
      '2010 (Refurb 2025)',
      'World Cruise, Mediterania & Eropa Utara',
      'Pelayaran Panjang & Pasangan',
      'Dilengkapi kolam renang beratap kaca geser (Magrodome) sehingga nyaman di cuaca dingin; rutin melayani MSC World Cruise.'
    ),
    s(
      'MSC Poesia',
      'Musica Class',
      '92.627 GT',
      '2.550 tamu',
      16,
      '2008 (Refurb 2026)',
      'Alaska (Seattle — Baru 2026!) & Eropa Utara',
      'Alaska Value & Eropa',
      'Ditugaskan perdana membuka rute Alaska MSC dari Seattle tahun 2026 dengan upgrade MSC Yacht Club, Zen Garden & Kaito Sushi.'
    ),
    s(
      'MSC Orchestra',
      'Musica Class',
      '92.409 GT',
      '2.550 tamu',
      16,
      '2007',
      'Mediterania Barat & Kepulauan Canary',
      'Value Eropa & Grup',
      'Ukuran menengah yang praktis dengan restoran Shanghai Chinese, spa bergaya Bali & hiburan gaya Eropa.'
    ),
    s(
      'MSC Musica',
      'Musica Class',
      '92.409 GT',
      '2.550 tamu',
      16,
      '2006',
      'Mediterania, Afrika Selatan & Amerika Selatan',
      'Value & Destinasi Unik',
      'Atrium air terjun 3 tingkat dengan piano transparan, Kaito Sushi Bar & banyak pilihan kabin balkon terjangkau.'
    ),
    // Lirica Class (4)
    s(
      'MSC Sinfonia',
      'Lirica Class',
      '65.542 GT',
      '2.199 tamu',
      13,
      '2005 (Refurb 2015)',
      'Mediterania Timur (Bari/Venice/Yunani)',
      'Wisata Pelabuhan Yunani Hemat',
      'Ukuran ramping memungkinkan sandar di pulau-pulau indah Yunani & Adriatik dengan tarif sangat ramah budget.'
    ),
    s(
      'MSC Opera',
      'Lirica Class',
      '65.591 GT',
      '2.150 tamu',
      13,
      '2004 (Refurb 2015)',
      'Mediterania Timur & Kepulauan Canary',
      'Value & Destinasi Pelabuhan Kecil',
      'Suasana intim bergaya klasik Eropa dengan Spray Park untuk anak-anak & akses mudah ke pelabuhan historis.'
    ),
    s(
      'MSC Lirica',
      'Lirica Class',
      '65.591 GT',
      '1.984 tamu',
      13,
      '2003 (Refurb 2015)',
      'Mediterania Timur (Venice/Kotor/Mykonos/Santorini)',
      'Pasangan & Budget Eropa',
      'Kapal butik-menengah yang lincah menjelajah Adriatik & Kepulauan Yunani dengan suasana ramah tidak penuh sesak.'
    ),
    s(
      'MSC Armonia',
      'Lirica Class',
      '65.542 GT',
      '1.932 tamu',
      13,
      '2001 (Refurb 2014)',
      'Mediterania Timur & Amerika Selatan',
      'First-Timer Budget & Destinasi',
      'Kapasitas paling ringkas di MSC, ideal untuk itinerary port-intensive Mediterania dengan harga kompetitif.'
    )
  ],

  // 6. CELEBRITY CRUISES — 15 Active Ships (4 Classes, 2025/2026)
  'celebrity-cruises': [
    // Edge Series (5)
    s(
      'Celebrity Xcel',
      'Edge Series',
      '140.600 GT',
      '3.260 tamu',
      17,
      '2025',
      'Fort Lauderdale (Karibia) & Mediterania (2026)',
      'Honeymoon, Pasangan & Modern Luxury',
      'Kapal Edge Series terbaru! Menghadirkan The Bazaar pengalaman destinasi di kapal, Magic Carpet melayang, Infinite Veranda & The Retreat VIP.'
    ),
    s(
      'Celebrity Ascent',
      'Edge Series',
      '140.600 GT',
      '3.260 tamu',
      17,
      '2023',
      'Mediterania (Barcelona/Rome/Athens) & Karibia',
      'Honeymoon & Pencinta Kuliner',
      'Desain resort bintang 5: Rooftop Garden dengan 2 kolam melayang, restoran Fine Cut Steakhouse & Le Voyage by Chef Daniel Boulud.'
    ),
    s(
      'Celebrity Beyond',
      'Edge Series',
      '141.420 GT',
      '3.260 tamu',
      17,
      '2022',
      'Miami / Fort Lauderdale (Karibia)',
      'Pasangan Mapan & VIP Retreat',
      'Lebih panjang dari Edge dengan Sunset Bar 2 lantai karya Nate Berkus, Le Voyage fine dining & The Retreat Sundeck 2 tingkat.'
    ),
    s(
      'Celebrity Apex',
      'Edge Series',
      '130.818 GT',
      '2.910 tamu',
      16,
      '2020',
      'Eropa Utara (Southampton/Fjords) & Karibia',
      'Pasangan & Eropa Modern',
      'Dilengkapi Magic Carpet, Eden lounge 3 lantai, Craft Social gastrobar & 4 Main Dining Room berbeda dalam 1 harga.'
    ),
    s(
      'Celebrity Edge',
      'Edge Series',
      '130.818 GT',
      '2.918 tamu',
      16,
      '2018',
      'Alaska (Seattle) & Australia/New Zealand',
      'Alaska Modern & Australia/NZ',
      'Pelopor desain menghadap laut: Infinite Veranda, platform oranye Magic Carpet & beroperasi di rute primadona Alaska + Sydney!'
    ),
    // Solstice Series (5)
    s(
      'Celebrity Reflection',
      'Solstice Series',
      '125.366 GT',
      '3.046 tamu',
      17,
      '2012',
      'Fort Lauderdale / Bahama & Karibia 3N–4N',
      'Pasangan & Short Luxury Getaway',
      'Solstice Series terbesar dengan The Lawn Club (rumput hijau asli di deck atas!), Lawn Club Grill & Reflection Suite berkamar mandi kaca panorama.'
    ),
    s(
      'Celebrity Silhouette',
      'Solstice Series',
      '122.210 GT',
      '2.902 tamu',
      16,
      '2011 (Revolutionized 2020)',
      'Islandia/Eropa Utara & Karibia',
      'Pasangan & Wisata Alam Eropa',
      'Sudah direnovasi dengan The Retreat Lounge & Sundeck, The Lawn Club, Porch seafood & Craft Social.'
    ),
    s(
      'Celebrity Eclipse',
      'Solstice Series',
      '121.878 GT',
      '2.852 tamu',
      16,
      '2010',
      'Eropa Utara (Amsterdam), Kanada & Karibia',
      'Dewasa & Multi-Generasi Tenang',
      'Atmosfer elegan & tenang dengan The Lawn Club, Qsine Le Petit Chef (proyeksi 3D di atas piring makan!) & Martini Bar.'
    ),
    s(
      'Celebrity Equinox',
      'Solstice Series',
      '121.878 GT',
      '2.852 tamu',
      16,
      '2009 (Revolutionized 2019)',
      'Mediterania (Barcelona/Rome/Lisbon) & Amerika Selatan',
      'Honeymoon & Kuliner Eropa',
      'Favorit pasangan Eropa; dilengkapi The Retreat, Hot Glass Class, Murano French fine dining & The Lawn Club.'
    ),
    s(
      'Celebrity Solstice',
      'Solstice Series',
      '121.878 GT',
      '2.852 tamu',
      16,
      '2008 (Refurb 2026)',
      'Singapura–Thailand–Vietnam–Hong Kong, Australia & Alaska',
      'Pasangan & Asia 12N',
      'SANGAT POPULER DI SINGAPURA! Melayani rute 12N Singapura–Bangkok–Ho Chi Minh–Hong Kong & Alaska dengan The Lawn Club dan AquaClass.'
    ),
    // Millennium Series (4)
    s(
      'Celebrity Constellation',
      'Millennium Series',
      '91.000 GT',
      '2.184 tamu',
      12,
      '2002 (Refurb 2024)',
      'Mediterania (Rome/Ravenna/Kroasia) & Tampa',
      'Dewasa & Rute Adriatik',
      'Ukuran sedang yang intim dengan Tuscan Grille, Sushi on Five, Spa Cafe & akses pelabuhan indah Italia–Kroasia.'
    ),
    s(
      'Celebrity Infinity',
      'Millennium Series',
      '91.000 GT',
      '2.170 tamu',
      12,
      '2001 (Refurb 2024)',
      'Yunani (Athens), Mediterania & Kepulauan Canary',
      'Pasangan & Wisata Yunani Sepanjang Tahun',
      'Salah satu kapal Celebrity yang aktif berlayar di Yunani & Mediterania bahkan di musim dingin (off-peak tanpa keramaian!).'
    ),
    s(
      'Celebrity Summit',
      'Millennium Series',
      '91.000 GT',
      '2.218 tamu',
      12,
      '2001 (Revolutionized 2019)',
      'Alaska (Vancouver–Seward) & Karibia Selatan',
      'Pasangan, Lansia & Alaska',
      'Telah melalui modernisasi total Revolutionized: kamar bergaya butik hotel, The Retreat Sundeck & rute one-way Alaska terbaik.'
    ),
    s(
      'Celebrity Millennium',
      'Millennium Series',
      '91.000 GT',
      '2.218 tamu',
      12,
      '2000 (Revolutionized 2019)',
      'Jepang (Tokyo/Osaka), Korea, Singapura & Bali',
      'Pasangan & Wisata Mendalam Jepang–Asia',
      'ANDALAN CELEBRITY DI ASIA! Melayani rute Tokyo–Mt. Fuji–Kyoto–Busan serta Singapura–Bali 12N–14N dengan kamar modern hasil Revolutionized.'
    ),
    // Expedition (1)
    s(
      'Celebrity Flora',
      'Galapagos Expedition',
      '5.739 GT',
      '100 tamu',
      7,
      '2019',
      'Kepulauan Galapagos (Ekuador) — Sepanjang Tahun',
      'VVIP Luxury & Ekspedisi Alam',
      'Mega-yacht All-Suite berkapasitas hanya 100 tamu khusus Galapagos: All-Inclusive, glamping di bawah bintang, kapal Zodiac & naturalis bersertifikat!'
    )
  ],

  // 7. NORWEGIAN CRUISE LINE (NCL) — 21 Active Ships (2025/2026)
  'norwegian-cruise-line': [
    // Prima Plus Class (2)
    s(
      'Norwegian Luna',
      'Prima Plus Class',
      '156.300 GT',
      '3.550 tamu',
      20,
      '2026',
      'Miami / Karibia Barat & Timur',
      'Keluarga Modern, Solo & The Haven',
      'Kapal terbaru NCL 2026: dilengkapi Aqua Slidecoaster (hybrid rollercoaster & water slide pertama di dunia), Ocean Boulevard 360° & The Haven.'
    ),
    s(
      'Norwegian Aqua',
      'Prima Plus Class',
      '156.300 GT',
      '3.571 tamu',
      20,
      '2025',
      'Port Canaveral / Miami & Bermuda',
      'Keluarga Aktif & Generasi Muda',
      'Memperkenalkan Aqua Slidecoaster 3 lantai, restoran Thailand pertama NCL (Sukhothai), Glow Court digital sports & Duplex Haven Suites.'
    ),
    // Prima Class (2)
    s(
      'Norwegian Viva',
      'Prima Class',
      '143.535 GT',
      '3.099 tamu',
      20,
      '2023',
      'Mediterania (Yunani/Italia/Turki) & Karibia',
      'Pasangan, Profesional & Eropa Modern',
      'Trek gokart 3 tingkat di laut, perosotan kering The Drop 10 lantai, Indulge Food Hall gratis & The Haven eksklusif.'
    ),
    s(
      'Norwegian Prima',
      'Prima Class',
      '143.535 GT',
      '3.099 tamu',
      20,
      '2022',
      'Eropa Utara (Islandia/Norwegia) & Galveston',
      'Pasangan & Modern Freestyle',
      'Pelopor Prima Class dengan Ocean Boulevard tepi air, jembatan kaca Oceanwalk, kolam infinity & Indulge Food Hall.'
    ),
    // Breakaway Plus Class (4)
    s(
      'Norwegian Encore',
      'Breakaway Plus Class',
      '169.116 GT',
      '3.998 tamu',
      20,
      '2019 (Refurb 2024)',
      'Seattle (Alaska) & Miami (Karibia)',
      'Keluarga & Alaska Spektakuler',
      'Favorit rute Alaska dengan Observation Lounge kaca 180°, trek gokart terpanjang di laut, Spice H2O & kabin Solo Studio.'
    ),
    s(
      'Norwegian Bliss',
      'Breakaway Plus Class',
      '168.028 GT',
      '4.004 tamu',
      20,
      '2018 (Refurb 2025)',
      'Seattle (Alaska) & Los Angeles (Meksiko)',
      'Keluarga & Alaska',
      'Dirancang khusus untuk pemandangan Alaska: Observation Lounge raksasa, trek gokart 2 tingkat, Solo Studio & musikal Jersey Boys/Icons.'
    ),
    s(
      'Norwegian Joy',
      'Breakaway Plus Class',
      '167.725 GT',
      '3.883 tamu',
      20,
      '2017 (Refurb 2024)',
      'Alaska (Seattle), Terusan Panama & Karibia',
      'Keluarga & Grup Multi-Generasi',
      'Baru selesai upgrade 2024 dengan Thermal Suite Mandara Spa terbesar di kelasnya, Observation Lounge, gokart & Vibe Beach Club.'
    ),
    s(
      'Norwegian Escape',
      'Breakaway Plus Class',
      '165.157 GT',
      '4.266 tamu',
      20,
      '2015 (Refurb 2022)',
      'New Orleans / Miami / New York (Karibia)',
      'Keluarga, Solo & Hiburan',
      'Memiliki The Waterfront promenade tepi laut, Ropes Course 3 tingkat, Aqua Park, Solo Studio Lounge & The Haven megah.'
    ),
    // Breakaway Class (2)
    s(
      'Norwegian Getaway',
      'Breakaway Class',
      '145.655 GT',
      '3.963 tamu',
      18,
      '2014 (Refurb 2024)',
      'New Orleans / Miami & Eropa (Musiman)',
      'Keluarga & First-Timer Freestyle',
      'Suasana tropis meriah dengan 5 seluncuran Free Fall, The Waterfront outdoor dining, Solo Studio & hiburan live.'
    ),
    s(
      'Norwegian Breakaway',
      'Breakaway Class',
      '145.655 GT',
      '3.963 tamu',
      18,
      '2013 (Refurb 2025)',
      'Mediterania (Barcelona/Venice) & New York',
      'Keluarga & Rute Eropa',
      'Baru direnovasi 2025 dengan bioskop/dining Silver Screen Bistro, Horizon Park, The Waterfront & 59 kabin Solo Studio.'
    ),
    // Epic Class (1)
    s(
      'Norwegian Epic',
      'Epic Class',
      '155.873 GT',
      '4.100 tamu',
      19,
      '2010 (Refurb 2025)',
      'Mediterania (Rome) & San Juan (Karibia Selatan)',
      'Solo Traveler & Value Eropa',
      'Pelopor kabin Solo Studio (128 kamar khusus solo tanpa single supplement!) plus Posh Beach Club, Aqua Park & The Haven.'
    ),
    // Jewel Class (4)
    s(
      'Norwegian Gem',
      'Jewel Class',
      '93.530 GT',
      '2.394 tamu',
      15,
      '2007 (Refurb 2022)',
      'Jacksonville / Bahama, Karibia & Eropa',
      'Dewasa & Value Santai',
      'Ukuran menengah favorit dengan arena bowling Bliss Lounge, 13 restoran Freestyle & The Haven intim.'
    ),
    s(
      'Norwegian Jade',
      'Jewel Class',
      '93.558 GT',
      '2.402 tamu',
      15,
      '2006 (Refurb 2022)',
      'Alaska (Vancouver–Whittier), Terusan Panama & Karibia',
      'Destinasi & Solo/Pasangan',
      'Kini dilengkapi kategori Solo cabins, O\'Sheehan\'s 24 jam, Jasmine Garden Asian dining & rute one-way Alaska.'
    ),
    s(
      'Norwegian Pearl',
      'Jewel Class',
      '93.530 GT',
      '2.394 tamu',
      15,
      '2006 (Refurb 2021)',
      'Mediterania Timur (Trieste/Athens) & Miami',
      'Wisata Yunani–Adriatik',
      'Kapal lincah untuk rute Kepulauan Yunani & Kroasia dengan bowling alley, Spinnaker Lounge & The Haven.'
    ),
    s(
      'Norwegian Jewel',
      'Jewel Class',
      '93.502 GT',
      '2.376 tamu',
      15,
      '2005 (Refurb 2022)',
      'Tampa / Karibia, Eropa & Musiman Asia',
      'Pasangan & Destinasi',
      'Nyaman dijelajahi, punya banyak pilihan restoran spesialisasi (Cagney\'s, Teppanyaki, Le Bistro) & kabin Solo.'
    ),
    // Dawn Class (2)
    s(
      'Norwegian Dawn',
      'Dawn Class',
      '92.250 GT',
      '2.340 tamu',
      15,
      '2002 (Refurb 2021)',
      'Eropa (Barcelona/Lisbon), Afrika & Karibia',
      'Destinasi Eksotis & Dewasa',
      'Spesialis rute eksotis (Afrika Selatan, Mauritius, Mediterania Barat) dengan suasana santai & Garden Villas megah.'
    ),
    s(
      'Norwegian Star',
      'Dawn Class',
      '91.740 GT',
      '2.348 tamu',
      15,
      '2001 (Refurb 2021)',
      'Eropa Utara (Islandia/Greenland) & Amerika Selatan/Antartika',
      'Petualangan & Destinasi Unik',
      'Andalan rute Islandia, Greenland, Patagonia & Kepulauan Falkland dengan Spice H2O dewasa & Freestyle Dining.'
    ),
    // Sun Class (2)
    s(
      'Norwegian Sun',
      'Sun Class',
      '78.309 GT',
      '1.936 tamu',
      12,
      '2001 (Refurb 2021)',
      'Asia (Singapura–Jepang–Thailand), Australia & Pasifik',
      'Rute Asia Panjang & Destinasi',
      'Aktif berlayar di Asia (Singapura, Jepang, Korea, Bali) & Pasifik Selatan dengan ukuran pas untuk pelabuhan eksotis.'
    ),
    s(
      'Norwegian Sky',
      'Sun Class',
      '77.104 GT',
      '2.004 tamu',
      12,
      '1999 (Refurb 2022)',
      'Asia (Singapura–Bali–Bangkok), Afrika & Eropa',
      'Destinasi Port-Intensive & Value',
      'Rutin melayani rute Singapura–Asia Tenggara–Timur Tengah & Eropa dengan durasi variatif dan suasana akrab.'
    ),
    // Standalone / Specialized (2)
    s(
      'Pride of America',
      'Hawaii Dedicated (US-Flag)',
      '80.439 GT',
      '2.186 tamu',
      15,
      '2005 (Refurb 2025)',
      'Honolulu (Hawaii) 7N Inter-Island — Sepanjang Tahun',
      'Bucket-List Hawaii (4 Pulau dalam 7 Hari)',
      'SATU-SATUNYA kapal pesiar besar yang berlayar pulang-pergi Honolulu mengunjungi 4 pulau Hawaii (Oahu, Maui, Big Island, Kauai) dengan 2 malam menginap di pelabuhan!'
    ),
    s(
      'Norwegian Spirit',
      'Spirit Class (Adults-Focused)',
      '75.904 GT',
      '2.018 tamu',
      14,
      '1998 (Renovasi Total US$100 Juta 2020)',
      'Asia (Tokyo–Seoul–Taipei–Singapura) & Australia/NZ',
      'Pasangan Dewasa & Rute Asia–Jepang',
      'Renovasi paling mewah di armada NCL (US$100 juta): dirancang khusus untuk tamu dewasa (tanpa waterpark anak), ada Mandara Spa Thermal Suite & restoran Onda.'
    )
  ],

  // 8. COSTA CRUISES — 8 Active Ships (2025/2026)
  'costa-cruises': [
    s(
      'Costa Toscana',
      'Excellence Class',
      '186.364 GT',
      '5.224 tamu',
      20,
      '2021',
      'Mediterania Barat (Barcelona–Marseille–Savona–Rome) & Dubai',
      'Keluarga, First-Timer Eropa & Foodie Italia',
      'Flagship modern bertenaga LNG dengan Colosseo panggung 3 lantai, 21 restoran/bar (termasuk Archipelago fine dining), Splash AcquaPark & nuansa Italia autentik.'
    ),
    s(
      'Costa Smeralda',
      'Excellence Class',
      '185.010 GT',
      '5.224 tamu',
      20,
      '2019',
      'Mediterania Barat & Dubai/Abu Dhabi (Musiman)',
      'Keluarga & Value Mediterania',
      'Saudara kembar Toscana: punya Museum Desain Italia (CoDe), Piazza di Spagna outdoor, Volare Skywalk & kuliner gelato/pizza Italia asli.'
    ),
    s(
      'Costa Diadema',
      'Diadema Class',
      '132.500 GT',
      '3.724 tamu',
      19,
      '2014',
      'Eropa Utara (Fjords/Kiel) & Amerika Selatan',
      'Keluarga Value & Fjords',
      'Julukan "Regina del Mediterraneo" dengan promenade outdoor 500m melingkari kapal, Birreria & Teppanyaki.'
    ),
    s(
      'Costa Fascinosa',
      'Concordia Class',
      '113.216 GT',
      '3.012 tamu',
      17,
      '2012 (Refurb 2022)',
      'Mediterania Timur (Yunani/Malta) & Karibia',
      'Value Eropa & Grup',
      'Interior bertema film & teater klasik dengan kolam beratap kaca, Samsara Spa & Pizzeria Pummid\'Oro.'
    ),
    s(
      'Costa Favolosa',
      'Concordia Class',
      '113.216 GT',
      '3.012 tamu',
      17,
      '2011',
      'Eropa Utara (Islandia/Norwegia/Skotlandia) & Amerika Selatan',
      'Wisata Eropa Utara Hemat',
      'Desain kastel dongeng klasik dengan 4 kolam renang, Samsara Spa luas & rute panjang Eropa Utara yang terjangkau.'
    ),
    s(
      'Costa Pacifica',
      'Concordia Class',
      '114.425 GT',
      '3.008 tamu',
      17,
      '2009',
      'Mediterania & Karibia (Republik Dominika)',
      'Pencinta Musik & Value',
      'Bertema musik ("Ship of Music") dilengkapi 2 kolam beratap kaca geser untuk segala cuaca & teater 3 lantai.'
    ),
    s(
      'Costa Serena',
      'Concordia Class',
      '114.147 GT',
      '3.000 tamu',
      17,
      '2007 (Refurb 2025)',
      'Asia — Jepang, Korea, Taiwan, Hong Kong & Asia Tenggara (Charter)',
      'Grup Tour Asia & Harga Paling Ramah',
      'KAPAL ANDALAN COSTA DI ASIA! Sangat sering melayani rute Jepang–Korea–Taiwan–HK & charter Asia Tenggara dengan harga sangat kompetitif.'
    ),
    s(
      'Costa Deliziosa',
      'Deliziosa Class',
      '92.720 GT',
      '2.260 tamu',
      16,
      '2010',
      'World Cruise & Mediterania Timur (Venice/Marghera–Yunani)',
      'Rute Yunani & World Cruise',
      'Ukuran lebih ramping (kapasitas ~2.260 tamu) dengan dekorasi kaca Murano Venesia; rutin menjalankan Costa World Cruise & rute Kepulauan Yunani.'
    )
  ],

  // 9. HOLLAND AMERICA LINE — 11 Active Ships (4 Classes, 2025/2026)
  'holland-america-line': [
    // Pinnacle Class (3)
    s(
      'MS Rotterdam',
      'Pinnacle Class',
      '99.935 GT',
      '2.668 tamu',
      12,
      '2021',
      'Eropa Utara (Rotterdam/Fjords) & Karibia',
      'Lansia, Pasangan & Pencinta Musik Live',
      'Flagship terbaru Holland America: Music Walk (B.B. King\'s Blues Club, Rolling Stone Lounge, Billboard Onboard), World Stage 270° LED & Club Orange.'
    ),
    s(
      'MS Nieuw Statendam',
      'Pinnacle Class',
      '99.902 GT',
      '2.666 tamu',
      12,
      '2018',
      'Eropa (Rotterdam/Mediterania/Islandia) & Karibia',
      'Pasangan Dewasa & Kuliner Premium',
      'Desain arsitektur kontemporer hangat dengan Rudi\'s Sel de Mer French seafood, Tamarind Pan-Asian & Music Walk lengkap.'
    ),
    s(
      'MS Koningsdam',
      'Pinnacle Class',
      '99.863 GT',
      '2.650 tamu',
      12,
      '2016',
      'Alaska (Vancouver — Glacier Bay), Hawaii & Meksiko',
      'Alaska Terbaik & Multi-Generasi',
      'Kapal unggulan rute Alaska pulang-pergi Vancouver (masuk Glacier Bay National Park!) dengan Music Walk, Grand Dutch Cafe & Tamarind.'
    ),
    // Signature Class (2)
    s(
      'MS Nieuw Amsterdam',
      'Signature Class',
      '86.700 GT',
      '2.106 tamu',
      11,
      '2010 (Refurb 2023)',
      'Alaska (Vancouver–Whittier) & Karibia',
      'Lansia & Alaska Land+Sea Tour',
      'Koleksi seni bertema New York, restoran Morimoto By Sea / Tamarind, Pinnacle Grill & rute one-way Alaska terhubung ke Denali.'
    ),
    s(
      'MS Eurodam',
      'Signature Class',
      '86.273 GT',
      '2.104 tamu',
      11,
      '2008 (Refurb 2023)',
      'Alaska (Seattle — Glacier Bay) & Terusan Panama',
      'Lansia & Pencinta Scenic',
      'Salah satu kapal dari Seattle yang punya izin masuk Glacier Bay! Ukuran sedang (~2.100 tamu), nyaman tanpa banyak berjalan jauh.'
    ),
    // Vista Class (4)
    s(
      'MS Noordam',
      'Vista Class',
      '82.318 GT',
      '1.924 tamu',
      11,
      '2006 (Refurb 2024)',
      'Australia/New Zealand, Jepang & Alaska',
      'Lansia & Wisata Panjang 14N',
      'Rutin melayani rute eksotis Australia–Selandia Baru & Jepang dengan pelayanan klasik hangat, B.B. King\'s & Greenhouse Spa.'
    ),
    s(
      'MS Westerdam',
      'Vista Class',
      '82.348 GT',
      '1.964 tamu',
      11,
      '2004 (Refurb 2023)',
      'Asia (Singapura–Jepang–Hong Kong–Thailand 14N) & Alaska',
      'Lansia & Rute Asia Mendalam',
      'KAPAL ANDALAN HAL DI SINGAPURA & ASIA! Rutin berlayar 14N Singapura–Bangkok–Ho Chi Minh–Hong Kong & keliling Jepang dengan suasana intim.'
    ),
    s(
      'MS Oosterdam',
      'Vista Class',
      '82.305 GT',
      '1.964 tamu',
      11,
      '2003 (Refurb 2022)',
      'Mediterania (Barcelona/Athens/Trieste) & Amerika Selatan/Antartika',
      'Wisata Budaya Eropa & Patagonia',
      'Ukuran pas untuk pelabuhan klasik Mediterania & pemandangan gletser Amerika Selatan, dilengkapi Pinnacle Grill & Canaletto.'
    ),
    s(
      'MS Zuiderdam',
      'Vista Class',
      '82.305 GT',
      '1.964 tamu',
      11,
      '2002 (Refurb 2023)',
      'Grand World Voyage, Kanada/New England & Karibia',
      'Pensiunan & Pelayaran Panjang',
      'Andalan Grand World Voyage Holland America; ruang kabin nyaman, perpustakaan lengkap & suasana tenang berkelas.'
    ),
    // R Class (2)
    s(
      'MS Zaandam',
      'R Class',
      '61.396 GT',
      '1.432 tamu',
      10,
      '2000 (Refurb 2024)',
      'Alaska (Vancouver — Glacier Bay), Hawaii & Meksiko',
      'Lansia & Kapal Intim Klasik',
      'Kapasitas hanya ~1.432 tamu dengan dek jalan kaki wraparound penuh; sangat digemari tamu senior yang tidak suka keramaian mega-ship.'
    ),
    s(
      'MS Volendam',
      'R Class',
      '61.214 GT',
      '1.432 tamu',
      10,
      '1999 (Refurb 2024)',
      'Grand Voyages (Eropa, Amazon, Afrika) & Kanada',
      'Collector Destinasi & Senior',
      'Dekorasi bertema taman bunga yang hangat, rasio ruang luas & mampu masuk sungai/pelabuhan eksotis seperti Sungai Amazon.'
    )
  ],

  // 10. SILVERSEA CRUISES — 12 Active Ships (8 Ocean + 4 Expedition, 2025/2026)
  'silversea-cruises': [
    // Nova Class (2)
    s(
      'Silver Ray',
      'Nova Class (Ultra-Luxury)',
      '54.700 GT',
      '728 tamu',
      11,
      '2024',
      'Mediterania, Karibia & Amerika Selatan',
      'VVIP, C-Level & Honeymoon Ultra-Luxury',
      'Kapal terbaru Silversea berdesain asimetris penuh dinding kaca, All-Suite dengan Butler 24 jam, program kuliner S.A.L.T. & Otium Spa.'
    ),
    s(
      'Silver Nova',
      'Nova Class (Ultra-Luxury)',
      '54.700 GT',
      '728 tamu',
      11,
      '2023',
      'Asia (Singapura–Jepang), Australia/NZ & Alaska',
      'VVIP Luxury & Destinasi Asia/Alaska',
      'Rasio ruang per tamu tertinggi di kelasnya! 100% All-Suite ber-balkon dengan Butler, 8 restoran fine dining & kolam renang menghadap cakrawala.'
    ),
    // Muse Class (3)
    s(
      'Silver Dawn',
      'Muse Class (Ultra-Luxury)',
      '40.700 GT',
      '596 tamu',
      11,
      '2022',
      'Eropa Utara, Mediterania & Grand Voyages',
      'VVIP & Wellness Luxury',
      'Memperkenalkan konsep spa Romawi Otium, program kuliner S.A.L.T. Kitchen & Lab, serta 8 restoran fine dining all-inclusive.'
    ),
    s(
      'Silver Moon',
      'Muse Class (Ultra-Luxury)',
      '40.700 GT',
      '596 tamu',
      11,
      '2020',
      'Asia (Singapura–Jepang–Hong Kong), Australia & Mediterania',
      'VVIP & Foodie Eksklusif',
      'Pelopor program kuliner S.A.L.T. (Sea and Land Taste) yang menyajikan masakan autentik sesuai pelabuhan singgah setiap hari.'
    ),
    s(
      'Silver Muse',
      'Muse Class (Ultra-Luxury)',
      '40.700 GT',
      '596 tamu',
      11,
      '2017 (Refurb 2025)',
      'Mediterania, Eropa Utara & Asia/Pasifik',
      'VVIP & Pasangan Elegan',
      'Kapasitas intim 596 tamu dengan 8 pilihan restoran (termasuk Kaiseki Jepang & La Dame French fine dining) dan layanan Butler.'
    ),
    // Spirit / Shadow Class (3)
    s(
      'Silver Spirit',
      'Spirit Class (Ultra-Luxury)',
      '39.519 GT',
      '608 tamu',
      11,
      '2009 (Lengthened 2018)',
      'Mediterania, Yunani, Timur Tengah & Afrika',
      'VVIP & Sosial Luxury',
      'Diperpanjang dan dimodernisasi ala Muse Class; punya 8 restoran fine dining, dek kolam renang besar & suasana sosial hangat.'
    ),
    s(
      'Silver Whisper',
      'Shadow Class (Ultra-Luxury)',
      '28.258 GT',
      '392 tamu',
      10,
      '2001 (Refurb 2024)',
      'Mediterania, Eropa Utara & Grand Voyages',
      'VVIP Intim & Pelabuhan Butik',
      'Hanya 392 tamu! Dapat merapat langsung di pusat pelabuhan butik (Monte Carlo, Portofino, St. Tropez) tanpa antre sama sekali.'
    ),
    s(
      'Silver Shadow',
      'Shadow Class (Ultra-Luxury)',
      '28.258 GT',
      '392 tamu',
      10,
      '2000 (Refurb 2022)',
      'Karibia, Kanada/New England & World Cruise',
      'VVIP Klasik & World Cruise',
      'Rasio kru hampir 1:1 dengan tamu (392 tamu), All-Suite Butler, La Dame fine dining & keintiman ala private yacht.'
    ),
    // Expedition Fleet (4)
    s(
      'Silver Endeavour',
      'Polar Expedition (PC6)',
      '20.449 GT',
      '220 tamu',
      8,
      '2021',
      'Antartika (termasuk Fly-Cruise), Arktik & Kepulauan Inggris',
      'VVIP Bucket-List Antartika/Arktik',
      'Kapal ekspedisi kutub paling mewah di dunia (Ice-Class PC6): hanya 220 tamu, semua Veranda Suite + Butler, 24 Zodiac & tim ekspedisi ilmuwan!'
    ),
    s(
      'Silver Origin',
      'Galapagos Expedition',
      '5.800 GT',
      '100 tamu',
      7,
      '2020',
      'Kepulauan Galapagos (Ekuador) — Sepanjang Tahun',
      'VVIP Alam & Galapagos',
      'Dibangun khusus 100% untuk Galapagos: kapasitas hanya 100 tamu, semua Suite + Butler, Basecamp edukasi & rasio pemandu naturalis tertinggi.'
    ),
    s(
      'Silver Wind',
      'Ice-Class Expedition',
      '17.400 GT',
      '274 tamu',
      9,
      '1995 (Konversi Ice-Class 2021)',
      'Antartika, Arktik (Svalbard/Greenland) & Eropa Utara',
      'VVIP Ekspedisi & Petualangan',
      'Diperkuat lambung es (Ice-Class) pada 2021: menggabungkan kemewahan Silversea Butler dengan ekspedisi Zodiac ke kutub & pulau terpencil.'
    ),
    s(
      'Silver Cloud',
      'Ice-Class Expedition',
      '16.800 GT',
      '254 tamu',
      9,
      '1994 (Konversi Ice-Class 2017)',
      'Antartika, Kimberley (Australia), Afrika & Pasifik Selatan',
      'VVIP Ekspedisi Eksotis',
      'Kapal ekspedisi mewah dengan 16 Zodiac & kayak, rasio kru 1:1, sangat terkenal untuk ekspedisi Kimberley Australia & Antartika.'
    )
  ]
};
