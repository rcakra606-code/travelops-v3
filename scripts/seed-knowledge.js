import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function seed() {
  console.log('Seeding initial destination intelligence...');

  // 1. Countries
  const countries = [
    {
      id: 'JPN',
      name: 'Japan',
      region: 'East Asia',
      currency: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', cardUsage: 'Moderate (Cash preferred in small shops)' },
      emergency: { police: '110', ambulance: '119', embassyNote: 'Tokyo Embassy Helpline: +81-3-3441-4201' },
      power_plugs: { types: ['A', 'B'], voltage: '100V', notes: 'Requires 2-pin flat US/JP adapter' },
      visa_info: { requiresVisa: true, type: 'e-Visa / Visa-Free', notes: 'Visit Japan Web QR code required for fast-track immigration' },
      customs_etiquette: {
        dos: ['Take off shoes at temple entrances & ryokans', 'Stand on the left side of escalators in Tokyo', 'Keep trash until finding a convenience store bin'],
        donts: ['Never tip at restaurants (considered insulting)', 'No loud phone calls on trains or buses', 'Do not walk while eating on crowded streets'],
        tippingNotes: 'Tipping is strictly not customary.'
      },
      water_safety: 'Tap water is 100% safe to drink'
    },
    {
      id: 'CHE',
      name: 'Switzerland',
      region: 'Western Europe',
      currency: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', cardUsage: 'Very High (Cards & Apple Pay accepted everywhere)' },
      emergency: { police: '117', ambulance: '144', embassyNote: 'Bern Embassy Contact: +41-31-352-0983' },
      power_plugs: { types: ['J'], voltage: '230V', notes: 'Requires 3-pin hexagonal Type J adapter' },
      visa_info: { requiresVisa: true, type: 'Schengen Visa', notes: 'Passport validity min 3 months beyond intended departure date' },
      customs_etiquette: {
        dos: ['Greet shopkeepers upon entering ("Grüezi")', 'Keep quiet on trains and after 22:00 in hotels', 'Recycle glass and PET separately'],
        donts: ['Do not make noise on Sundays', 'Avoid touching fresh produce with bare hands in markets'],
        tippingNotes: 'Service charge is included; rounding up 5-10% is customary for good service.'
      },
      water_safety: 'Tap water & public fountains (Brunnen) are alpine spring safe'
    }
  ];

  await supabase.from('travelops_dest_countries').upsert(countries);

  // 2. Cities
  const cities = [
    {
      id: 'tokyo',
      country_id: 'JPN',
      name: 'Tokyo',
      airports: ['HND', 'NRT'],
      best_months: ['Mar', 'Apr', 'Oct', 'Nov'],
      transport_apps: ['Suica / Pasmo (Apple Wallet)', 'Japan Travel NAVITIME', 'Go Taxi'],
      food_highlights: { signature: ['Tsukiji Sushi', 'Tonkatsu', 'Shinjuku Ramen'], halalFriendly: 'Moderate (Halal ramen spots in Asakusa/Shinjuku)' },
      hospital_contacts: ['St. Luke\'s International Hospital (English spoken - Tsukiji)']
    },
    {
      id: 'kyoto',
      country_id: 'JPN',
      name: 'Kyoto',
      airports: ['KIX', 'ITM'],
      best_months: ['Apr', 'May', 'Oct', 'Nov'],
      transport_apps: ['ICOCA Card', 'Kyoto Bus Pass Guide'],
      food_highlights: { signature: ['Matcha Parfait', 'Kaiseki Dinner', 'Yudofu Tofu'], halalFriendly: 'Moderate (Halal certified Kaiseki in Gion)' },
      hospital_contacts: ['Kyoto University Hospital Emergency Clinic']
    },
    {
      id: 'zurich',
      country_id: 'CHE',
      name: 'Zurich',
      airports: ['ZRH'],
      best_months: ['Jun', 'Jul', 'Aug', 'Sep', 'Dec'],
      transport_apps: ['SBB Mobile', 'ZVV Transport App'],
      food_highlights: { signature: ['Zürcher Geschnetzeltes', 'Swiss Cheese Fondue', 'Lindt Chocolate'], halalFriendly: 'High (Multiple Mediterranean/Halal restaurants near HB)' },
      hospital_contacts: ['University Hospital Zurich (USZ)']
    }
  ];

  await supabase.from('travelops_dest_cities').upsert(cities);

  // 3. Tour Objects (POIs)
  const objects = [
    {
      id: 'senso-ji-temple',
      city_id: 'tokyo',
      country_id: 'JPN',
      name: 'Senso-ji Temple & Nakamise Street',
      category: 'Religious',
      est_duration_minutes: 75,
      opening_hours: { open: '06:00', close: '17:00', notes: 'Main hall closes at 17:00; outer grounds illuminated 24/7' },
      ticket_policy: { bookingMode: 'Free Entry', notes: 'No admission tickets needed' },
      dress_code: 'Modest attire recommended; remove hats when entering main hall',
      rules: { photosAllowed: true, tripodAllowed: false, notes: 'No photos inside the inner altar sanctuary' },
      guide_briefing_notes: [
        'Tokyo\'s oldest Buddhist temple founded in 645 AD dedicated to Kannon Bodhisattva.',
        'The giant red lantern at Kaminarimon Gate weighs approx. 700 kg.',
        'Coach drop-off is at Asakusa Tourist Information Center Parking. Clean restrooms are behind the 5-story pagoda.'
      ],
      photo_spots: ['Kaminarimon Gate under the red lantern', '5-story Pagoda view from Nakamise corner']
    },
    {
      id: 'fushimi-inari-shrine',
      city_id: 'kyoto',
      country_id: 'JPN',
      name: 'Fushimi Inari Taisha Shrine',
      category: 'Historical',
      est_duration_minutes: 90,
      opening_hours: { open: '24 Hours', close: '24 Hours', notes: 'Open all day and night' },
      ticket_policy: { bookingMode: 'Free Entry', notes: 'Free entry for all groups' },
      dress_code: 'Comfortable walking/hiking shoes required for stone path steps',
      rules: { photosAllowed: true, tripodAllowed: false, notes: 'Tripods blocked on narrow torii path' },
      guide_briefing_notes: [
        'Dedicated to Inari, the Shinto deity of rice and business prosperity.',
        'Over 10,000 bright vermilion torii gates donated by Japanese companies.',
        'Advise group to turn back at Yotsutsuji intersection (30 mins up) to stay on schedule.'
      ],
      photo_spots: ['Senbon Torii dual tunnel entrance', 'Torii curves in the shaded cedar forest']
    },
    {
      id: 'jungfraujoch-top-of-europe',
      city_id: 'zurich',
      country_id: 'CHE',
      name: 'Jungfraujoch – Top of Europe',
      category: 'Nature',
      est_duration_minutes: 180,
      opening_hours: { open: '08:00', close: '16:30', notes: 'Operating hours depend on cogwheel train timetable' },
      ticket_policy: { bookingMode: 'Advance Seat Reservation Required', notes: 'Mandatory group seat booking during peak season' },
      dress_code: 'Thermal winter jacket, sunglasses with UV protection & non-slip boots',
      rules: { photosAllowed: true, tripodAllowed: true, notes: 'Drone flights strictly prohibited without alpine permit' },
      guide_briefing_notes: [
        'Highest railway station in Europe situated at 3,454 meters altitude.',
        'Warn guests about high altitude: walk slowly and stay well-hydrated.',
        'Must visit the Ice Palace (glacier tunnels) and Sphinx Observatory platform.'
      ],
      photo_spots: ['Sphinx Observatory overlooking Aletsch Glacier', 'Swiss Flag plateau snow platform']
    }
  ];

  await supabase.from('travelops_dest_objects').upsert(objects);
  console.log('✅ Seed completed successfully!');
}

seed();
