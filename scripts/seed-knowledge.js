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
      food_highlights: {
        signature: ['Tsukiji Sushi', 'Tonkatsu', 'Shinjuku Ramen', 'Monjayaki'],
        halalStatus: 'Moderate',
        halalFriendly: 'Certified Halal Wagyu in Roppongi (Panga), Halal Ramen in Asakusa (Ayam-YA, Naritaya) and Shinjuku',
        mosques: [
          'Tokyo Camii Mosque & Turkish Culture Center (Yoyogi-Uehara)',
          'Asakusa Mosque (Dawat-e-Islami)',
          'Haneda & Narita Airport Multi-Faith Prayer Rooms'
        ],
        ingredientCautions: 'Watch out for Mirin, Cooking Sake in marinades/sauces, Pork bone broth in ramen, and animal gelatin in desserts.',
        dietaryNotes: 'Shojin Ryori (Buddhist temple vegan cuisine) and vegetarian department store delis available.'
      },
      hospital_contacts: [
        'St. Luke\'s International Hospital (Tsukiji - English Speaking 24/7 ER, Tel: +81-3-3541-5151)',
        'Tokyo Medical University Hospital (Shinjuku - Foreign Tourist Desk, Tel: +81-3-3342-6111)'
      ]
    },
    {
      id: 'kyoto',
      country_id: 'JPN',
      name: 'Kyoto',
      airports: ['KIX', 'ITM'],
      best_months: ['Apr', 'May', 'Oct', 'Nov'],
      transport_apps: ['ICOCA Card', 'Kyoto Bus Pass Guide', 'MK Taxi App'],
      food_highlights: {
        signature: ['Matcha Parfait', 'Kaiseki Dinner', 'Yudofu Tofu', 'Kyo-Ryori'],
        halalStatus: 'Moderate',
        halalFriendly: 'Halal certified Kaiseki in Gion (Tagoto), Halal Ramen Gion Naritaya, and Halal Bento near Kyoto Station',
        mosques: [
          'Kyoto Islamic Cultural Center (Kamigyo Ward)',
          'Kyoto Station North Gate Prayer Space'
        ],
        ingredientCautions: 'Traditional dashi broth often uses bonito flakes (fish) or pork stock; ensure mirin is omitted in sukiyaki.',
        dietaryNotes: 'Kyoto is world-renowned for Yudofu (boiled tofu cuisine), highly suitable for vegetarians.'
      },
      hospital_contacts: [
        'Kyoto University Hospital Emergency Clinic (English Medical Staff, Tel: +81-75-751-3111)',
        'Kyoto City Hospital (Emergency Desk, Tel: +81-75-311-5311)'
      ]
    },
    {
      id: 'zurich',
      country_id: 'CHE',
      name: 'Zurich',
      airports: ['ZRH'],
      best_months: ['Jun', 'Jul', 'Aug', 'Sep', 'Dec'],
      transport_apps: ['SBB Mobile', 'ZVV Transport App', 'Uber Zurich'],
      food_highlights: {
        signature: ['Zürcher Geschnetzeltes', 'Swiss Cheese Fondue', 'Lindt Chocolate', 'Rösti'],
        halalStatus: 'High',
        halalFriendly: 'Multiple certified Halal Lebanese, Turkish, and Persian dining options around Zürich HB and Langstrasse',
        mosques: [
          'Islamic Community Center Zurich (Neugasse)',
          'Mahmud Mosque (Forchstrasse)',
          'Zurich Airport (ZRH) Transit Quiet & Prayer Rooms'
        ],
        ingredientCautions: 'Traditional Swiss Cheese Fondue contains white wine and cherry schnapps (Kirsch); request alcohol-free preparation.',
        dietaryNotes: 'Haus Hiltl (oldest vegetarian restaurant in the world) and abundant vegan options in downtown Zurich.'
      },
      hospital_contacts: [
        'University Hospital Zurich (USZ - Emergency Department 24/7, Tel: +41-44-255-1111)',
        'Permanence Hauptbahnhof Clinic (Walk-in Medical at Central Station, Tel: +41-44-215-4444)'
      ]
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

  // 4. Master Tour Routes
  const routes = [
    {
      id: 'route-jpn-7d-classic-golden-route',
      title: '7D6N Classic Japan Golden Route (Tokyo - Hakone - Kyoto - Osaka)',
      route_signature: 'JPN:7D:tokyo>hakone>kyoto>osaka',
      country_id: 'JPN',
      country_name: 'Japan',
      duration_days: 7,
      duration_nights: 6,
      cities_sequence: ['Tokyo', 'Hakone', 'Kyoto', 'Osaka'],
      theme_category: 'Cultural & Scenic',
      transport_modes: ['Private Coach', 'Shinkansen Bullet Train'],
      route_highlights: [
        'Senso-ji Temple & Asakusa',
        'Mt. Fuji 5th Station & Lake Ashi Cruise',
        'Shinkansen Bullet Train Experience',
        'Fushimi Inari Taisha 1,000 Torii Gates',
        'Kiyomizu-dera & Dotonbori Glico Sign'
      ],
      day_itinerary: [
        {
          day: 1,
          title: 'Arrival in Tokyo & Asakusa District',
          city: 'Tokyo',
          objects: ['Senso-ji Temple & Nakamise Street', 'Tokyo Skytree (Photo stop)'],
          meals: { b: false, l: true, d: true },
          hotelArea: 'Tokyo Bay / Shinjuku',
          summary: 'Arrive at Haneda/Narita airport, transfer by coach to Asakusa for temple briefing and welcome dinner.'
        },
        {
          day: 2,
          title: 'Modern Tokyo Exploration',
          city: 'Tokyo',
          objects: ['Meiji Shrine', 'Shibuya Crossing & Hachiko', 'Shinjuku Gyoen'],
          meals: { b: true, l: true, d: false },
          hotelArea: 'Tokyo Bay / Shinjuku',
          summary: 'Explore Harajuku and Shibuya fashion hubs followed by panoramic views from Roppongi Hills.'
        },
        {
          day: 3,
          title: 'Mt. Fuji & Hakone Alpine Onsen',
          city: 'Hakone',
          objects: ['Mt. Fuji 5th Station', 'Owakudani Volcanic Valley', 'Lake Ashi Pirate Ship Cruise'],
          meals: { b: true, l: true, d: true },
          hotelArea: 'Hakone / Fuji Onsen Resort',
          summary: 'Drive up to Mt. Fuji 5th Station, cruise on Lake Ashi, and stay overnight at a traditional onsen ryokan.'
        },
        {
          day: 4,
          title: 'Shinkansen Bullet Train to Kyoto & Ancient Temples',
          city: 'Kyoto',
          objects: ['Shinkansen Ride', 'Kinkaku-ji Golden Pavilion', 'Gion Geisha District'],
          meals: { b: true, l: true, d: true },
          hotelArea: 'Kyoto Downtown',
          summary: 'Experience the 300 km/h Shinkansen bullet train to Kyoto. Afternoon walking tour in historic Gion.'
        },
        {
          day: 5,
          title: 'Spiritual Kyoto & Fushimi Inari Shrine',
          city: 'Kyoto',
          objects: ['Fushimi Inari Taisha Shrine', 'Kiyomizu-dera Temple', 'Sannenzaka & Ninenzaka'],
          meals: { b: true, l: true, d: false },
          hotelArea: 'Kyoto Downtown',
          summary: 'Early morning hike through the 10,000 torii gates of Fushimi Inari, followed by wooden terrace views at Kiyomizu-dera.'
        },
        {
          day: 6,
          title: 'Osaka Castle & Dotonbori Gastronomy',
          city: 'Osaka',
          objects: ['Osaka Castle Park', 'Shinsaibashi Shopping Arcade', 'Dotonbori Glico Sign'],
          meals: { b: true, l: true, d: true },
          hotelArea: 'Osaka Namba',
          summary: 'Transfer to Osaka, tour the grand Osaka Castle, and enjoy an evening street food safari in Dotonbori.'
        },
        {
          day: 7,
          title: 'Kansai Airport Departure',
          city: 'Osaka',
          objects: ['Rinku Premium Outlets (Optional)'],
          meals: { b: true, l: false, d: false },
          hotelArea: 'Departure',
          summary: 'Morning leisure and shopping before transfer to Kansai International Airport (KIX) for flight home.'
        }
      ],
      usage_count: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  await supabase.from('travelops_tour_routes').upsert(routes);
  console.log('✅ Master destination intelligence and tour routes synced successfully!');
}

seed();
