/**
 * SERVILIST AFRICA - Pan-African Classifieds, Live Auctions & Buyer Requests Engine
 * Combines eBay auctions & live bidding with Craigslist hyperlocal classifieds,
 * reverse buyer requests (ISO/RFQ), multi-currency African conversion,
 * Safe Meetup & Escrow Protection, and Supabase cloud synchronization.
 */

// ============================================================================
// 1. PAN-AFRICAN CURRENCY & EXCHANGE CONFIGURATION
// Base currency for internal storage is USD ($)
// ============================================================================

const CURRENCY_CONFIG = {
    NGN: { symbol: "₦", name: "Nigerian Naira", flag: "🇳🇬", rate: 1500, decimals: 0, code: "NGN", country: "Nigeria" },
    KES: { symbol: "KSh ", name: "Kenyan Shilling", flag: "🇰🇪", rate: 130, decimals: 0, code: "KES", country: "Kenya" },
    GHS: { symbol: "GH₵ ", name: "Ghanaian Cedi", flag: "🇬🇭", rate: 15.5, decimals: 2, code: "GHS", country: "Ghana" },
    ZAR: { symbol: "R ", name: "South African Rand", flag: "🇿🇦", rate: 18.2, decimals: 2, code: "ZAR", country: "South Africa" },
    USD: { symbol: "$", name: "US Dollar", flag: "🇺🇸", rate: 1.0, decimals: 2, code: "USD", country: "International / Pan-Africa" },
    EGP: { symbol: "E£ ", name: "Egyptian Pound", flag: "🇪🇬", rate: 48.5, decimals: 2, code: "EGP", country: "Egypt" },
    RWF: { symbol: "FRw ", name: "Rwandan Franc", flag: "🇷🇼", rate: 1350, decimals: 0, code: "RWF", country: "Rwanda" },
    TZS: { symbol: "TSh ", name: "Tanzanian Shilling", flag: "🇹🇿", rate: 2600, decimals: 0, code: "TZS", country: "Tanzania" },
    UGX: { symbol: "USh ", name: "Ugandan Shilling", flag: "🇺🇬", rate: 3700, decimals: 0, code: "UGX", country: "Uganda" },
    XOF: { symbol: "CFA ", name: "West African CFA", flag: "🇨🇮", rate: 600, decimals: 0, code: "XOF", country: "West Africa" }
};

const CITY_TO_CURRENCY = {
    "Lagos, Nigeria": "NGN",
    "Abuja, Nigeria": "NGN",
    "Port Harcourt, Nigeria": "NGN",
    "Ibadan, Nigeria": "NGN",
    "Kano, Nigeria": "NGN",
    "Nairobi, Kenya": "KES",
    "Mombasa, Kenya": "KES",
    "Kisumu, Kenya": "KES",
    "Accra, Ghana": "GHS",
    "Kumasi, Ghana": "GHS",
    "Johannesburg, South Africa": "ZAR",
    "Cape Town, South Africa": "ZAR",
    "Durban, South Africa": "ZAR",
    "Kigali, Rwanda": "RWF",
    "Dar es Salaam, Tanzania": "TZS",
    "Kampala, Uganda": "UGX",
    "Cairo, Egypt": "EGP",
    "All Africa": "USD"
};

// ============================================================================
// 2. SEED DATA - PAN-AFRICAN LISTINGS & BUYER REQUESTS
// Prices are stored in baseline USD for unified cross-border parity.
// ============================================================================

const SEED_LISTINGS = [
    {
        id: "serv-101",
        title: "Apple MacBook Pro 14\" M3 Max (36GB Unified RAM, 1TB SSD) Space Black",
        category: "electronics",
        format: "auction", // 'auction', 'buy_now', 'service', 'free_barter'
        startingPrice: 1600,
        currentPrice: 1850,
        buyItNowPrice: 2200,
        reservePrice: 1800,
        bidsCount: 16,
        endTime: Date.now() + 1000 * 60 * 38, // 38 mins left (urgent!)
        city: "Lagos, Nigeria",
        neighborhood: "Ikeja (Computer Village / Allen Ave)",
        distanceMiles: 3.2,
        fulfillment: "both", // 'pickup', 'shipping', 'both'
        shippingFee: 15.00,
        imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        description: "Official Apple UK keyboard spec, M3 Max 14-core CPU / 30-core GPU. Battery health 98% (only 34 cycles). Includes original 96W USB-C MagSafe brick and box. Physical inspection available at safe bank branch in Ikeja or insured GIG Logistics dispatch across Nigeria.",
        seller: {
            name: "Chukwudi Electronics (Ikeja)",
            avatar: "CE",
            rating: 4.9,
            reviewsCount: 142,
            verified: true
        },
        bidHistory: [
            { bidder: "k***4 (Lagos)", amount: 1850, time: "4 mins ago" },
            { bidder: "t***9 (Abuja)", amount: 1800, time: "19 mins ago" },
            { bidder: "b***2 (Port Harcourt)", amount: 1720, time: "1 hour ago" },
            { bidder: "j***0 (Ibadan)", amount: 1600, time: "3 hours ago" }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 18
    },
    {
        id: "serv-102",
        title: "5kVA Felicity Solar Hybrid Inverter + 10kWh LiFePO4 Lithium Wall-Mount Battery",
        category: "solar",
        format: "buy_now",
        currentPrice: 1950,
        buyItNowPrice: 1950,
        city: "Lagos, Nigeria",
        neighborhood: "Lekki Phase 1 (Admiralty Way)",
        distanceMiles: 4.5,
        fulfillment: "both",
        imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        description: "Zero noise, pure sine wave 48V system. Perfect solution for frequent grid downtime. Powers 2x 1.5HP Inverter Air Conditioners, double-door refrigerator, and complete lighting. 5-year warranty on lithium battery cells. Free delivery across Lekki-Epe expressway or pickup.",
        seller: {
            name: "Lekki Solar Tech Solutions",
            avatar: "LS",
            rating: 5.0,
            reviewsCount: 68,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 7
    },
    {
        id: "serv-103",
        title: "2020 Toyota Land Cruiser Prado TX-L (Direct Clean Import, Leather, Sunroof)",
        category: "vehicles",
        format: "auction",
        startingPrice: 38000,
        currentPrice: 42500,
        reservePrice: 41000,
        bidsCount: 22,
        endTime: Date.now() + 1000 * 60 * 60 * 2.5, // 2.5 hrs left
        city: "Nairobi, Kenya",
        neighborhood: "Westlands / Parklands",
        distanceMiles: 2.1,
        fulfillment: "pickup",
        shippingFee: 0,
        imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
        description: "2.8L D-4D Turbo Diesel. 7-seater beige leather interior, 360-degree cameras, radar cruise control, dual zone climate, brand new Dunlop Grandtrek tyres. Genuine verified 48,000 km mileage with Japanese auction sheet. Test drive at Sarit Centre safe zone.",
        seller: {
            name: "Westlands Executive Motors",
            avatar: "WM",
            rating: 4.9,
            reviewsCount: 210,
            verified: true
        },
        bidHistory: [
            { bidder: "o***7 (Nairobi)", amount: 42500, time: "11 mins ago" },
            { bidder: "m***3 (Mombasa)", amount: 41800, time: "42 mins ago" },
            { bidder: "k***9 (Eldoret)", amount: 40500, time: "2 hours ago" }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 40
    },
    {
        id: "serv-104",
        title: "Commercial 30kVA Perkins Silent Diesel Generator with Automatic Transfer Switch (ATS)",
        category: "solar",
        format: "buy_now",
        currentPrice: 7200,
        buyItNowPrice: 7200,
        city: "Accra, Ghana",
        neighborhood: "North Industrial Area / Kaneshie",
        distanceMiles: 5.6,
        fulfillment: "both",
        imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        description: "Water-cooled 1103A series Perkins engine with Stamford alternator. Ultra-silent weatherproof canopy (68 dBA at 7m). Digital SmartGen control module with automatic mains failure switch. Ideal for factories, cold stores, clinics, and offices. Tested and ready for crane loading.",
        seller: {
            name: "Gold Coast Power Equip",
            avatar: "GP",
            rating: 4.8,
            reviewsCount: 52,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 12
    },
    {
        id: "serv-105",
        title: "Certified Solar & Inverter Engineering: 5kVA-20kVA Residential Backup Installation",
        category: "services",
        format: "service",
        currentPrice: 80, // Daily engineer day-rate
        city: "Lagos, Nigeria",
        neighborhood: "Victoria Island & Lekki",
        distanceMiles: 1.8,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80",
        description: "COREN registered electrical engineer. Specialising in solar panel roof framing, battery equalization, charge controller sizing, changeover switch automation, and earthing surge protection. Over 180 verified home & hospital installations completed across Southwest Nigeria.",
        seller: {
            name: "Engr. Babatunde Solar",
            avatar: "BS",
            rating: 5.0,
            reviewsCount: 94,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 24
    },
    {
        id: "serv-106",
        title: "Authentic Hand-Woven Royal Ashanti Kente Ceremonial Cloth (12-Strip Double Weave)",
        category: "collectibles",
        format: "auction",
        startingPrice: 320,
        currentPrice: 480,
        reservePrice: 450,
        bidsCount: 14,
        endTime: Date.now() + 1000 * 60 * 60 * 4.2,
        city: "Kumasi, Ghana",
        neighborhood: "Bonwire / Adum Cultural Centre",
        distanceMiles: 6.2,
        fulfillment: "both",
        shippingFee: 25.00,
        imageUrl: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=800&q=80",
        description: "Master artisan crafted in Bonwire, Ashanti Region. Features the revered 'Adwinasa' pattern in pure silk and rayon threads. Rich gold, emerald green, and crimson ceremonial colours. Complete full 12-strip piece suitable for weddings and state banquets. Worldwide DHL or safe local meetup.",
        seller: {
            name: "Asante Royal Weavers",
            avatar: "AR",
            rating: 5.0,
            reviewsCount: 76,
            verified: true
        },
        bidHistory: [
            { bidder: "a***2 (Accra)", amount: 480, time: "14 mins ago" },
            { bidder: "k***8 (London/Ghana)", amount: 450, time: "1 hour ago" },
            { bidder: "e***1 (Kumasi)", amount: 390, time: "3 hours ago" }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 48
    },
    {
        id: "serv-107",
        title: "DJI Mavic 3 Pro Cine Combo Drone (Apple ProRes 422, Triple Camera, RC Pro)",
        category: "electronics",
        format: "buy_now",
        currentPrice: 3200,
        buyItNowPrice: 3200,
        city: "Johannesburg, South Africa",
        neighborhood: "Sandton CBD / Rosebank",
        distanceMiles: 3.8,
        fulfillment: "both",
        imageUrl: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80",
        description: "Hasselblad 4/3 CMOS sensor with 70mm and 166mm telephoto lenses. Includes 1TB built-in SSD, 3 flight batteries, charging hub, ND filter set, and DJI RC Pro high-bright controller. Perfect for safari wildlife documentaries and commercial cinema.",
        seller: {
            name: "Highveld Cinema Gear",
            avatar: "HC",
            rating: 4.9,
            reviewsCount: 88,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 15
    },
    {
        id: "serv-108",
        title: "Industrial Borehole Drilling & Water Geotesting (Solar Submersible Pump Setup)",
        category: "services",
        format: "service",
        currentPrice: 220, // Consultation & geological survey fee
        city: "Nairobi, Kenya",
        neighborhood: "Westlands & Karen",
        distanceMiles: 4.0,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
        description: "Comprehensive water exploration: Hydrogeological survey report, NEMA environmental EIA licenses, drilling with hydraulic rotary rig down to 180 meters, steel casing, test pumping, and automated solar pumping setup. Over 15 years experience in Kenya and East Africa.",
        seller: {
            name: "Amani Borehole & Geo Ltd",
            avatar: "AB",
            rating: 4.9,
            reviewsCount: 114,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 30
    },
    {
        id: "serv-109",
        title: "100 Bags Premium Nigerian Parboiled Long-Grain Rice (50kg Stone-Free Export Quality)",
        category: "agriculture",
        format: "buy_now",
        currentPrice: 3400, // Total for wholesale lot ($34/bag)
        buyItNowPrice: 3400,
        city: "Kano, Nigeria",
        neighborhood: "Dawanau Grain Market / Bompai",
        distanceMiles: 7.5,
        fulfillment: "both",
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
        description: "Direct from farm processing mill. Sortex cleaned 100% stone-free, non-sticky long grain parboiled rice. Minimum order 50 bags. Interstate trailer haulage coordinated to Lagos, Abuja, Onitsha, or Port Harcourt. Escrow inspection guarantee.",
        seller: {
            name: "Sahel Agro Commodities",
            avatar: "SA",
            rating: 5.0,
            reviewsCount: 182,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 14
    },
    {
        id: "serv-110",
        title: "Traditional Rwandan Agaseke Peace Baskets & Handmade Imigongo Heritage Art",
        category: "collectibles",
        format: "auction",
        startingPrice: 110,
        currentPrice: 195,
        reservePrice: 180,
        bidsCount: 9,
        endTime: Date.now() + 1000 * 60 * 60 * 5.5,
        city: "Kigali, Rwanda",
        neighborhood: "Kiyovu / Kimihurura",
        distanceMiles: 2.8,
        fulfillment: "both",
        shippingFee: 20.00,
        imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
        description: "Authentic cooperative collection from Eastern Rwanda. Handwoven sisal fiber Agaseke peace baskets paired with two classic geometric Imigongo wall reliefs made from natural organic pigments. Symbol of reconciliation and African craft excellence.",
        seller: {
            name: "Kigali Artisans Guild",
            avatar: "KA",
            rating: 5.0,
            reviewsCount: 47,
            verified: true
        },
        bidHistory: [
            { bidder: "u***6 (Kigali)", amount: 195, time: "22 mins ago" },
            { bidder: "p***3 (Nairobi)", amount: 175, time: "2 hours ago" },
            { bidder: "j***9 (Johannesburg)", amount: 150, time: "5 hours ago" }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 36
    },
    {
        id: "serv-111",
        title: "Tokunbo Lexus RX350 (2GR-FE V6 Engine) + Complete 6-Speed Automatic Transmission",
        category: "vehicles",
        format: "buy_now",
        currentPrice: 2100,
        buyItNowPrice: 2100,
        city: "Lagos, Nigeria",
        neighborhood: "Ladipo Auto Spare Parts Market (Mushin)",
        distanceMiles: 5.2,
        fulfillment: "both",
        imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
        description: "Direct clean foreign-used (Tokunbo) 3.5L 2GR-FE engine with intact wire harness and ECU computer box. Tested compression on all 6 cylinders (175 psi even). Comes with 3-month replacement warranty. Workshop engine testing available at Ladipo.",
        seller: {
            name: "Alhaji Musa Japanese Motors",
            avatar: "AM",
            rating: 4.8,
            reviewsCount: 310,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 19
    },
    {
        id: "serv-112",
        title: "Luxury 3-Bedroom Furnished Serviced Apartment (24/7 Solar Power + Pool)",
        category: "housing",
        format: "buy_now",
        currentPrice: 180, // Daily shortlet rate
        buyItNowPrice: 180,
        city: "Accra, Ghana",
        neighborhood: "East Legon / Airport Residential",
        distanceMiles: 4.1,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        description: "Executive shortlet accommodation in prime East Legon. High-speed fibre internet, fully equipped chef kitchen, dedicated 20kVA solar inverter backup, 24/7 security guard, swimming pool, and gym access. 8 minutes drive from Kotoka International Airport.",
        seller: {
            name: "Accra Prime Shortlets",
            avatar: "AP",
            rating: 4.9,
            reviewsCount: 125,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 8
    },

    // ========================================================================
    // SEED BUYER REQUESTS (WANTED / ISO / RFQ FOR GOODS & SERVICES)
    // ========================================================================
    {
        id: "req-200",
        title: "ISO: 5kVA or 10kVA Felicity / Deye Hybrid Inverter + 48V Lithium Battery Bank",
        category: "solar",
        format: "request_good",
        isRequest: true,
        requestType: "good",
        budget: 2400, // Target budget in USD (~₦3,600,000)
        currentPrice: 2400,
        startingPrice: 2400,
        urgency: "ASAP (Within 24 Hours)",
        condition: "Brand New Sealed in Box",
        city: "Lagos, Nigeria",
        neighborhood: "Lekki Phase 1 (Admiralty Way)",
        distanceMiles: 2.1,
        fulfillment: "both",
        imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        description: "Urgent setup needed for home office in Lekki. Looking for a genuine 5kVA or 8kVA pure sine wave hybrid inverter with parallel card support and a 48V 200Ah (10kWh) LiFePO4 battery rack. Must include warranty card. Ready to pay via Servilist Escrow immediately.",
        seller: {
            name: "John Doe (You)",
            avatar: "JD",
            rating: 5.0,
            reviewsCount: 1,
            verified: true
        },
        offers: [
            {
                id: "off-0",
                providerName: "Lekki Solar Tech Solutions",
                providerAvatar: "LS",
                providerRating: 5.0,
                price: 2350,
                timeline: "Delivery & Setup in 3 Hours",
                message: "We have original Felicity Solar 5kVA 48V Hybrid + 10kWh lithium battery in our Lekki warehouse. Can dispatch our installation van immediately.",
                time: "20 mins ago",
                status: "Pending"
            },
            {
                id: "off-1",
                providerName: "Alaba Solar Direct",
                providerAvatar: "AS",
                providerRating: 4.8,
                price: 2200,
                timeline: "Delivery Tomorrow Morning",
                message: "Direct distributor price from Alaba International Market. Includes 5-year Felicity factory warranty certificate and battery BMS display.",
                time: "1 hour ago",
                status: "Pending"
            }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 4
    },
    {
        id: "req-201",
        title: "Wanted: Clean 2018-2021 Toyota RAV4 or Harrier (Direct Japanese Clean Tokunbo)",
        category: "vehicles",
        format: "request_good",
        isRequest: true,
        requestType: "good",
        budget: 18500, // in USD (~KSh 2,405,000)
        currentPrice: 18500,
        startingPrice: 18500,
        urgency: "Within 2-3 Days",
        condition: "Gently Used / Clean Foreign Used",
        city: "Nairobi, Kenya",
        neighborhood: "Westlands / Kilimani",
        distanceMiles: 3.4,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
        description: "Looking for a clean Toyota RAV4 (XA50) or Harrier with mileage under 60,000 km. Prefer leather interior, reverse camera, and lane assist. Full inspection at AA Kenya or Sarit Centre safe zone required before payment release.",
        seller: {
            name: "Kariuki Mwangi",
            avatar: "KM",
            rating: 4.9,
            reviewsCount: 12,
            verified: true
        },
        offers: [
            {
                id: "off-2",
                providerName: "Westlands Executive Motors",
                providerAvatar: "WM",
                providerRating: 4.9,
                price: 18200,
                timeline: "Available Today for Inspection",
                message: "We have a 2019 Toyota RAV4 G-Grade in pearl white just cleared from Mombasa port. Full auction sheet Grade 4.5. Happy to meet at Sarit Centre.",
                time: "45 mins ago",
                status: "Pending"
            }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 16
    },
    {
        id: "req-202",
        title: "Need Solar Installation Engineer to Wire 16x 550W Canadian Solar Panels & Inverter",
        category: "services",
        format: "request_service",
        isRequest: true,
        requestType: "service",
        budget: 350, // in USD (~₦525,000)
        currentPrice: 350,
        startingPrice: 350,
        urgency: "ASAP (Within 24 Hours)",
        city: "Lagos, Nigeria",
        neighborhood: "Victoria Island (Oniru)",
        distanceMiles: 2.7,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80",
        description: "All equipment is already on site (16x 550W Canadian solar monocrystalline panels, aluminum roof rails, 10kVA Deye inverter, DC surge arresters, and cables). Need certified technician for roof mount cabling, string combiner wiring, and earthing spike testing.",
        seller: {
            name: "John Doe (You)",
            avatar: "JD",
            rating: 5.0,
            reviewsCount: 1,
            verified: true
        },
        offers: [
            {
                id: "off-3",
                providerName: "Engr. Babatunde Solar",
                providerAvatar: "BS",
                providerRating: 5.0,
                price: 320,
                timeline: "Tomorrow Morning (8:00 AM)",
                message: "COREN registered. Have done over 180 commercial and residential roof strings. Price includes DC cable crimping, combiner fuse boxes, and full earthing megger test.",
                time: "30 mins ago",
                status: "Under Review"
            }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 6
    },
    {
        id: "req-203",
        title: "Wanted: Wholesale Raw Shea Butter (50kg Bulk Sacks) & Organic Cocoa Pods",
        category: "agriculture",
        format: "request_good",
        isRequest: true,
        requestType: "good",
        budget: 650, // in USD (~GH₵ 10,075)
        currentPrice: 650,
        startingPrice: 650,
        urgency: "Within 1-2 Weeks",
        condition: "Fresh Harvest / Grade A",
        city: "Accra, Ghana",
        neighborhood: "Circle / Makola Market",
        distanceMiles: 4.8,
        fulfillment: "both",
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
        description: "Looking for unrefined ivory Grade A shea butter sourced from Northern Ghana cooperatives. Must be 100% natural without chemical processing. Also looking for dried unroasted organic cocoa beans for cosmetic formulation.",
        seller: {
            name: "Abena Cosmetics Ltd",
            avatar: "AC",
            rating: 5.0,
            reviewsCount: 28,
            verified: true
        },
        offers: [],
        createdAt: Date.now() - 1000 * 60 * 60 * 20
    },
    {
        id: "req-204",
        title: "ISO: iPhone 16 Pro Max 256GB Desert Titanium (Factory Unlocked, Dual eSIM)",
        category: "electronics",
        format: "request_good",
        isRequest: true,
        requestType: "good",
        budget: 1250, // in USD (~KSh 162,500)
        currentPrice: 1250,
        startingPrice: 1250,
        urgency: "ASAP (Within 24 Hours)",
        condition: "Brand New Sealed in Box",
        city: "Nairobi, Kenya",
        neighborhood: "Kilimani / Yaya Centre",
        distanceMiles: 1.9,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        description: "Looking for brand new sealed 256GB Desert Titanium iPhone 16 Pro Max. Must be factory unlocked with clean IMEI and 1-year Apple international warranty. Cash or M-Pesa on inspection at safe public coffee shop in Yaya Centre.",
        seller: {
            name: "Brian Otieno",
            avatar: "BO",
            rating: 4.8,
            reviewsCount: 9,
            verified: true
        },
        offers: [],
        createdAt: Date.now() - 1000 * 60 * 60 * 10
    },
    {
        id: "req-205",
        title: "Need Licensed Borehole Driller with Hydraulic Rig for 90m Depth Well",
        category: "services",
        format: "request_service",
        isRequest: true,
        requestType: "service",
        budget: 1800, // in USD (~KSh 234,000)
        currentPrice: 1800,
        startingPrice: 1800,
        urgency: "Flexible / This Month",
        city: "Nairobi, Kenya",
        neighborhood: "Karen / Ngong Road",
        distanceMiles: 5.0,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
        description: "Residential compound in Karen needs deep borehole drilling. Geological survey report already in hand pointing to aquifer at approx 75-90m. Quote should include mobilization, drilling, test pumping, and steel casing installation.",
        seller: {
            name: "Grace Wanjiku",
            avatar: "GW",
            rating: 5.0,
            reviewsCount: 16,
            verified: true
        },
        offers: [
            {
                id: "off-4",
                providerName: "Amani Borehole & Geo Ltd",
                providerAvatar: "AB",
                providerRating: 4.9,
                price: 1750,
                timeline: "Site mobilization on Monday",
                message: "We have our track-mounted rig stationed in Karen right now. Can mobilize on Monday morning with full steel casing and gravel packing.",
                time: "2 hours ago",
                status: "Pending"
            }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 26
    }
];

// Sample preset photos for posting modal
const SAMPLE_PRESET_PHOTOS = [
    { label: "MacBook / Tech", url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80" },
    { label: "Solar & Inverter", url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80" },
    { label: "Phones & Gadgets", url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80" },
    { label: "Vehicles / Tokunbo", url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80" },
    { label: "Generators / Heavy", url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80" },
    { label: "African Heritage & Art", url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=800&q=80" }
];

// ============================================================================
// 3. MAIN APPLICATION ENGINE (SERVILIST AFRICA)
// ============================================================================

class ServilistApp {
    constructor() {
        this.listings = [];
        this.watchlist = new Set();
        this.myBids = {}; // { [listingId]: { amount, status, time } }
        this.myRequests = new Set(); // set of request IDs posted by user
        this.myQuotes = {}; // { [listingId]: { quoteId, price, timeline, message, time, itemTitle, status } }
        this.escrowOrders = []; // active escrow transactions
        this.currentListingDetail = null;

        this.migrateStorageKeys();

        // Active African Currency (Default NGN, or from storage)
        this.activeCurrency = localStorage.getItem("servilist_currency") || "NGN";

        this.marketMode = "all"; // 'all' | 'supply' | 'requests'
        this.activeDashboardTab = "overview";

        this.filters = {
            city: "Lagos, Nigeria",
            category: "all",
            formatPill: "all",
            formatCheckboxes: ["auction", "buy_now", "service", "free_barter", "request_good", "request_service"],
            fulfillmentCheckboxes: ["pickup", "shipping"],
            radius: 50,
            minPrice: null,
            maxPrice: null,
            searchQuery: ""
        };

        this.sortMode = "ending_soon";
        this.viewMode = "grid"; // 'grid' | 'list'
        this.activeDrawerTab = "watchlist";

        this.init();
    }

    init() {
        this.validateDomBindings();
        this.loadStorage();
        this.syncCurrencyUI();
        this.bindEvents();
        this.renderCategoryCounts();
        this.renderPresetPhotos();
        this.renderListings();
        this.updateTopBarStats();
        this.updateWatchlistBadges();
        this.updateMyBidsBadges();
        this.updateMyRequestsBadges();
        this.updateMyQuotesBadges();
        this.updateEscrowBadge();
        this.startTimerTicker();
        this.initSupabaseSync();
    }

    // ========================================================================
    // STORAGE & DATA HANDLING
    // ========================================================================

    migrateStorageKeys() {
        const keys = ["items", "watchlist", "my_bids", "my_requests", "my_quotes", "escrow_orders", "currency"];
        keys.forEach(k => {
            const oldKey = "servlist_" + k;
            const newKey = "servilist_" + k;
            const oldVal = localStorage.getItem(oldKey);
            if (oldVal !== null && localStorage.getItem(newKey) === null) {
                localStorage.setItem(newKey, oldVal);
            }
        });
    }

    validateDomBindings() {
        const expectedIds = [
            "citySelector", "currencySelector", "openConverterBtn", "pillConverterBtn",
            "closeConverterModalBtn", "converterModalOverlay", "calcAmountInput",
            "calcFromCurrency", "calcToCurrency", "calcSwapBtn", "topDashboardsBtn",
            "openDashboardsBtn", "closeDashboardModalBtn", "dashboardsModalOverlay",
            "btnTestSupabase", "btnSyncSupabase", "btnDownloadSchema", "btnResetSeedData",
            "btnClearConsole", "headerCategorySelect", "searchInput", "clearSearchBtn",
            "searchSubmitBtn", "sortSelector", "viewGridBtn", "viewListBtn",
            "openPostModalBtn", "openRequestModalBtn", "closePostModalBtn",
            "postModalOverlay", "modalTabSell", "modalTabRequest", "postListingForm",
            "postRequestForm", "viewWatchlistBtn", "viewMyBidsBtn", "viewMyRequestsBtn",
            "closeDrawerBtn", "drawerModalOverlay", "closeDetailModalBtn", "detailModalOverlay",
            "closeChatModalBtn", "chatModalOverlay", "chatForm", "resetFiltersBtn",
            "appliedChipsRow", "chipsList", "clearAllChipsBtn", "resultsCountText",
            "listingsContainer", "countSolar", "countAgriculture", "logoReset",
            "footerConverterLink", "footerWatchlistLink", "footerBidsLink",
            "footerRequestsLink", "newsletterBtn", "newsletterInput", "btnContactSeller"
        ];
        const missing = expectedIds.filter(id => !document.getElementById(id));
        if (missing.length > 0) {
            console.warn("[Servilist DOM Validation] Missing element IDs in HTML:", missing);
        } else {
            console.info("[Servilist DOM Validation] All expected DOM elements verified successfully.");
        }
        return missing;
    }

    loadStorage() {
        try {
            const savedListings = localStorage.getItem("servilist_items");
            if (savedListings) {
                this.listings = JSON.parse(savedListings);
                // Verify African listings present; if legacy US data, upgrade cleanly
                const isAfricanData = this.listings.some(l => typeof l?.city === "string" && (l.city.includes("Nigeria") || l.city.includes("Kenya")));
                if (!isAfricanData) {
                    this.listings = JSON.parse(JSON.stringify(SEED_LISTINGS));
                    this.saveListings();
                }
            } else {
                this.listings = JSON.parse(JSON.stringify(SEED_LISTINGS));
                this.saveListings();
            }

            const savedWatchlist = localStorage.getItem("servilist_watchlist");
            if (savedWatchlist) {
                this.watchlist = new Set(JSON.parse(savedWatchlist));
            }

            const savedBids = localStorage.getItem("servilist_my_bids");
            if (savedBids) {
                this.myBids = JSON.parse(savedBids);
            }

            const savedRequests = localStorage.getItem("servilist_my_requests");
            if (savedRequests) {
                this.myRequests = new Set(JSON.parse(savedRequests));
            } else {
                this.myRequests = new Set(["req-200", "req-202"]);
                this.saveMyRequests();
            }

            const savedQuotes = localStorage.getItem("servilist_my_quotes");
            if (savedQuotes) {
                this.myQuotes = JSON.parse(savedQuotes);
            } else {
                this.myQuotes = {
                    "req-202": {
                        quoteId: "quote-sample-1",
                        price: 320,
                        timeline: "Tomorrow Morning (8:00 AM)",
                        message: "COREN registered electrical engineer. Price includes DC cable crimping and full earthing megger test.",
                        time: "30 mins ago",
                        itemTitle: "Need Solar Installation Engineer to Wire 16x 550W Canadian Solar Panels & Inverter",
                        status: "Under Review"
                    }
                };
                this.saveMyQuotes();
            }

            // Escrow Orders
            const savedEscrow = localStorage.getItem("servilist_escrow_orders");
            if (savedEscrow) {
                this.escrowOrders = JSON.parse(savedEscrow);
            } else {
                this.escrowOrders = [
                    {
                        id: "ESC-8924",
                        itemId: "serv-101",
                        title: "Apple MacBook Pro 14\" M3 Max Space Black",
                        buyerName: "John Doe (You)",
                        sellerName: "Chukwudi Electronics (Ikeja)",
                        amountUsd: 1850,
                        targetCurrency: "NGN",
                        status: "inspection", // 'funded', 'inspection', 'verified', 'released'
                        otpCode: "742-890",
                        safeZone: "Ikeja City Mall (Alausa) Safe Public Meetup Zone",
                        createdAt: Date.now() - 1000 * 60 * 60 * 3
                    },
                    {
                        id: "ESC-5120",
                        itemId: "req-202",
                        title: "16x 550W Solar Panel Wiring & Inverter Installation",
                        buyerName: "John Doe (You)",
                        sellerName: "Engr. Babatunde Solar",
                        amountUsd: 320,
                        targetCurrency: "NGN",
                        status: "funded",
                        otpCode: "389-114",
                        safeZone: "Victoria Island Oniru Site",
                        createdAt: Date.now() - 1000 * 60 * 50
                    }
                ];
                this.saveEscrowOrders();
            }
        } catch (e) {
            console.warn("Storage error, fallback to African seeds", e);
            this.listings = JSON.parse(JSON.stringify(SEED_LISTINGS));
        }
    }

    saveListings() {
        localStorage.setItem("servilist_items", JSON.stringify(this.listings));
    }

    saveWatchlist() {
        localStorage.setItem("servilist_watchlist", JSON.stringify(Array.from(this.watchlist)));
        this.updateWatchlistBadges();
    }

    saveMyBids() {
        localStorage.setItem("servilist_my_bids", JSON.stringify(this.myBids));
        this.updateMyBidsBadges();
    }

    saveMyRequests() {
        localStorage.setItem("servilist_my_requests", JSON.stringify(Array.from(this.myRequests)));
        this.updateMyRequestsBadges();
    }

    saveMyQuotes() {
        localStorage.setItem("servilist_my_quotes", JSON.stringify(this.myQuotes));
        this.updateMyQuotesBadges();
    }

    saveEscrowOrders() {
        localStorage.setItem("servilist_escrow_orders", JSON.stringify(this.escrowOrders));
        this.updateEscrowBadge();
    }

    // ========================================================================
    // CURRENCY CONVERSION & FORMATTING ENGINE
    // ========================================================================

    setCurrency(currCode) {
        if (!CURRENCY_CONFIG[currCode]) return;
        this.activeCurrency = currCode;
        localStorage.setItem("servilist_currency", currCode);

        this.syncCurrencyUI();
        this.renderListings();
        this.updateTopBarStats();
        if (this.currentListingDetail) {
            this.renderDetailActionBox(this.currentListingDetail);
        }
        this.updateDashboardMetrics();
    }

    syncCurrencyUI() {
        const currSelector = document.getElementById("currencySelector");
        if (currSelector) currSelector.value = this.activeCurrency;

        const config = CURRENCY_CONFIG[this.activeCurrency] || CURRENCY_CONFIG.NGN;

        // Update form currency symbol labels
        const pStart = document.getElementById("postStartPriceSym");
        const pRes = document.getElementById("postReservePriceSym");
        const rBud = document.getElementById("reqBudgetSym");
        const pMin = document.getElementById("priceCurrencyPrefixMin");
        const pMax = document.getElementById("priceCurrencyPrefixMax");

        if (pStart) pStart.textContent = config.symbol.trim();
        if (pRes) pRes.textContent = config.symbol.trim();
        if (rBud) rBud.textContent = config.symbol.trim();
        if (pMin) pMin.textContent = config.symbol.trim();
        if (pMax) pMax.textContent = config.symbol.trim();
    }

    formatMoney(usdAmount, showSecondary = true) {
        if (usdAmount === null || usdAmount === undefined || isNaN(usdAmount)) return "N/A";
        const config = CURRENCY_CONFIG[this.activeCurrency] || CURRENCY_CONFIG.NGN;
        const converted = usdAmount * config.rate;

        let formattedNum = "";
        if (config.decimals === 0) {
            formattedNum = Math.round(converted).toLocaleString();
        } else {
            formattedNum = converted.toLocaleString(undefined, { minimumFractionDigits: config.decimals, maximumFractionDigits: config.decimals });
        }

        const primaryStr = `${config.symbol}${formattedNum}`;

        if (this.activeCurrency !== "USD" && showSecondary) {
            const usdStr = Math.round(usdAmount).toLocaleString();
            return `${primaryStr} <span class="price-secondary-usd">≈ $${usdStr}</span>`;
        }

        return primaryStr;
    }

    convertBetween(amount, fromCurr, toCurr) {
        const fromCfg = CURRENCY_CONFIG[fromCurr] || CURRENCY_CONFIG.USD;
        const toCfg = CURRENCY_CONFIG[toCurr] || CURRENCY_CONFIG.USD;

        // Convert From -> USD -> To
        const inUsd = amount / fromCfg.rate;
        const converted = inUsd * toCfg.rate;
        return { converted, inUsd };
    }

    // ========================================================================
    // EVENT BINDINGS
    // ========================================================================

    bindEvents() {
        // 1. City Selector (with intelligent currency matching)
        const citySelector = document.getElementById("citySelector");
        if (citySelector) {
            citySelector.value = this.filters.city;
            citySelector.addEventListener("change", (e) => {
                const newCity = e.target.value;
                this.filters.city = newCity;

                // Auto-switch currency matching city if available
                const suggestedCurr = CITY_TO_CURRENCY[newCity];
                if (suggestedCurr && suggestedCurr !== this.activeCurrency) {
                    this.setCurrency(suggestedCurr);
                    this.showToast(`Switched market to ${newCity} (${suggestedCurr} ${CURRENCY_CONFIG[suggestedCurr].symbol})`, "info");
                } else {
                    this.showToast(`Switched market to ${newCity}`, "info");
                }

                this.renderListings();
                this.renderCategoryCounts();
            });
        }

        // 2. Currency Selector
        const currencySelector = document.getElementById("currencySelector");
        if (currencySelector) {
            currencySelector.addEventListener("change", (e) => {
                this.setCurrency(e.target.value);
                this.showToast(`Active currency: ${e.target.value} (${CURRENCY_CONFIG[e.target.value].name})`, "info");
            });
        }

        // 3. Currency Converter Modal Trigger Buttons
        const openConvBtn = document.getElementById("openConverterBtn");
        const pillConvBtn = document.getElementById("pillConverterBtn");
        if (openConvBtn) openConvBtn.addEventListener("click", () => this.openConverterModal());
        if (pillConvBtn) pillConvBtn.addEventListener("click", () => this.openConverterModal());

        const closeConvBtn = document.getElementById("closeConverterModalBtn");
        if (closeConvBtn) {
            closeConvBtn.addEventListener("click", () => {
                document.getElementById("converterModalOverlay").style.display = "none";
                document.body.style.overflow = "auto";
            });
        }

        // Converter Inputs
        const calcAmount = document.getElementById("calcAmountInput");
        const calcFrom = document.getElementById("calcFromCurrency");
        const calcTo = document.getElementById("calcToCurrency");
        const calcSwap = document.getElementById("calcSwapBtn");

        if (calcAmount) calcAmount.addEventListener("input", () => this.updateConverterResults());
        if (calcFrom) calcFrom.addEventListener("change", () => this.updateConverterResults());
        if (calcTo) calcTo.addEventListener("change", () => this.updateConverterResults());
        if (calcSwap) {
            calcSwap.addEventListener("click", () => {
                const temp = calcFrom.value;
                calcFrom.value = calcTo.value;
                calcTo.value = temp;
                this.updateConverterResults();
            });
        }

        // Converter Quick Presets
        document.querySelectorAll(".btn-conv-preset").forEach(btn => {
            btn.addEventListener("click", () => {
                const amount = parseFloat(btn.dataset.amount);
                const curr = btn.dataset.curr;
                if (calcAmount) calcAmount.value = amount;
                if (calcFrom && curr) calcFrom.value = curr;
                this.updateConverterResults();
            });
        });

        // 4. Dashboards Modal Trigger Buttons
        const topDashBtn = document.getElementById("topDashboardsBtn");
        const openDashBtn = document.getElementById("openDashboardsBtn");
        if (topDashBtn) topDashBtn.addEventListener("click", () => this.openDashboardsModal());
        if (openDashBtn) openDashBtn.addEventListener("click", () => this.openDashboardsModal());

        const closeDashBtn = document.getElementById("closeDashboardModalBtn");
        if (closeDashBtn) {
            closeDashBtn.addEventListener("click", () => {
                document.getElementById("dashboardsModalOverlay").style.display = "none";
                document.body.style.overflow = "auto";
            });
        }

        // Dashboard Tabs Navigation
        document.querySelectorAll(".dash-nav-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const tab = btn.dataset.tab;
                this.switchDashboardTab(tab);
            });
        });

        // Supabase Buttons in Dashboard
        const btnTestSupa = document.getElementById("btnTestSupabase");
        if (btnTestSupa) {
            btnTestSupa.addEventListener("click", async () => {
                const res = await window.servlistSupabase?.testConnection();
                if (res?.success) {
                    this.showToast("🟢 Supabase cloud ping successful!", "success");
                    this.updateCloudStatusPill(true);
                } else {
                    this.showToast("Supabase ping failed: " + (res?.error || "Backend unavailable"), "info");
                }
            });
        }

        const btnSyncSupa = document.getElementById("btnSyncSupabase");
        if (btnSyncSupa) {
            btnSyncSupa.addEventListener("click", async () => {
                const supa = window.servilistSupabase || window.servlistSupabase;
                const res = await supa?.syncToCloud({
                    listings: this.listings,
                    requests: this.listings.filter(l => Boolean(l.isRequest || (l.format && l.format.startsWith("request_")))),
                    escrow: this.escrowOrders
                });
                if (res?.success) {
                    this.showToast("🎉 All local data synced to Supabase!", "success");
                } else {
                    this.showToast("Saved locally. Backend Supabase sync is unavailable.", "info");
                }
            });
        }

        const btnDownloadSchema = document.getElementById("btnDownloadSchema");
        if (btnDownloadSchema) {
            btnDownloadSchema.addEventListener("click", () => {
                window.open("supabase_schema.sql", "_blank");
                this.showToast("Opening supabase_schema.sql", "info");
            });
        }

        const btnResetSeeds = document.getElementById("btnResetSeedData");
        if (btnResetSeeds) {
            btnResetSeeds.addEventListener("click", () => {
                if (confirm("Reset marketplace to authentic African seed listings & requests?")) {
                    this.listings = JSON.parse(JSON.stringify(SEED_LISTINGS));
                    this.saveListings();
                    this.renderListings();
                    this.renderCategoryCounts();
                    this.updateTopBarStats();
                    this.showToast("African marketplace seed data restored", "success");
                    this.updateDashboardMetrics();
                }
            });
        }

        const btnClearConsole = document.getElementById("btnClearConsole");
        if (btnClearConsole) {
            btnClearConsole.addEventListener("click", () => {
                const c = document.getElementById("supaConsoleLogs");
                if (c) c.innerHTML = '<div class="log-line info">[System] Log cleared. Ready.</div>';
            });
        }

        // Dashboard quick action shortcuts
        const dashNewListBtn = document.getElementById("dashNewListingBtn");
        if (dashNewListBtn) {
            dashNewListBtn.addEventListener("click", () => {
                document.getElementById("dashboardsModalOverlay").style.display = "none";
                this.openPostListingModal();
            });
        }

        const dashNewReqBtn = document.getElementById("dashNewRequestBtn");
        if (dashNewReqBtn) {
            dashNewReqBtn.addEventListener("click", () => {
                document.getElementById("dashboardsModalOverlay").style.display = "none";
                this.openPostRequestModal();
            });
        }

        // Seller Sub-filters in Seller Hub
        document.querySelectorAll(".seller-sub-pill").forEach(pill => {
            pill.addEventListener("click", () => {
                document.querySelectorAll(".seller-sub-pill").forEach(p => p.classList.remove("active"));
                pill.classList.add("active");
                this.renderSellerListings(pill.dataset.filter);
            });
        });

        // 5. Header Category Dropdown
        const headerCat = document.getElementById("headerCategorySelect");
        if (headerCat) {
            headerCat.addEventListener("change", (e) => this.setCategory(e.target.value));
        }

        // Category Tree Sidebar
        document.querySelectorAll("#categoryTree .category-item").forEach(item => {
            item.addEventListener("click", () => this.setCategory(item.dataset.cat));
        });

        // 6. Omnibar Search
        const searchInput = document.getElementById("searchInput");
        const clearSearchBtn = document.getElementById("clearSearchBtn");
        const searchSubmitBtn = document.getElementById("searchSubmitBtn");

        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.filters.searchQuery = e.target.value.trim();
                if (clearSearchBtn) clearSearchBtn.style.display = this.filters.searchQuery ? "block" : "none";
                this.renderListings();
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener("click", () => {
                if (searchInput) searchInput.value = "";
                this.filters.searchQuery = "";
                clearSearchBtn.style.display = "none";
                this.renderListings();
            });
        }

        if (searchSubmitBtn) {
            searchSubmitBtn.addEventListener("click", () => this.renderListings());
        }

        // 7. Format Pills Bar (eBay Auction vs Craigslist Local vs Buyer Requests)
        document.querySelectorAll("#formatPills .pill-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll("#formatPills .pill-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.filters.formatPill = btn.dataset.format;
                this.renderListings();
            });
        });

        // Market Mode Control Switcher
        document.querySelectorAll("#marketModeControl .mode-seg-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll("#marketModeControl .mode-seg-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.marketMode = btn.dataset.marketMode || btn.dataset.mode || "all";
                this.renderListings();
            });
        });

        // Sidebar Checkboxes
        document.querySelectorAll("input[name='formatFilter']").forEach(cb => {
            cb.addEventListener("change", () => {
                const checked = Array.from(document.querySelectorAll("input[name='formatFilter']:checked")).map(c => c.value);
                this.filters.formatCheckboxes = checked;
                this.renderListings();
            });
        });

        document.querySelectorAll("input[name='fulfillmentFilter']").forEach(cb => {
            cb.addEventListener("change", () => {
                const checked = Array.from(document.querySelectorAll("input[name='fulfillmentFilter']:checked")).map(c => c.value);
                this.filters.fulfillmentCheckboxes = checked;
                this.renderListings();
            });
        });

        // Price Filter Apply
        const applyPriceBtn = document.getElementById("applyPriceBtn");
        if (applyPriceBtn) {
            applyPriceBtn.addEventListener("click", () => {
                const min = document.getElementById("minPriceInput").value;
                const max = document.getElementById("maxPriceInput").value;
                const config = CURRENCY_CONFIG[this.activeCurrency] || CURRENCY_CONFIG.NGN;
                // Convert back to USD baseline for filtering
                this.filters.minPrice = min ? parseFloat(min) / config.rate : null;
                this.filters.maxPrice = max ? parseFloat(max) / config.rate : null;
                this.renderListings();
            });
        }

        // Reset Filters Button
        const resetFiltersBtn = document.getElementById("resetFiltersBtn");
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener("click", () => this.resetFilters());
        }

        // Logo Reset link
        const logoReset = document.getElementById("logoReset");
        if (logoReset) {
            logoReset.addEventListener("click", (e) => {
                e.preventDefault();
                this.resetFilters();
            });
        }

        // Clear All Chips Button
        const clearAllChipsBtn = document.getElementById("clearAllChipsBtn");
        if (clearAllChipsBtn) {
            clearAllChipsBtn.addEventListener("click", () => this.resetFilters());
        }

        // Sort Selector
        const sortSelect = document.getElementById("sortSelector") || document.getElementById("sortSelect");
        if (sortSelect) {
            sortSelect.value = this.sortMode;
            sortSelect.addEventListener("change", (e) => {
                this.sortMode = e.target.value;
                this.renderListings();
            });
        }

        // View Mode Toggle (Grid vs List)
        const gridBtn = document.getElementById("viewGridBtn") || document.getElementById("gridViewBtn");
        const listBtn = document.getElementById("viewListBtn") || document.getElementById("listViewBtn");
        const listingsContainer = document.getElementById("listingsContainer");
        if (gridBtn && listBtn && listingsContainer) {
            gridBtn.addEventListener("click", () => {
                this.viewMode = "grid";
                gridBtn.classList.add("active");
                listBtn.classList.remove("active");
                listingsContainer.className = "listings-container grid-mode";
            });
            listBtn.addEventListener("click", () => {
                this.viewMode = "list";
                listBtn.classList.add("active");
                gridBtn.classList.remove("active");
                listingsContainer.className = "listings-container list-mode";
            });
        }

        // 8. Modals: Post Listing & Post Request
        const openPostModalBtn = document.getElementById("openPostModalBtn");
        if (openPostModalBtn) openPostModalBtn.addEventListener("click", () => this.openPostListingModal());

        const openRequestModalBtn = document.getElementById("openRequestModalBtn");
        if (openRequestModalBtn) openRequestModalBtn.addEventListener("click", () => this.openPostRequestModal());

        const closePostModalBtn = document.getElementById("closePostModalBtn");
        if (closePostModalBtn) {
            closePostModalBtn.addEventListener("click", () => {
                document.getElementById("postModalOverlay").style.display = "none";
                document.body.style.overflow = "auto";
            });
        }

        const cancelPostBtn = document.getElementById("cancelPostBtn");
        if (cancelPostBtn) {
            cancelPostBtn.addEventListener("click", () => {
                document.getElementById("postModalOverlay").style.display = "none";
                document.body.style.overflow = "auto";
            });
        }

        const cancelReqBtn = document.getElementById("cancelReqBtn");
        if (cancelReqBtn) {
            cancelReqBtn.addEventListener("click", () => {
                document.getElementById("postModalOverlay").style.display = "none";
                document.body.style.overflow = "auto";
            });
        }

        // Post Form Type Tabs (Listing vs Request inside Modal)
        const tabSell = document.getElementById("modalTabSell") || document.getElementById("tabModePost");
        const tabReq = document.getElementById("modalTabRequest") || document.getElementById("tabModeReq");
        const pForm = document.getElementById("postListingForm");
        const rForm = document.getElementById("postRequestForm");
        if (tabSell && tabReq) {
            tabSell.addEventListener("click", () => {
                tabSell.classList.add("active");
                tabReq.classList.remove("active");
                if (pForm) pForm.style.display = "flex";
                if (rForm) rForm.style.display = "none";
            });
            tabReq.addEventListener("click", () => {
                tabReq.classList.add("active");
                tabSell.classList.remove("active");
                if (pForm) pForm.style.display = "none";
                if (rForm) rForm.style.display = "flex";
            });
        }

        // Dynamic Post Form Fields by Listing Type
        document.querySelectorAll("input[name='postFormat'], input[name='listingFormat']").forEach(radio => {
            radio.addEventListener("change", (e) => {
                this.updatePostFormatFields(e.target.value);
            });
        });

        // Dynamic Request Form Fields by Request Type (Good vs Service)
        document.querySelectorAll("input[name='requestType']").forEach(radio => {
            radio.addEventListener("change", (e) => {
                this.updateRequestTypeFields(e.target.value);
            });
        });

        // Listing Form Submit
        const postListingForm = document.getElementById("postListingForm");
        if (postListingForm) {
            postListingForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleCreateListing();
            });
        }

        // Request Form Submit
        const postRequestForm = document.getElementById("postRequestForm");
        if (postRequestForm) {
            postRequestForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleCreateRequest();
            });
        }

        // 9. Drawer (Watchlist, My Bids, My Requests, My Quotes)
        const viewWatchlistBtn = document.getElementById("viewWatchlistBtn");
        const viewMyBidsBtn = document.getElementById("viewMyBidsBtn");
        const viewMyRequestsBtn = document.getElementById("viewMyRequestsBtn");

        if (viewWatchlistBtn) viewWatchlistBtn.addEventListener("click", () => this.openDrawer("watchlist"));
        if (viewMyBidsBtn) viewMyBidsBtn.addEventListener("click", () => this.openDrawer("my_bids"));
        if (viewMyRequestsBtn) viewMyRequestsBtn.addEventListener("click", () => this.openDrawer("my_requests"));

        const closeDrawerBtn = document.getElementById("closeDrawerBtn");
        if (closeDrawerBtn) {
            closeDrawerBtn.addEventListener("click", () => {
                document.getElementById("drawerModalOverlay").style.display = "none";
                document.body.style.overflow = "auto";
            });
        }

        // Drawer Tabs
        const tabWatch = document.getElementById("tabWatchlist");
        const tabBids = document.getElementById("tabMyBids");
        const tabReqs = document.getElementById("tabMyRequests");
        const tabQuotes = document.getElementById("tabMyQuotes");

        if (tabWatch) tabWatch.addEventListener("click", () => this.switchDrawerTab("watchlist"));
        if (tabBids) tabBids.addEventListener("click", () => this.switchDrawerTab("my_bids"));
        if (tabReqs) tabReqs.addEventListener("click", () => this.switchDrawerTab("my_requests"));
        if (tabQuotes) tabQuotes.addEventListener("click", () => this.switchDrawerTab("my_quotes"));

        // 10. Item Detail Modal
        const closeDetailBtn = document.getElementById("closeDetailModalBtn");
        if (closeDetailBtn) {
            closeDetailBtn.addEventListener("click", () => {
                document.getElementById("detailModalOverlay").style.display = "none";
                document.body.style.overflow = "auto";
            });
        }

        // Contact Seller Button in Detail Modal
        const btnContactSeller = document.getElementById("btnContactSeller");
        if (btnContactSeller) {
            btnContactSeller.addEventListener("click", () => {
                if (this.currentListingDetail) {
                    document.getElementById("detailModalOverlay").style.display = "none";
                    const seller = this.currentListingDetail.seller ? this.currentListingDetail.seller.name : "Verified Seller";
                    this.openChatModal(seller, this.currentListingDetail.title);
                }
            });
        }

        // 11. Chat / Contact Seller Modal
        const closeChatBtn = document.getElementById("closeChatModalBtn");
        if (closeChatBtn) {
            closeChatBtn.addEventListener("click", () => {
                document.getElementById("chatModalOverlay").style.display = "none";
                document.body.style.overflow = "auto";
            });
        }

        const chatForm = document.getElementById("chatForm");
        if (chatForm) {
            chatForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleSendChatMessage();
            });
        }

        document.querySelectorAll(".btn-chat-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                const inp = document.getElementById("chatInput");
                if (inp) inp.value = chip.dataset.template;
            });
        });

        // Footer Quick Links
        const fConv = document.getElementById("footerConverterLink");
        if (fConv) fConv.addEventListener("click", (e) => { e.preventDefault(); this.openConverterModal(); });

        const fWatch = document.getElementById("footerWatchlistLink");
        if (fWatch) fWatch.addEventListener("click", (e) => { e.preventDefault(); this.openDrawer("watchlist"); });

        const fBids = document.getElementById("footerBidsLink");
        if (fBids) fBids.addEventListener("click", (e) => { e.preventDefault(); this.openDrawer("my_bids"); });

        const fReqs = document.getElementById("footerRequestsLink");
        if (fReqs) fReqs.addEventListener("click", (e) => { e.preventDefault(); this.openDrawer("my_requests"); });

        document.querySelectorAll(".footer-filter-link").forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const type = link.dataset.filterType;
                const val = link.dataset.val;
                if (type === "format") {
                    if (val === "requests") {
                        this.marketMode = "requests";
                        this.filters.formatPill = "requests";
                    } else if (val === "local_only") {
                        this.filters.fulfillmentCheckboxes = ["pickup"];
                    } else {
                        this.filters.formatPill = val;
                    }
                } else if (type === "category") {
                    this.setCategory(val);
                }
                this.renderListings();
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });

        document.querySelectorAll(".footer-city-link").forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const city = link.dataset.city;
                if (city) {
                    this.filters.city = city;
                    const cSel = document.getElementById("citySelector");
                    if (cSel) cSel.value = city;
                    const suggestedCurr = CITY_TO_CURRENCY[city];
                    if (suggestedCurr) this.setCurrency(suggestedCurr);
                    this.renderListings();
                    this.renderCategoryCounts();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            });
        });

        const newsBtn = document.getElementById("newsletterBtn");
        const newsInp = document.getElementById("newsletterInput");
        if (newsBtn && newsInp) {
            newsBtn.addEventListener("click", () => {
                const val = newsInp.value.trim();
                if (val && val.includes("@")) {
                    this.showToast(`Subscribed ${val} to local auction alerts!`, "success");
                    newsInp.value = "";
                } else {
                    this.showToast("Please enter a valid email address.", "warning");
                }
            });
        }

        // 12. Modal Background Click-Off Closers
        window.addEventListener("click", (e) => {
            if (e.target.id === "dashboardsModalOverlay") {
                e.target.style.display = "none";
                document.body.style.overflow = "auto";
            }
            if (e.target.id === "converterModalOverlay") {
                e.target.style.display = "none";
                document.body.style.overflow = "auto";
            }
            if (e.target.id === "postModalOverlay") {
                e.target.style.display = "none";
                document.body.style.overflow = "auto";
            }
            if (e.target.id === "detailModalOverlay") {
                e.target.style.display = "none";
                document.body.style.overflow = "auto";
            }
            if (e.target.id === "drawerModalOverlay") {
                e.target.style.display = "none";
                document.body.style.overflow = "auto";
            }
            if (e.target.id === "chatModalOverlay") {
                e.target.style.display = "none";
                document.body.style.overflow = "auto";
            }
        });
    }

    updatePostFormatFields(format) {
        const priceLabel = document.getElementById("priceInputLabel");
        const startPriceGroup = document.getElementById("startPriceGroup");
        const durationGroup = document.getElementById("auctionDurationGroup");
        const reserveGroup = document.getElementById("reservePriceGroup");
        const startPriceInput = document.getElementById("postStartPrice");

        if (format === "auction") {
            if (priceLabel) priceLabel.innerHTML = 'Starting Bid <span class="required">*</span>';
            if (startPriceGroup) startPriceGroup.style.display = "block";
            if (startPriceInput) startPriceInput.required = true;
            if (durationGroup) durationGroup.style.display = "block";
            if (reserveGroup) reserveGroup.style.display = "block";
        } else if (format === "buy_now") {
            if (priceLabel) priceLabel.innerHTML = 'Price / Buy It Now <span class="required">*</span>';
            if (startPriceGroup) startPriceGroup.style.display = "block";
            if (startPriceInput) startPriceInput.required = true;
            if (durationGroup) durationGroup.style.display = "none";
            if (reserveGroup) reserveGroup.style.display = "none";
        } else if (format === "service") {
            if (priceLabel) priceLabel.innerHTML = 'Daily / Base Rate <span class="required">*</span>';
            if (startPriceGroup) startPriceGroup.style.display = "block";
            if (startPriceInput) startPriceInput.required = true;
            if (durationGroup) durationGroup.style.display = "none";
            if (reserveGroup) reserveGroup.style.display = "none";
        } else if (format === "free_barter") {
            if (startPriceGroup) startPriceGroup.style.display = "none";
            if (startPriceInput) {
                startPriceInput.required = false;
                startPriceInput.value = "0";
            }
            if (durationGroup) durationGroup.style.display = "none";
            if (reserveGroup) reserveGroup.style.display = "none";
        }
    }

    updateRequestTypeFields(reqType) {
        const rateGroup = document.getElementById("reqRateTypeGroup");
        const condGroup = document.getElementById("reqConditionGroup");
        if (reqType === "service") {
            if (rateGroup) rateGroup.style.display = "block";
            if (condGroup) condGroup.style.display = "none";
        } else {
            if (rateGroup) rateGroup.style.display = "none";
            if (condGroup) condGroup.style.display = "block";
        }
    }

    // ========================================================================
    // CONVERTER MODAL LOGIC & CALCULATION MATRIX
    // ========================================================================

    openConverterModal() {
        const overlay = document.getElementById("converterModalOverlay");
        if (!overlay) return;

        overlay.style.display = "flex";
        document.body.style.overflow = "hidden";

        // Set default From to active currency, To to USD
        const calcFrom = document.getElementById("calcFromCurrency");
        const calcTo = document.getElementById("calcToCurrency");
        if (calcFrom) calcFrom.value = this.activeCurrency;
        if (calcTo) calcTo.value = (this.activeCurrency === "USD") ? "NGN" : "USD";

        this.updateConverterResults();
    }

    updateConverterResults() {
        const amountInp = document.getElementById("calcAmountInput");
        const fromSel = document.getElementById("calcFromCurrency");
        const toSel = document.getElementById("calcToCurrency");
        const fromSym = document.getElementById("calcFromSym");
        const rateBreakdown = document.getElementById("convRateBreakdown");
        const mainResultDisplay = document.getElementById("convMainResultDisplay");
        const matrixGrid = document.getElementById("converterMatrixGrid");

        if (!amountInp || !fromSel || !toSel) return;

        const amount = parseFloat(amountInp.value) || 0;
        const fromCurr = fromSel.value;
        const toCurr = toSel.value;

        const fromCfg = CURRENCY_CONFIG[fromCurr] || CURRENCY_CONFIG.NGN;
        const toCfg = CURRENCY_CONFIG[toCurr] || CURRENCY_CONFIG.USD;

        if (fromSym) fromSym.textContent = fromCfg.symbol.trim();

        // Conversion calculation
        const { converted, inUsd } = this.convertBetween(amount, fromCurr, toCurr);

        // Rate breakdown string
        const oneFromInTo = (1 / fromCfg.rate) * toCfg.rate;
        const oneToInFrom = (1 / toCfg.rate) * fromCfg.rate;
        if (rateBreakdown) {
            rateBreakdown.textContent = `1 ${fromCurr} = ${oneFromInTo.toFixed(4)} ${toCurr} • 1 ${toCurr} = ${oneToInFrom.toFixed(2)} ${fromCurr}`;
        }

        // Main display
        if (mainResultDisplay) {
            let formattedRes = "";
            if (toCfg.decimals === 0) {
                formattedRes = Math.round(converted).toLocaleString();
            } else {
                formattedRes = converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
            mainResultDisplay.textContent = `${toCfg.symbol}${formattedRes} ${toCurr}`;
        }

        // Multi-currency Matrix Grid (All 10 currencies calculated for this amount)
        if (matrixGrid) {
            matrixGrid.innerHTML = Object.entries(CURRENCY_CONFIG).map(([code, cfg]) => {
                const matrixVal = inUsd * cfg.rate;
                let fmtVal = "";
                if (cfg.decimals === 0) {
                    fmtVal = Math.round(matrixVal).toLocaleString();
                } else {
                    fmtVal = matrixVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }

                const isActiveFrom = code === fromCurr;
                const isActiveTo = code === toCurr;

                return `
                    <div class="currency-matrix-card ${isActiveFrom ? 'is-active-from' : ''} ${isActiveTo ? 'is-active-to' : ''}">
                        <div class="mat-flag-name">
                            <span class="mat-flag">${cfg.flag}</span>
                            <div>
                                <div class="mat-code">${code}</div>
                                <div class="mat-name">${cfg.country}</div>
                            </div>
                        </div>
                        <div class="mat-amount">${cfg.symbol}${fmtVal}</div>
                    </div>
                `;
            }).join("");
        }
    }

    // ========================================================================
    // DASHBOARDS & SUPABASE CLOUD HUB
    // ========================================================================

    openDashboardsModal() {
        const overlay = document.getElementById("dashboardsModalOverlay");
        if (!overlay) return;

        overlay.style.display = "flex";
        document.body.style.overflow = "hidden";

        this.updateDashboardMetrics();
        this.switchDashboardTab(this.activeDashboardTab);
    }

    switchDashboardTab(tabId) {
        this.activeDashboardTab = tabId;

        // Sync tab buttons
        document.querySelectorAll(".dash-nav-btn").forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Sync panels
        document.querySelectorAll(".dash-panel").forEach(p => p.classList.remove("active"));
        const targetPanel = {
            overview: "dashPanelOverview",
            seller: "dashPanelSeller",
            buyer: "dashPanelBuyer",
            provider: "dashPanelProvider",
            escrow: "dashPanelEscrow"
        }[tabId];

        const panelEl = document.getElementById(targetPanel);
        if (panelEl) panelEl.classList.add("active");

        // Refresh panel data
        if (tabId === "overview") {
            this.updateDashboardMetrics();
            this.renderActivityStream();
        } else if (tabId === "seller") {
            this.renderSellerListings("all");
        } else if (tabId === "buyer") {
            this.renderBuyerRequestsHub();
        } else if (tabId === "provider") {
            this.renderProviderProposalsHub();
        } else if (tabId === "escrow") {
            this.renderEscrowOrders();
        }
    }

    updateDashboardMetrics() {
        // Total Volume (GMV) in USD
        let totalGmvUsd = 0;
        let auctionCount = 0;
        let requestCount = 0;

        this.listings.forEach(l => {
            const isReq = Boolean(l.isRequest || (l.format && l.format.startsWith("request_")));
            if (isReq) {
                requestCount++;
            } else {
                totalGmvUsd += (l.currentPrice || l.startingPrice || 0);
                if (l.format === "auction") auctionCount++;
            }
        });

        // Escrow Balance
        let escrowTotalUsd = this.escrowOrders
            .filter(o => o.status !== "released")
            .reduce((acc, cur) => acc + (cur.amountUsd || 0), 0);

        const gmvEl = document.getElementById("dashMetricGMV");
        const gmvSub = document.getElementById("dashMetricGMVSub");
        const aucEl = document.getElementById("dashMetricAuctions");
        const reqEl = document.getElementById("dashMetricRequests");
        const escEl = document.getElementById("dashMetricEscrow");

        if (gmvEl) gmvEl.innerHTML = this.formatMoney(totalGmvUsd, false);
        if (gmvSub) gmvSub.textContent = `≈ $${Math.round(totalGmvUsd).toLocaleString()} USD total listed`;
        if (aucEl) aucEl.textContent = auctionCount;
        if (reqEl) reqEl.textContent = requestCount;
        if (escEl) escEl.innerHTML = this.formatMoney(escrowTotalUsd, false);

        // Counts on Nav tabs
        const sellerCount = this.listings.filter(l => !l.isRequest && (!l.format || !l.format.startsWith("request_"))).length;
        const myReqCount = this.listings.filter(l => this.myRequests.has(l.id) || (l.seller && l.seller.name.includes("You") && l.isRequest)).length;
        const myQuoteCount = Object.keys(this.myQuotes).length;
        const escrowActiveCount = this.escrowOrders.length;

        const dSc = document.getElementById("dashSellerCount");
        const dBc = document.getElementById("dashBuyerCount");
        const dPc = document.getElementById("dashProviderCount");
        const dEc = document.getElementById("dashEscrowCount");

        if (dSc) dSc.textContent = sellerCount;
        if (dBc) dBc.textContent = myReqCount;
        if (dPc) dPc.textContent = myQuoteCount;
        if (dEc) dEc.textContent = escrowActiveCount;
    }

    renderActivityStream() {
        const stream = document.getElementById("dashActivityStream");
        if (!stream) return;

        const activities = [
            { icon: "🔨", text: "New bid of $1,850 on Apple MacBook Pro 14\" in Ikeja, Lagos", time: "4 mins ago" },
            { icon: "🤝", text: "Proposal accepted: 5kVA Solar Hybrid Inverter escrow funded", time: "25 mins ago" },
            { icon: "🙋", text: "New Buyer ISO: Toyota RAV4 Direct Import posted in Westlands, Nairobi", time: "48 mins ago" },
            { icon: "🛡️", text: "Safe Meetup Handover OTP generated for East Legon shortlet", time: "1 hour ago" },
            { icon: "⚡", text: "Live auction ended: Royal Ashanti Kente Cloth reserve met", time: "3 hours ago" }
        ];

        stream.innerHTML = activities.map(a => `
            <div class="activity-stream-item">
                <div class="act-left">
                    <span class="act-badge">${a.icon}</span>
                    <span class="act-text">${this.escapeHtml(a.text)}</span>
                </div>
                <span class="act-time">${a.time}</span>
            </div>
        `).join("");
    }

    updateCloudStatusPill(online) {
        const pill = document.getElementById("cloudStatusBadge");
        const txt = document.getElementById("cloudStatusText");
        const headPill = document.getElementById("supaStatusPill");

        if (online) {
            if (pill) pill.style.background = "rgba(16, 185, 129, 0.2)";
            if (txt) txt.textContent = "Supabase Cloud: Active (Connected)";
            if (headPill) {
                headPill.textContent = "🟢 Supabase Cloud Connected";
                headPill.style.background = "#ecfdf5";
                headPill.style.color = "#059669";
            }
        } else {
            if (txt) txt.textContent = "Supabase Cloud: Ready (Local Sync)";
            if (headPill) headPill.textContent = "🟢 Cloud Ready / Local Sync";
        }
    }

    initSupabaseSync() {
        if (window.servlistSupabase) {
            window.servlistSupabase.testConnection().then(res => {
                if (res && res.success) {
                    this.updateCloudStatusPill(true);
                } else {
                    this.updateCloudStatusPill(false);
                }
            });
        }
    }

    // --- TAB 2: SELLER HUB ---
    renderSellerListings(filterMode = "all") {
        const container = document.getElementById("sellerListingsContainer");
        if (!container) return;

        let items = this.listings.filter(l => !l.isRequest && (!l.format || !l.format.startsWith("request_")));

        if (filterMode === "auction") {
            items = items.filter(l => l.format === "auction" && !l.isSold);
        } else if (filterMode === "buy_now") {
            items = items.filter(l => l.format !== "auction" && !l.isSold);
        } else if (filterMode === "sold") {
            items = items.filter(l => Boolean(l.isSold));
        }

        // Update counts
        const allCount = this.listings.filter(l => !l.isRequest && (!l.format || !l.format.startsWith("request_"))).length;
        const aucCount = this.listings.filter(l => l.format === "auction" && !l.isSold).length;
        const buyCount = this.listings.filter(l => l.format !== "auction" && !l.isSold).length;
        const soldCount = this.listings.filter(l => Boolean(l.isSold)).length;

        const cAll = document.getElementById("sellerFilterCountAll");
        const cAuc = document.getElementById("sellerFilterCountAuction");
        const cBuy = document.getElementById("sellerFilterCountBuyNow");
        const cSol = document.getElementById("sellerFilterCountSold");

        if (cAll) cAll.textContent = allCount;
        if (cAuc) cAuc.textContent = aucCount;
        if (cBuy) cBuy.textContent = buyCount;
        if (cSol) cSol.textContent = soldCount;

        if (items.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b; background: white; border-radius: 8px;">
                    <span style="font-size: 2rem;">📦</span>
                    <h4 style="margin: 8px 0; color: #0f172a;">No listings found in this filter</h4>
                    <p style="font-size: 0.8125rem;">Post an auction or classified item to sell to buyers across Africa.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => {
            const isAuction = item.format === "auction";
            const priceHtml = this.formatMoney(item.currentPrice, true);

            return `
                <div class="seller-item-card" data-id="${item.id}">
                    <div class="seller-card-main">
                        <div class="seller-card-info-group">
                            <img src="${item.imageUrl}" alt="${this.escapeHtml(item.title)}" class="seller-thumb">
                            <div class="seller-info">
                                <h4>${this.escapeHtml(item.title)}</h4>
                                <div class="seller-meta-row">
                                    <span>${isAuction ? '🔨 Live Auction' : '⚡ Buy Now'}</span>
                                    <span>&bull;</span>
                                    <span>📍 ${this.escapeHtml(item.city)}</span>
                                    ${isAuction ? `<span>&bull;</span><span>⏱️ ${this.formatTimeLeft(item.endTime)}</span>` : ''}
                                    ${item.isSold ? '<span style="color: #10b981; font-weight: 800;">(SOLD)</span>' : ''}
                                </div>
                            </div>
                        </div>
                        <div class="seller-price-group">
                            <div class="seller-current-price">${priceHtml}</div>
                            <div class="seller-price-sub">${isAuction ? (item.bidsCount || 0) + ' active bids' : 'Fixed price'}</div>
                        </div>
                    </div>

                    ${isAuction && item.bidHistory && item.bidHistory.length > 0 ? `
                    <div style="background: #f8fafc; border-radius: 6px; padding: 10px 14px; font-size: 0.75rem;">
                        <strong style="color: #334155;">Latest Bidders:</strong>
                        ${item.bidHistory.slice(0, 2).map(b => `
                            <span style="margin-left: 8px; color: #64748b;">${b.bidder}: <strong>${this.formatMoney(b.amount, false)}</strong> (${b.time})</span>
                        `).join("")}
                    </div>
                    ` : ''}

                    <div class="seller-actions-row">
                        ${isAuction && !item.isSold ? `
                            <button type="button" class="btn-seller-act primary btn-accept-leading-bid" data-id="${item.id}">🏆 Accept Leading Bid</button>
                            <button type="button" class="btn-seller-act btn-end-auction" data-id="${item.id}">⏱️ End Auction</button>
                        ` : ''}
                        ${!item.isSold ? `
                            <button type="button" class="btn-seller-act btn-mark-sold" data-id="${item.id}">✅ Mark as Sold</button>
                        ` : ''}
                        <button type="button" class="btn-seller-act danger btn-delete-listing" data-id="${item.id}">🗑️ Delete</button>
                    </div>
                </div>
            `;
        }).join("");

        // Bind Seller Actions
        container.querySelectorAll(".btn-accept-leading-bid").forEach(b => {
            b.addEventListener("click", () => {
                const id = b.dataset.id;
                const item = this.listings.find(l => l.id === id);
                if (item) {
                    item.isSold = true;
                    this.saveListings();
                    this.showToast(`Listing awarded to leading bidder for ${this.formatMoney(item.currentPrice, false)}!`, "success");
                    this.renderSellerListings(filterMode);
                }
            });
        });

        container.querySelectorAll(".btn-end-auction").forEach(b => {
            b.addEventListener("click", () => {
                const id = b.dataset.id;
                const item = this.listings.find(l => l.id === id);
                if (item) {
                    item.endTime = Date.now();
                    this.saveListings();
                    this.showToast("Auction ended early.", "info");
                    this.renderSellerListings(filterMode);
                }
            });
        });

        container.querySelectorAll(".btn-mark-sold").forEach(b => {
            b.addEventListener("click", () => {
                const id = b.dataset.id;
                const item = this.listings.find(l => l.id === id);
                if (item) {
                    item.isSold = true;
                    this.saveListings();
                    this.showToast("Marked item as Sold.", "success");
                    this.renderSellerListings(filterMode);
                }
            });
        });

        container.querySelectorAll(".btn-delete-listing").forEach(b => {
            b.addEventListener("click", () => {
                const id = b.dataset.id;
                if (confirm("Delete this listing permanently?")) {
                    this.listings = this.listings.filter(l => l.id !== id);
                    this.saveListings();
                    this.renderListings();
                    this.showToast("Listing deleted.", "info");
                    this.renderSellerListings(filterMode);
                    this.updateDashboardMetrics();
                }
            });
        });
    }

    // --- TAB 3: BUYER REQUESTS HUB ---
    renderBuyerRequestsHub() {
        const container = document.getElementById("buyerRequestsContainer");
        if (!container) return;

        const myReqItems = this.listings.filter(l => this.myRequests.has(l.id) || (l.seller && l.seller.name.includes("You") && l.isRequest));

        if (myReqItems.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b; background: white; border-radius: 8px;">
                    <span style="font-size: 2rem;">🙋</span>
                    <h4 style="margin: 8px 0; color: #0f172a;">You have no active buyer requests</h4>
                    <p style="font-size: 0.8125rem;">Post a request for hard-to-find goods, solar parts, or services.</p>
                    <button type="button" class="btn-dash-primary" id="btnReqHubPost" style="margin-top: 12px;">+ Post a Request Now</button>
                </div>
            `;
            const pBtn = document.getElementById("btnReqHubPost");
            if (pBtn) pBtn.addEventListener("click", () => {
                document.getElementById("dashboardsModalOverlay").style.display = "none";
                this.openPostRequestModal();
            });
            return;
        }

        container.innerHTML = myReqItems.map(item => {
            const offers = item.offers || [];
            const budgetHtml = this.formatMoney(item.budget || item.currentPrice, true);

            return `
                <div class="buyer-req-card" data-id="${item.id}">
                    <div class="buyer-req-head">
                        <div>
                            <h4>${this.escapeHtml(item.title)}</h4>
                            <div style="font-size: 0.75rem; color: #64748b; display: flex; gap: 8px;">
                                <span>📍 ${this.escapeHtml(item.city)}</span>
                                <span>&bull;</span>
                                <span>⏱️ ${this.escapeHtml(item.urgency || 'Needed Soon')}</span>
                                <span>&bull;</span>
                                <span>${item.requestType === 'service' ? '🛠️ Service Task' : '📦 Item Wanted'}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">${budgetHtml}</div>
                            <div style="font-size: 0.6875rem; color: #64748b;">Target Budget</div>
                        </div>
                    </div>

                    <!-- Received Vendor Proposals Accordion -->
                    <div class="buyer-quotes-accordion">
                        <div class="accordion-title">
                            <span>Vendor Proposals & Quotes Received (${offers.length})</span>
                            <span style="color: #10b981;">🛡️ Escrow Protected</span>
                        </div>

                        ${offers.length === 0 ? `
                            <div style="font-size: 0.8125rem; color: #64748b; padding: 8px;">
                                No proposals submitted yet. African vendors & service contractors are reviewing your request.
                            </div>
                        ` : offers.map(off => `
                            <div class="vendor-quote-card">
                                <div class="quote-vendor-info">
                                    <div class="vendor-avatar">${off.providerAvatar || 'VP'}</div>
                                    <div>
                                        <div class="quote-vendor-name">${this.escapeHtml(off.providerName)}</div>
                                        <div class="quote-vendor-stars">${off.providerRating} ★ Verified Provider</div>
                                    </div>
                                </div>
                                <div class="quote-details">
                                    <div><strong>Timeline:</strong> ${this.escapeHtml(off.timeline)}</div>
                                    <div style="color: #475569; margin-top: 2px;">"${this.escapeHtml(off.message)}"</div>
                                </div>
                                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                                    <div class="quote-price-tag">${this.formatMoney(off.price, true)}</div>
                                    <div class="quote-actions-group">
                                        <button type="button" class="btn-accept-quote" data-req-id="${item.id}" data-off-id="${off.id}">
                                            🤝 Accept & Escrow
                                        </button>
                                        <button type="button" class="btn-seller-act btn-chat-quote" data-name="${this.escapeHtml(off.providerName)}" data-title="${this.escapeHtml(item.title)}">
                                            💬 Chat
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join("")}
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="btn-seller-act btn-delete-request" data-id="${item.id}">Delete Request</button>
                    </div>
                </div>
            `;
        }).join("");

        // Bind Accept Quote -> Create Escrow Order
        container.querySelectorAll(".btn-accept-quote").forEach(b => {
            b.addEventListener("click", () => {
                const reqId = b.dataset.reqId;
                const offId = b.dataset.offId;
                const req = this.listings.find(l => l.id === reqId);
                const offer = req?.offers?.find(o => o.id === offId);

                if (req && offer) {
                    this.createEscrowOrder({
                        itemId: req.id,
                        title: req.title,
                        buyerName: "John Doe (You)",
                        sellerName: offer.providerName,
                        amountUsd: offer.price,
                        targetCurrency: this.activeCurrency,
                        safeZone: "Safe African Commercial Zone",
                        status: "funded"
                    });
                    offer.status = "Accepted";
                    this.saveListings();

                    this.showToast(`🎉 Quote accepted! ${this.formatMoney(offer.price, false)} secured into African Escrow vault!`, "success");
                    this.switchDashboardTab("escrow");
                }
            });
        });

        // Chat with vendor
        container.querySelectorAll(".btn-chat-quote").forEach(b => {
            b.addEventListener("click", () => {
                document.getElementById("dashboardsModalOverlay").style.display = "none";
                this.openChatModal(b.dataset.name, b.dataset.title);
            });
        });

        // Delete Request
        container.querySelectorAll(".btn-delete-request").forEach(b => {
            b.addEventListener("click", () => {
                const id = b.dataset.id;
                this.deleteRequest(id);
                this.renderBuyerRequestsHub();
                this.updateDashboardMetrics();
            });
        });
    }

    // --- TAB 4: SERVICE PROVIDER & PROPOSALS HUB ---
    renderProviderProposalsHub() {
        const container = document.getElementById("providerProposalsContainer");
        if (!container) return;

        const entries = Object.entries(this.myQuotes);
        if (entries.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b; background: white; border-radius: 8px;">
                    <span style="font-size: 2rem;">💼</span>
                    <h4 style="margin: 8px 0; color: #0f172a;">No quotes submitted yet</h4>
                    <p style="font-size: 0.8125rem;">Browse buyer requests and submit your proposals with price and schedule.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = entries.map(([reqId, q]) => {
            const req = this.listings.find(l => l.id === reqId);
            const title = req ? req.title : q.itemTitle || "Service / Good Request";

            return `
                <div class="provider-prop-card">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 4px; font-size: 0.9375rem; color: #0f172a;">${this.escapeHtml(title)}</h4>
                        <div style="font-size: 0.75rem; color: #64748b;">
                            <span>Proposed Timeline: <strong>${this.escapeHtml(q.timeline || 'Flexible')}</strong></span>
                            <span style="margin: 0 6px;">&bull;</span>
                            <span>"${this.escapeHtml(q.message || '')}"</span>
                        </div>
                    </div>
                    <div style="text-align: right; min-width: 140px;">
                        <div style="font-size: 1.05rem; font-weight: 800; color: #0f172a;">${this.formatMoney(q.price, true)}</div>
                        <span class="prop-status-tag ${q.status === 'Accepted' ? 'accepted' : 'pending'}">${this.escapeHtml(q.status || 'Pending')}</span>
                    </div>
                </div>
            `;
        }).join("");
    }

    // --- TAB 5: ESCROW & SAFE MEETUP TRACKER ---
    renderEscrowOrders() {
        const container = document.getElementById("escrowOrdersContainer");
        if (!container) return;

        if (this.escrowOrders.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b; background: white; border-radius: 8px;">
                    <span style="font-size: 2rem;">🛡️</span>
                    <h4 style="margin: 8px 0; color: #0f172a;">No active escrow orders</h4>
                    <p style="font-size: 0.8125rem;">When you win an auction or accept a request quote, transactions are tracked here with Handover OTP protection.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.escrowOrders.map(order => {
            const isReleased = order.status === "released";
            const amountHtml = this.formatMoney(order.amountUsd, true);

            return `
                <div class="escrow-order-card" data-id="${order.id}">
                    <div class="escrow-order-head">
                        <div>
                            <h4>🛡️ ${this.escapeHtml(order.title)}</h4>
                            <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">
                                Order #${order.id} &bull; Counterparty: <strong>${this.escapeHtml(order.sellerName)}</strong>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.15rem; font-weight: 800; color: #0f172a;">${amountHtml}</div>
                            <span class="prop-status-tag ${isReleased ? 'accepted' : 'pending'}">
                                ${isReleased ? '✅ Payout Released' : '🔒 Funds Locked in Escrow'}
                            </span>
                        </div>
                    </div>

                    <!-- Milestone Track -->
                    <div class="escrow-milestone-track">
                        <div class="milestone-node completed">
                            <span>✅ 1. Payment Deposited</span>
                        </div>
                        <div class="step-arrow">&rarr;</div>
                        <div class="milestone-node ${isReleased ? 'completed' : 'active'}">
                            <span>📦 2. Handover & Inspection</span>
                        </div>
                        <div class="step-arrow">&rarr;</div>
                        <div class="milestone-node ${isReleased ? 'completed' : ''}">
                            <span>🔑 3. OTP Verification</span>
                        </div>
                        <div class="step-arrow">&rarr;</div>
                        <div class="milestone-node ${isReleased ? 'completed' : ''}">
                            <span>💰 4. Seller Payout</span>
                        </div>
                    </div>

                    ${!isReleased ? `
                    <div class="otp-box">
                        <div>
                            <div style="font-size: 0.75rem; font-weight: 800; color: #065f46; text-transform: uppercase;">
                                Secret Handover OTP (Buyer Verification Code)
                            </div>
                            <div style="font-size: 0.6875rem; color: #047857;">
                                Provide this code to the seller ONLY after physical meetup inspection or service handover.
                            </div>
                        </div>
                        <div class="otp-display-badge">${order.otpCode}</div>
                    </div>

                    <div style="display: flex; gap: 10px; align-items: center; justify-content: flex-end;">
                        <input type="text" placeholder="Enter OTP code to release payout..." class="otp-input-field" data-order-id="${order.id}" style="padding: 7px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: monospace; font-size: 0.8125rem; width: 220px;">
                        <button type="button" class="btn-dash-primary btn-release-escrow" data-order-id="${order.id}">
                            ✅ Verify & Release Payout
                        </button>
                    </div>
                    ` : `
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 14px; font-size: 0.8125rem; color: #15803d;">
                        🎉 Payout of ${amountHtml} was successfully released to <strong>${this.escapeHtml(order.sellerName)}</strong> via Paystack / Flutterwave / M-Pesa.
                    </div>
                    `}
                </div>
            `;
        }).join("");

        // Bind OTP verification release
        container.querySelectorAll(".btn-release-escrow").forEach(b => {
            b.addEventListener("click", () => {
                const orderId = b.dataset.orderId;
                const order = this.escrowOrders.find(o => o.id === orderId);
                const input = container.querySelector(`.otp-input-field[data-order-id="${orderId}"]`);

                if (order) {
                    const enteredClean = (input?.value || "").replace(/[-\s]/g, "").trim();
                    const actualClean = (order.otpCode || "").replace(/[-\s]/g, "").trim();

                    if (enteredClean && enteredClean === actualClean) {
                        order.status = "released";
                        this.saveEscrowOrders();
                        this.showToast(`🎉 Escrow payout of ${this.formatMoney(order.amountUsd, false)} released to ${order.sellerName}!`, "success");
                        this.renderEscrowOrders();
                        this.updateDashboardMetrics();
                    } else {
                        this.showToast("⚠️ Incorrect OTP code. Please enter the valid Handover OTP code.", "warning");
                    }
                }
            });
        });
    }

    updateEscrowBadge() {
        const count = this.escrowOrders.filter(o => o.status !== "released").length;
        const dBadge = document.getElementById("dashEscrowCount");
        if (dBadge) dBadge.textContent = count;
    }

    safeImageUrl(url) {
        if (!url || typeof url !== "string") {
            return "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80";
        }
        const trimmed = url.trim();
        if (/^https?:\/\//i.test(trimmed)) {
            return this.escapeHtml(trimmed);
        }
        return "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80";
    }

    createEscrowOrder({ itemId, title, buyerName, sellerName, amountUsd, targetCurrency, safeZone, status = "funded" }) {
        const uniqueId = "ESC-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);
        const p1 = Math.floor(100 + Math.random() * 900);
        const p2 = Math.floor(100 + Math.random() * 900);
        const otpCode = `${p1}-${p2}`;

        const newEscrow = {
            id: uniqueId,
            itemId: itemId || "",
            title: title || "Marketplace Trade",
            buyerName: buyerName || "John Doe (You)",
            sellerName: sellerName || "African Merchant",
            amountUsd: Number(amountUsd) || 0,
            targetCurrency: targetCurrency || this.activeCurrency,
            status: status || "funded",
            otpCode: otpCode,
            safeZone: safeZone || "Safe African Commercial Zone",
            createdAt: Date.now()
        };

        this.escrowOrders.unshift(newEscrow);
        this.saveEscrowOrders();
        return newEscrow;
    }

    renderAppliedChips() {
        const row = document.getElementById("appliedChipsRow");
        const list = document.getElementById("chipsList");
        if (!row || !list) return;

        const chips = [];
        if (this.filters.city && this.filters.city !== "All Africa") {
            chips.push({ label: `City: ${this.filters.city}`, key: "city" });
        }
        if (this.filters.category && this.filters.category !== "all") {
            chips.push({ label: `Category: ${this.capitalize(this.filters.category)}`, key: "category" });
        }
        if (this.filters.formatPill && this.filters.formatPill !== "all") {
            chips.push({ label: `Format: ${this.filters.formatPill.replace('_', ' ')}`, key: "formatPill" });
        }
        if (this.filters.searchQuery) {
            chips.push({ label: `Search: "${this.filters.searchQuery}"`, key: "searchQuery" });
        }
        if (this.filters.minPrice !== null || this.filters.maxPrice !== null) {
            chips.push({ label: `Price filtered`, key: "price" });
        }

        if (chips.length === 0) {
            row.style.display = "none";
            list.innerHTML = "";
        } else {
            row.style.display = "flex";
            list.innerHTML = chips.map(c => `
                <div class="filter-chip" style="display: inline-flex; align-items: center; gap: 6px; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                    <span>${this.escapeHtml(c.label)}</span>
                    <button type="button" class="chip-remove-btn" data-key="${c.key}" style="border: none; background: transparent; cursor: pointer; color: #0284c7; font-weight: bold; font-size: 0.875rem; padding: 0;">&times;</button>
                </div>
            `).join("");

            list.querySelectorAll(".chip-remove-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    const key = btn.dataset.key;
                    if (key === "city") {
                        this.filters.city = "All Africa";
                        const sel = document.getElementById("citySelector");
                        if (sel) sel.value = "All Africa";
                    } else if (key === "category") {
                        this.setCategory("all");
                    } else if (key === "formatPill") {
                        this.filters.formatPill = "all";
                        document.querySelectorAll("#formatPills .pill-btn").forEach(b => {
                            b.classList.toggle("active", b.dataset.format === "all");
                        });
                    } else if (key === "searchQuery") {
                        this.filters.searchQuery = "";
                        const inp = document.getElementById("searchInput");
                        if (inp) inp.value = "";
                        const clr = document.getElementById("clearSearchBtn");
                        if (clr) clr.style.display = "none";
                    } else if (key === "price") {
                        this.filters.minPrice = null;
                        this.filters.maxPrice = null;
                        const minInp = document.getElementById("minPriceInput");
                        const maxInp = document.getElementById("maxPriceInput");
                        if (minInp) minInp.value = "";
                        if (maxInp) maxInp.value = "";
                    }
                    this.renderListings();
                });
            });
        }
    }

    renderListings() {
        const container = document.getElementById("listingsContainer");
        if (!container) return;

        let filtered = this.listings.filter(item => {
            const isReq = Boolean(item.isRequest || (item.format && item.format.startsWith("request_")));

            // Market mode filter ('all', 'supply', 'requests')
            if (this.marketMode === "supply" && isReq) return false;
            if (this.marketMode === "requests" && !isReq) return false;

            // City filter
            if (this.filters.city && this.filters.city !== "All Africa") {
                if (item.city !== this.filters.city && item.city !== "All Africa") {
                    // Check if city matches country (e.g. Lagos vs Nigeria)
                    const selCountry = this.filters.city.split(",")[1]?.trim();
                    const itemCountry = item.city.split(",")[1]?.trim();
                    if (selCountry && itemCountry && selCountry !== itemCountry) {
                        return false;
                    }
                }
            }

            // Category filter
            if (this.filters.category && this.filters.category !== "all") {
                if (item.category !== this.filters.category) return false;
            }

            // Format pill filter
            if (this.filters.formatPill && this.filters.formatPill !== "all") {
                if (this.filters.formatPill === "auction" && item.format !== "auction") return false;
                if (this.filters.formatPill === "buy_now" && item.format !== "buy_now") return false;
                if (this.filters.formatPill === "service" && item.format !== "service" && item.format !== "request_service") return false;
                if (this.filters.formatPill === "free_barter" && item.format !== "free_barter") return false;
                if (this.filters.formatPill === "requests" && !isReq) return false;
            }

            // Format checkboxes
            if (this.filters.formatCheckboxes && this.filters.formatCheckboxes.length > 0) {
                if (!this.filters.formatCheckboxes.includes(item.format)) return false;
            }

            // Fulfillment
            if (this.filters.fulfillmentCheckboxes && this.filters.fulfillmentCheckboxes.length > 0) {
                if (item.fulfillment !== "both" && !this.filters.fulfillmentCheckboxes.includes(item.fulfillment)) {
                    return false;
                }
            }

            // Price range (in USD baseline)
            const price = item.budget !== undefined ? item.budget : (item.currentPrice || 0);
            if (this.filters.minPrice !== null && price < this.filters.minPrice) return false;
            if (this.filters.maxPrice !== null && price > this.filters.maxPrice) return false;

            // Search query
            if (this.filters.searchQuery) {
                const q = this.filters.searchQuery.toLowerCase();
                const title = (item.title || "").toLowerCase();
                const desc = (item.description || "").toLowerCase();
                const neigh = (item.neighborhood || "").toLowerCase();
                const city = (item.city || "").toLowerCase();
                if (!title.includes(q) && !desc.includes(q) && !neigh.includes(q) && !city.includes(q)) {
                    return false;
                }
            }

            return true;
        });

        this.renderAppliedChips();

        // Sorting
        filtered.sort((a, b) => {
            if (this.sortMode === "ending_soon") {
                const aEnd = a.endTime || (Date.now() + 1000 * 60 * 60 * 999);
                const bEnd = b.endTime || (Date.now() + 1000 * 60 * 60 * 999);
                return aEnd - bEnd;
            } else if (this.sortMode === "price_asc" || this.sortMode === "price_low") {
                const aP = a.budget !== undefined ? a.budget : (a.currentPrice || 0);
                const bP = b.budget !== undefined ? b.budget : (b.currentPrice || 0);
                return aP - bP;
            } else if (this.sortMode === "price_desc" || this.sortMode === "price_high") {
                const aP = a.budget !== undefined ? a.budget : (a.currentPrice || 0);
                const bP = b.budget !== undefined ? b.budget : (b.currentPrice || 0);
                return bP - aP;
            } else if (this.sortMode === "most_bids") {
                return (b.bidsCount || 0) - (a.bidsCount || 0);
            } else if (this.sortMode === "distance") {
                const aMatch = a.city === this.filters.city ? 1 : 0;
                const bMatch = b.city === this.filters.city ? 1 : 0;
                return bMatch - aMatch;
            } else if (this.sortMode === "newest") {
                return (b.createdAt || 0) - (a.createdAt || 0);
            }
            return 0;
        });

        // Results count label
        const countLabel = document.getElementById("resultsCountText") || document.getElementById("resultsCountLabel");
        if (countLabel) {
            countLabel.textContent = `Showing ${filtered.length} African listings & requests`;
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state-card" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: white; border-radius: 8px;">
                    <span style="font-size: 3rem;">🌍</span>
                    <h3 style="margin: 12px 0 6px; color: #0f172a;">No listings found matching your criteria</h3>
                    <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 20px;">Try switching to another African city, clearing filters, or posting a request.</p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button type="button" class="btn-dash-primary" id="emptyPostReqBtn">+ Post a Request for this item</button>
                        <button type="button" class="btn-dash-secondary" id="emptyResetBtn">Reset All Filters</button>
                    </div>
                </div>
            `;
            const epReq = document.getElementById("emptyPostReqBtn");
            const epRes = document.getElementById("emptyResetBtn");
            if (epReq) epReq.addEventListener("click", () => this.openPostRequestModal());
            if (epRes) epRes.addEventListener("click", () => this.resetFilters());
            return;
        }

        container.innerHTML = filtered.map(item => this.buildCardHtml(item)).join("");

        // Bind Card Click Events
        container.querySelectorAll(".listing-card").forEach(card => {
            card.addEventListener("click", (e) => {
                if (e.target.closest(".card-watchlist-btn")) return;
                const id = card.dataset.id;
                this.openDetailModal(id);
            });

            const watchBtn = card.querySelector(".card-watchlist-btn");
            if (watchBtn) {
                watchBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const id = card.dataset.id;
                    this.toggleWatchlist(id);
                });
            }
        });
    }

    buildCardHtml(item) {
        const isWatchlisted = this.watchlist.has(item.id);
        const isReq = Boolean(item.isRequest || (item.format && item.format.startsWith("request_")));

        const formatBadgeClass = {
            auction: "badge-auction",
            buy_now: "badge-buynow",
            service: "badge-service",
            free_barter: "badge-free",
            request_good: "badge-request-good",
            request_service: "badge-request-service"
        }[item.format] || (isReq ? "badge-request-good" : "badge-buynow");

        const formatBadgeLabel = {
            auction: "🔨 AUCTION",
            buy_now: "⚡ BUY IT NOW",
            service: "🛠️ SERVICE",
            free_barter: "🔄 FREE / BARTER",
            request_good: "📦 WANTED (ISO)",
            request_service: "🛠️ SERVICE NEEDED"
        }[item.format] || (isReq ? "🙋 REQUEST" : "FOR SALE");

        // Fulfillment
        let fulfillmentLabel = "Local Meetup";
        let fulfillmentClass = "local-pickup";
        if (item.fulfillment === "both") {
            fulfillmentLabel = isReq ? "🤝 Meetup or 📦 Courier" : "🤝 Meetup + 📦 Courier";
            fulfillmentClass = "local-pickup";
        } else if (item.fulfillment === "shipping") {
            fulfillmentLabel = isReq ? "📦 Courier Accepted" : "📦 Courier Delivery Only";
            fulfillmentClass = "";
        }

        // Price in Active Currency
        let priceHtml = "";
        if (isReq) {
            const budgetVal = item.budget !== undefined ? item.budget : (item.currentPrice || 0);
            priceHtml = `
                <div class="price-block">
                    <span class="price-label">Target Budget</span>
                    <span class="current-price req-price">${this.formatMoney(budgetVal, true)}</span>
                </div>
            `;
        } else if (item.format === "auction") {
            priceHtml = `
                <div class="price-block">
                    <span class="price-label">Current Bid (${item.bidsCount || 0} bids)</span>
                    <span class="current-price">${this.formatMoney(item.currentPrice, true)}</span>
                </div>
            `;
        } else if (item.format === "buy_now") {
            priceHtml = `
                <div class="price-block">
                    <span class="price-label">Buy It Now</span>
                    <span class="current-price">${this.formatMoney(item.currentPrice, true)}</span>
                </div>
            `;
        } else if (item.format === "service") {
            priceHtml = `
                <div class="price-block">
                    <span class="price-label">Service Rate</span>
                    <span class="current-price">${this.formatMoney(item.currentPrice, true)}/day</span>
                </div>
            `;
        } else if (item.format === "free_barter") {
            priceHtml = `
                <div class="price-block">
                    <span class="price-label">Classified</span>
                    <span class="current-price">FREE</span>
                </div>
            `;
        }

        // Countdown timer overlay for auctions
        let timerHtml = "";
        if (item.format === "auction" && item.endTime) {
            const timeLeft = this.formatTimeLeft(item.endTime);
            const isUrgent = (item.endTime - Date.now()) < 1000 * 60 * 60;
            timerHtml = `
                <div class="card-countdown-overlay ${isUrgent ? 'urgent' : ''}" data-end="${item.endTime}">
                    <span>⏱️</span>
                    <span class="timer-display">${timeLeft}</span>
                </div>
            `;
        }

        let statusBadge = "";
        if (item.isSold) {
            statusBadge = `<span class="card-status-overlay sold" style="position: absolute; top: 10px; right: 10px; background: #dc2626; color: white; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.6875rem; z-index: 2; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">SOLD</span>`;
        } else if (item.format === "auction" && item.endTime && item.endTime <= Date.now()) {
            statusBadge = `<span class="card-status-overlay ended" style="position: absolute; top: 10px; right: 10px; background: #475569; color: white; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.6875rem; z-index: 2; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">ENDED</span>`;
        }

        const actionHint = item.isSold 
            ? "Sold Out"
            : (item.format === "auction" && item.endTime && item.endTime <= Date.now())
            ? "Auction Closed"
            : isReq
            ? "Submit Quote &rarr;"
            : item.format === "auction" ? "Place Bid &rarr;" : item.format === "buy_now" ? "Buy Now &rarr;" : "View Details &rarr;";

        const sellerName = item.seller ? item.seller.name : "African Merchant";

        return `
            <div class="listing-card ${isReq ? 'card-is-request' : ''}" data-id="${item.id}">
                <div class="card-media">
                    <img src="${this.safeImageUrl(item.imageUrl)}" alt="${this.escapeHtml(item.title)}" loading="lazy">
                    <span class="card-format-badge ${formatBadgeClass}">${formatBadgeLabel}</span>
                    <button class="card-watchlist-btn ${isWatchlisted ? 'is-active' : ''}" title="${isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}">
                        ${isWatchlisted ? '❤️' : '🤍'}
                    </button>
                    ${statusBadge}
                    ${timerHtml}
                </div>

                <div class="card-body">
                    <div class="card-meta-row">
                        <span class="card-category">${this.capitalize(item.category)}</span>
                        <span class="card-location">📍 ${this.escapeHtml(item.neighborhood || item.city)}</span>
                    </div>

                    <h3 class="card-title">${this.escapeHtml(item.title)}</h3>

                    ${isReq ? `
                    <div class="req-chips-strip">
                        <span class="req-urgency-chip ${item.urgency && item.urgency.includes('24') ? 'urgent-glow' : ''}">
                            ${item.urgency && item.urgency.includes('24') ? '🔥' : '⏱️'} ${this.escapeHtml(item.urgency || 'Needed Soon')}
                        </span>
                        <span class="req-quotes-chip">
                            💬 ${(item.offers ? item.offers.length : 0)} quote${(item.offers && item.offers.length === 1) ? '' : 's'}
                        </span>
                    </div>
                    ` : ''}

                    <div class="card-price-section">
                        ${priceHtml}
                        <span class="fulfillment-tag ${fulfillmentClass}">${fulfillmentLabel}</span>
                    </div>
                </div>

                <div class="card-footer-strip">
                    <div class="seller-brief">
                        <span>👤 ${this.escapeHtml(sellerName)}</span>
                    </div>
                    <span class="card-action-hint">
                        ${actionHint}
                    </span>
                </div>
            </div>
        `;
    }

    // ========================================================================
    // ITEM DETAIL MODAL & BIDDING ENGINE
    // ========================================================================

    openDetailModal(listingId) {
        const item = this.listings.find(l => l.id === listingId);
        if (!item) return;

        this.currentListingDetail = item;
        const modalOverlay = document.getElementById("detailModalOverlay");

        document.getElementById("detailMainImg").src = this.safeImageUrl(item.imageUrl);
        document.getElementById("detailFormatBadge").textContent = item.format.toUpperCase().replace("_", " ");
        document.getElementById("detailTitle").textContent = item.title;
        document.getElementById("detailBreadcrumbs").textContent = `${this.capitalize(item.category)} > ${this.capitalize(item.format.replace('_', ' '))}`;
        document.getElementById("detailDescriptionText").textContent = item.description;

        // Location & Fulfillment
        document.getElementById("detailLocationText").textContent = `📍 ${item.city} • ${item.neighborhood || 'Local Trade Hub'}`;
        document.getElementById("detailFulfillmentBadge").textContent = item.fulfillment === "both" 
            ? "🤝 Local Meetup & 📦 Courier Dispatch (GIG / Sendy)"
            : item.fulfillment === "pickup" ? "🤝 Safe Public Meetup Only" : "📦 Courier Delivery Only";

        // Seller
        const seller = item.seller || { name: "African Merchant", avatar: "AM", rating: 5.0, reviewsCount: 20 };
        document.getElementById("detailSellerAvatar").textContent = seller.avatar || "AM";
        document.getElementById("detailSellerName").textContent = seller.name;
        document.getElementById("detailSellerRating").textContent = `${seller.rating} (${seller.reviewsCount} sales • 100% positive)`;

        // Action Box (Auction vs Buy Now vs Service vs Request)
        this.renderDetailActionBox(item);

        // Quotes Section (for Requests)
        const quotesSection = document.getElementById("detailQuotesSection");
        if (item.isRequest || (item.format && item.format.startsWith("request_"))) {
            if (quotesSection) {
                quotesSection.style.display = "block";
                this.renderDetailQuotes(item);
            }
        } else {
            if (quotesSection) quotesSection.style.display = "none";
        }

        // Bid History (if Auction)
        const historySection = document.getElementById("detailBidHistorySection");
        if (item.format === "auction") {
            historySection.style.display = "block";
            document.getElementById("detailHistoryCount").textContent = item.bidsCount || 0;
            const resMet = !item.reservePrice || (item.currentPrice >= item.reservePrice);
            const resStatusEl = document.getElementById("detailReserveStatus");
            resStatusEl.textContent = resMet ? "Reserve Met" : "Reserve Not Met";
            resStatusEl.style.background = resMet ? "#d1fae5" : "#fee2e2";
            resStatusEl.style.color = resMet ? "#065f46" : "#991b1b";

            const historyList = document.getElementById("detailBidHistoryList");
            const history = item.bidHistory || [];
            if (history.length === 0) {
                historyList.innerHTML = `<div style="font-size: 0.8125rem; color: #64748b; padding: 6px;">No bids placed yet. Be the first!</div>`;
            } else {
                historyList.innerHTML = history.map((bid, i) => `
                    <div class="bid-history-item ${i === 0 ? 'highest' : ''}">
                        <span>${i === 0 ? '🏆 ' : ''}Bidder: <strong>${this.escapeHtml(bid.bidder)}</strong></span>
                        <span>${this.formatMoney(bid.amount, false)} • ${bid.time}</span>
                    </div>
                `).join("");
            }
        } else {
            historySection.style.display = "none";
        }

        // Watchlist sync
        const watchBtn = document.getElementById("detailWatchlistBtn");
        const isWatched = this.watchlist.has(item.id);
        watchBtn.className = `btn-watchlist-toggle ${isWatched ? 'active' : ''}`;
        watchBtn.innerHTML = `
            <span class="heart-icon">${isWatched ? '❤️' : '🤍'}</span>
            <span class="btn-text">${isWatched ? 'Saved in Watchlist' : 'Add to Watchlist'}</span>
        `;
        watchBtn.onclick = () => {
            this.toggleWatchlist(item.id);
            const nowWatched = this.watchlist.has(item.id);
            watchBtn.className = `btn-watchlist-toggle ${nowWatched ? 'active' : ''}`;
            watchBtn.innerHTML = `
                <span class="heart-icon">${nowWatched ? '❤️' : '🤍'}</span>
                <span class="btn-text">${nowWatched ? 'Saved in Watchlist' : 'Add to Watchlist'}</span>
            `;
        };

        // Share button
        const shareBtn = document.getElementById("detailShareBtn");
        shareBtn.onclick = () => {
            navigator.clipboard.writeText(window.location.href);
            this.showToast("Listing link copied to clipboard!", "success");
        };

        modalOverlay.style.display = "flex";
        document.body.style.overflow = "hidden";
    }

    renderDetailActionBox(item) {
        const actionBox = document.getElementById("detailActionBox");
        if (!actionBox) return;

        const isReq = Boolean(item.isRequest || (item.format && item.format.startsWith("request_")));
        const config = CURRENCY_CONFIG[this.activeCurrency] || CURRENCY_CONFIG.NGN;

        if (isReq) {
            // BUYER REQUEST ACTION BOX (Submit Quote / Proposal)
            const budgetVal = item.budget !== undefined ? item.budget : (item.currentPrice || 0);
            const budgetInActive = Math.round(budgetVal * config.rate);

            actionBox.innerHTML = `
                <div class="action-card action-card-request">
                    <div class="action-head">
                        <div>
                            <span class="action-price-label">Buyer's Target Budget</span>
                            <div class="action-current-bid">${this.formatMoney(budgetVal, true)}</div>
                        </div>
                        <div class="urgency-badge">
                            <span>⏱️ Urgency: ${this.escapeHtml(item.urgency || 'Within 2-3 Days')}</span>
                        </div>
                    </div>

                    <div class="request-specs-box">
                        <div class="spec-row">
                            <span class="spec-label">Condition Required:</span>
                            <span class="spec-val">${this.escapeHtml(item.condition || 'Clean / Functional')}</span>
                        </div>
                        <div class="spec-row">
                            <span class="spec-label">Fulfillment Preference:</span>
                            <span class="spec-val">${item.fulfillment === 'pickup' ? '🤝 Local Handover Only' : '📦 Courier or Meetup'}</span>
                        </div>
                    </div>

                    <div class="quote-form-container">
                        <h4 class="quote-form-title">Have this item or provide this service? Submit a Quote:</h4>
                        <form id="detailQuoteForm" class="detail-quote-form">
                            <div class="form-row">
                                <div class="form-group flex-1">
                                    <label class="form-label">Your Proposed Price (${config.symbol.trim()})</label>
                                    <input type="number" id="quotePriceInput" value="${budgetInActive}" min="1" step="any" required>
                                </div>
                                <div class="form-group flex-1">
                                    <label class="form-label">Availability / Timeline</label>
                                    <input type="text" id="quoteTimelineInput" placeholder="e.g. Can meet today in Ikeja / Westlands" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Message / Details</label>
                                <textarea id="quoteMessageInput" rows="2" placeholder="Detail your exact model, condition, warranty, or delivery timeframe..." required></textarea>
                            </div>
                            <button type="submit" class="btn-submit-quote">
                                🚀 Send Quote to Buyer
                            </button>
                        </form>
                    </div>
                </div>
            `;

            const quoteForm = document.getElementById("detailQuoteForm");
            if (quoteForm) {
                quoteForm.addEventListener("submit", (e) => {
                    e.preventDefault();
                    const enteredPrice = parseFloat(document.getElementById("quotePriceInput").value);
                    const timeline = document.getElementById("quoteTimelineInput").value;
                    const message = document.getElementById("quoteMessageInput").value;

                    // Convert entered local price to USD baseline
                    const priceInUsd = enteredPrice / config.rate;

                    this.submitQuote(item.id, priceInUsd, timeline, message);
                });
            }

        } else if (item.format === "auction") {
            // AUCTION ACTION BOX
            const isEnded = item.endTime && item.endTime <= Date.now();
            const isSold = Boolean(item.isSold);
            const minNextBidUsd = Math.round(item.currentPrice * 1.05 + 5);
            const minNextBidActive = Math.round(minNextBidUsd * config.rate);

            actionBox.innerHTML = `
                <div class="action-card">
                    <div class="action-head">
                        <div>
                            <span class="action-price-label">${isSold ? 'Sold Price' : 'Current Bid'} (${item.bidsCount || 0} bids)</span>
                            <div class="action-current-bid">${this.formatMoney(item.currentPrice, true)}</div>
                        </div>
                        <div class="modal-timer-badge">
                            <span>⏱️ Status:</span>
                            <strong id="modalTimerClock">${isSold ? 'Item Sold' : isEnded ? 'Auction Ended' : this.formatTimeLeft(item.endTime)}</strong>
                        </div>
                    </div>

                    ${!isSold && !isEnded ? `
                    <form id="detailBidForm" class="bid-action-form">
                        <div class="bid-input-group">
                            <span class="bid-prefix">${config.symbol.trim()}</span>
                            <input type="number" id="detailBidInput" value="${minNextBidActive}" min="${minNextBidActive}" step="any" required>
                        </div>
                        <button type="submit" class="btn-place-bid">🔨 Place Bid Now</button>
                    </form>
                    <div class="bid-hint">Enter ${config.symbol.trim()}${minNextBidActive.toLocaleString()} or more &bull; Buyer protection via African Escrow.</div>

                    ${item.buyItNowPrice ? `
                    <div class="bin-separator"><span>OR SKIP THE AUCTION</span></div>
                    <button type="button" class="btn-buy-now" id="detailBinBtn">
                        ⚡ Buy It Now for ${this.formatMoney(item.buyItNowPrice, false)}
                    </button>
                    ` : ''}
                    ` : `
                    <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin: 12px 0; text-align: center; color: #475569; font-weight: 600;">
                        ${isSold ? '✅ This item has been sold.' : '⏱️ This auction has ended. Bidding is closed.'}
                    </div>
                    `}

                    <button type="button" class="btn-contact-seller" id="detailContactBtn">
                        💬 Contact Seller
                    </button>
                </div>
            `;

            const bidForm = document.getElementById("detailBidForm");
            if (bidForm) {
                bidForm.addEventListener("submit", (e) => {
                    e.preventDefault();
                    const bidVal = parseFloat(document.getElementById("detailBidInput").value);
                    const bidInUsd = bidVal / config.rate;
                    this.placeBid(item.id, bidInUsd);
                });
            }

            const binBtn = document.getElementById("detailBinBtn");
            if (binBtn) {
                binBtn.addEventListener("click", () => this.buyItNow(item.id));
            }

            const contactBtn = document.getElementById("detailContactBtn");
            if (contactBtn) {
                contactBtn.addEventListener("click", () => {
                    document.getElementById("detailModalOverlay").style.display = "none";
                    this.openChatModal(item.seller ? item.seller.name : "Seller", item.title);
                });
            }

        } else if (item.format === "buy_now") {
            // FIXED PRICE BUY NOW
            const isSold = Boolean(item.isSold);
            actionBox.innerHTML = `
                <div class="action-card">
                    <div class="action-head">
                        <div>
                            <span class="action-price-label">Fixed Price</span>
                            <div class="action-current-bid">${this.formatMoney(item.currentPrice, true)}</div>
                        </div>
                        <span class="instant-purchase-badge">${isSold ? '❌ Sold Out' : '⚡ In Stock'}</span>
                    </div>

                    ${!isSold ? `
                    <button type="button" class="btn-buy-now" id="detailBinBtn">
                        ⚡ Purchase Now via Escrow (${this.formatMoney(item.currentPrice, false)})
                    </button>
                    ` : `
                    <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 6px; padding: 12px; margin: 12px 0; text-align: center; color: #991b1b; font-weight: 600;">
                        This item has already been purchased.
                    </div>
                    `}

                    <button type="button" class="btn-contact-seller" id="detailContactBtn">
                        💬 Contact Seller / Meetup
                    </button>
                </div>
            `;

            const binBtn = document.getElementById("detailBinBtn");
            if (binBtn) {
                binBtn.addEventListener("click", () => this.buyItNow(item.id));
            }

            const contactBtn = document.getElementById("detailContactBtn");
            if (contactBtn) {
                contactBtn.addEventListener("click", () => {
                    document.getElementById("detailModalOverlay").style.display = "none";
                    this.openChatModal(item.seller ? item.seller.name : "Seller", item.title);
                });
            }

        } else if (item.format === "service") {
            // SERVICE RATE
            const isSold = Boolean(item.isSold);
            actionBox.innerHTML = `
                <div class="action-card">
                    <div class="action-head">
                        <div>
                            <span class="action-price-label">Service Rate</span>
                            <div class="action-current-bid">${this.formatMoney(item.currentPrice, true)} / day</div>
                        </div>
                        <span class="instant-purchase-badge">🛠️ Verified Artisan</span>
                    </div>

                    ${!isSold ? `
                    <button type="button" class="btn-buy-now" id="detailBookServiceBtn">
                        📅 Book Service & Lock Escrow
                    </button>
                    ` : `
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin: 12px 0; text-align: center; color: #166534; font-weight: 600;">
                        Service booking locked in Escrow.
                    </div>
                    `}

                    <button type="button" class="btn-contact-seller" id="detailContactBtn">
                        💬 Message Contractor / Request Free Quote
                    </button>
                </div>
            `;

            const bookBtn = document.getElementById("detailBookServiceBtn");
            if (bookBtn) {
                bookBtn.addEventListener("click", () => {
                    this.createEscrowFromListing(item);
                });
            }

            const contactBtn = document.getElementById("detailContactBtn");
            if (contactBtn) {
                contactBtn.addEventListener("click", () => {
                    document.getElementById("detailModalOverlay").style.display = "none";
                    this.openChatModal(item.seller ? item.seller.name : "Seller", item.title);
                });
            }

        } else if (item.format === "free_barter") {
            // FREE / BARTER ACTION BOX
            actionBox.innerHTML = `
                <div class="action-card">
                    <div class="action-head">
                        <div>
                            <span class="action-price-label">Price / Trade</span>
                            <div class="action-current-bid" style="color: #10b981;">Free / Barter Exchange</div>
                        </div>
                        <span class="instant-purchase-badge" style="background: #ecfdf5; color: #047857;">🔄 Community Trade</span>
                    </div>

                    <p style="font-size: 0.875rem; color: #475569; margin: 12px 0;">This item is offered for free curb pickup or mutual barter exchange. Contact the owner directly to arrange safe handover.</p>

                    <button type="button" class="btn-buy-now" id="detailContactBtn" style="background: #10b981;">
                        💬 Message Owner to Claim or Propose Trade
                    </button>
                </div>
            `;

            const contactBtn = document.getElementById("detailContactBtn");
            if (contactBtn) {
                contactBtn.addEventListener("click", () => {
                    document.getElementById("detailModalOverlay").style.display = "none";
                    this.openChatModal(item.seller ? item.seller.name : "Item Owner", item.title);
                });
            }
        }
    }

    renderDetailQuotes(item) {
        const list = document.getElementById("detailQuotesList");
        const count = document.getElementById("detailQuotesCount");
        if (!list) return;

        const offers = item.offers || [];
        if (count) count.textContent = offers.length;

        if (offers.length === 0) {
            list.innerHTML = `<div style="font-size: 0.8125rem; color: #64748b; padding: 6px;">No quotes submitted yet. Use the form above to send your proposal!</div>`;
            return;
        }

        list.innerHTML = offers.map(off => `
            <div class="quote-item-card">
                <div class="quote-item-head">
                    <div class="quote-provider-meta">
                        <span class="q-avatar">${off.providerAvatar || 'VP'}</span>
                        <div>
                            <strong>${this.escapeHtml(off.providerName)}</strong>
                            <span style="font-size: 0.75rem; color: #f59e0b;">(${off.providerRating} ★)</span>
                        </div>
                    </div>
                    <div class="quote-price-badge">${this.formatMoney(off.price, true)}</div>
                </div>
                <div class="quote-item-body">
                    <div><strong>Availability:</strong> ${this.escapeHtml(off.timeline)}</div>
                    <div style="margin-top: 4px; color: #334155;">"${this.escapeHtml(off.message)}"</div>
                </div>
                <div class="quote-item-footer">
                    <span>${off.time}</span>
                    <button type="button" class="btn-detail-accept-quote" data-req-id="${item.id}" data-off-id="${off.id}">
                        🤝 Accept Offer & Escrow
                    </button>
                </div>
            </div>
        `).join("");

        list.querySelectorAll(".btn-detail-accept-quote").forEach(b => {
            b.addEventListener("click", () => {
                const reqId = b.dataset.reqId;
                const offId = b.dataset.offId;
                const req = this.listings.find(l => l.id === reqId);
                const offer = req?.offers?.find(o => o.id === offId);

                if (req && offer) {
                    this.createEscrowOrder({
                        itemId: req.id,
                        title: req.title,
                        buyerName: "John Doe (You)",
                        sellerName: offer.providerName,
                        amountUsd: offer.price,
                        targetCurrency: this.activeCurrency,
                        safeZone: "Safe African Commercial Zone",
                        status: "funded"
                    });
                    offer.status = "Accepted";
                    this.saveListings();

                    document.getElementById("detailModalOverlay").style.display = "none";
                    document.body.style.overflow = "auto";
                    this.showToast(`🎉 Offer accepted! ${this.formatMoney(offer.price, false)} secured into African Escrow vault!`, "success");
                    this.openDashboardsModal();
                    this.switchDashboardTab("escrow");
                }
            });
        });
    }

    // ========================================================================
    // BIDDING & ESCROW TRANSACTIONS
    // ========================================================================

    placeBid(listingId, amountUsd) {
        const item = this.listings.find(l => l.id === listingId);
        if (!item || item.format !== "auction") return;

        if (item.isSold) {
            this.showToast("This item has already been sold!", "warning");
            return;
        }

        if (item.endTime && item.endTime <= Date.now()) {
            this.showToast("This auction has ended!", "warning");
            return;
        }

        if (amountUsd <= item.currentPrice) {
            this.showToast("Bid must be strictly higher than the current bid!", "warning");
            return;
        }

        item.currentPrice = amountUsd;
        item.bidsCount = (item.bidsCount || 0) + 1;
        if (!item.bidHistory) item.bidHistory = [];

        item.bidHistory.unshift({
            bidder: "John Doe (You)",
            amount: amountUsd,
            time: "Just now"
        });

        this.myBids[item.id] = {
            amount: amountUsd,
            status: "winning",
            time: Date.now()
        };

        this.saveListings();
        this.saveMyBids();
        this.renderListings();
        this.openDetailModal(item.id);

        this.showToast(`🎉 Highest Bid placed! You are currently winning at ${this.formatMoney(amountUsd, false)}`, "success");
        this.updateTopBarStats();
        this.updateDashboardMetrics();
    }

    buyItNow(listingId) {
        const item = this.listings.find(l => l.id === listingId);
        if (!item) return;

        if (item.isSold) {
            this.showToast("This item has already been sold!", "warning");
            return;
        }

        const price = item.buyItNowPrice || item.currentPrice;
        if (confirm(`Confirm Buy It Now for ${this.formatMoney(price, false)} via Servilist Escrow?`)) {
            this.createEscrowFromListing(item);
        }
    }

    createEscrowFromListing(item) {
        if (item.isSold) {
            this.showToast("This item has already been sold!", "warning");
            return;
        }

        const price = item.buyItNowPrice || item.currentPrice;
        this.createEscrowOrder({
            itemId: item.id,
            title: item.title,
            buyerName: "John Doe (You)",
            sellerName: item.seller ? item.seller.name : "African Merchant",
            amountUsd: price,
            targetCurrency: this.activeCurrency,
            safeZone: (item.city || "Lagos, Nigeria") + " Safe Exchange Zone",
            status: "funded"
        });

        item.isSold = true;
        this.saveListings();
        this.renderListings();

        document.getElementById("detailModalOverlay").style.display = "none";
        document.body.style.overflow = "auto";
        this.showToast(`🎉 Order Placed! Payment of ${this.formatMoney(price, false)} secured in Escrow.`, "success");
        this.openDashboardsModal();
        this.switchDashboardTab("escrow");
    }

    submitQuote(requestId, priceUsd, timeline, message) {
        const item = this.listings.find(l => l.id === requestId);
        if (!item) return;

        if (!item.offers) item.offers = [];

        const newOffer = {
            id: `off-${Date.now()}`,
            providerName: "John Doe (You)",
            providerAvatar: "JD",
            providerRating: 5.0,
            price: priceUsd,
            timeline: timeline,
            message: message,
            time: "Just now",
            status: "Pending"
        };

        item.offers.unshift(newOffer);

        this.myQuotes[requestId] = {
            quoteId: newOffer.id,
            price: priceUsd,
            timeline: timeline,
            message: message,
            time: "Just now",
            itemTitle: item.title,
            status: "Pending Review"
        };

        this.saveListings();
        this.saveMyQuotes();
        this.renderListings();
        this.openDetailModal(item.id);

        this.showToast(`🚀 Quote of ${this.formatMoney(priceUsd, false)} sent to buyer!`, "success");
        this.updateDashboardMetrics();
    }

    deleteRequest(requestId) {
        this.listings = this.listings.filter(l => l.id !== requestId);
        this.myRequests.delete(requestId);
        delete this.myQuotes[requestId];

        this.saveListings();
        this.saveMyRequests();
        this.saveMyQuotes();
        this.renderListings();
        this.showToast("Request closed and deleted.", "info");
        this.updateTopBarStats();
        this.updateDashboardMetrics();
    }

    // ========================================================================
    // POSTING: LISTING & REQUEST CREATION
    // ========================================================================

    openPostListingModal() {
        const overlay = document.getElementById("postModalOverlay");
        if (!overlay) return;

        overlay.style.display = "flex";
        document.body.style.overflow = "hidden";

        const tabPost = document.getElementById("tabModePost");
        const tabReq = document.getElementById("tabModeReq");
        if (tabPost && tabReq) {
            tabPost.classList.add("active");
            tabReq.classList.remove("active");
        }

        const pForm = document.getElementById("postListingForm");
        const rForm = document.getElementById("postRequestForm");
        if (pForm) pForm.style.display = "flex";
        if (rForm) rForm.style.display = "none";
    }

    openPostRequestModal() {
        const overlay = document.getElementById("postModalOverlay");
        if (!overlay) return;

        overlay.style.display = "flex";
        document.body.style.overflow = "hidden";

        const tabPost = document.getElementById("tabModePost");
        const tabReq = document.getElementById("tabModeReq");
        if (tabPost && tabReq) {
            tabReq.classList.add("active");
            tabPost.classList.remove("active");
        }

        const pForm = document.getElementById("postListingForm");
        const rForm = document.getElementById("postRequestForm");
        if (pForm) pForm.style.display = "none";
        if (rForm) rForm.style.display = "flex";
    }

    handleCreateListing() {
        const title = document.getElementById("postTitle")?.value.trim();
        const category = document.getElementById("postCategory")?.value;
        const format = document.querySelector("input[name='postFormat']:checked")?.value 
            || document.querySelector("input[name='listingFormat']:checked")?.value 
            || "buy_now";
        const startPriceInp = parseFloat(document.getElementById("postStartPrice")?.value) || 0;
        const reservePriceInp = parseFloat(document.getElementById("postReservePrice")?.value) || 0;
        const durationHours = parseFloat(document.getElementById("postDuration")?.value) || 24;
        const city = document.getElementById("postCity")?.value || "Lagos, Nigeria";
        const neighborhood = document.getElementById("postNeighborhood")?.value.trim() || "";
        const fulfillment = document.getElementById("postFulfillment")?.value || "both";
        const rawImg = document.getElementById("postImageUrl")?.value.trim();
        const imageUrl = this.safeImageUrl(rawImg);
        const description = document.getElementById("postDescription")?.value.trim();

        const config = CURRENCY_CONFIG[this.activeCurrency] || CURRENCY_CONFIG.NGN;
        const startPriceUsd = startPriceInp / config.rate;
        const reservePriceUsd = reservePriceInp / config.rate;

        const newListing = {
            id: `serv-${Date.now()}`,
            title,
            category,
            format,
            startingPrice: startPriceUsd,
            currentPrice: startPriceUsd,
            buyItNowPrice: format === "buy_now" ? startPriceUsd : null,
            reservePrice: format === "auction" && reservePriceUsd ? reservePriceUsd : null,
            bidsCount: 0,
            endTime: format === "auction" ? Date.now() + 1000 * 60 * 60 * durationHours : null,
            city,
            neighborhood,
            distanceMiles: 2.5,
            fulfillment,
            imageUrl,
            description,
            seller: {
                name: "John Doe (You)",
                avatar: "JD",
                rating: 5.0,
                reviewsCount: 1,
                verified: true
            },
            bidHistory: [],
            createdAt: Date.now()
        };

        this.listings.unshift(newListing);
        this.saveListings();

        document.getElementById("postModalOverlay").style.display = "none";
        document.body.style.overflow = "auto";
        document.getElementById("postListingForm").reset();

        this.showToast("🚀 Listing published across African commerce hubs!", "success");
        this.renderListings();
        this.renderCategoryCounts();
        this.updateTopBarStats();
        this.updateDashboardMetrics();
    }

    handleCreateRequest() {
        const title = document.getElementById("reqTitle")?.value.trim();
        const category = document.getElementById("reqCategory")?.value;
        const reqType = document.querySelector("input[name='requestType']:checked")?.value || "good";
        const budgetInp = parseFloat(document.getElementById("reqBudget")?.value) || 0;
        const urgency = document.getElementById("reqUrgency")?.value || "Within 2-3 Days";
        const condition = document.getElementById("reqCondition")?.value || "Gently Used / Like New";
        const rateType = document.getElementById("reqRateType")?.value || "flat";
        const city = document.getElementById("reqCity")?.value || "Lagos, Nigeria";
        const neighborhood = document.getElementById("reqNeighborhood")?.value.trim() || "";
        const fulfillment = document.getElementById("reqFulfillment")?.value || "both";
        const rawImg = document.getElementById("reqImageUrl")?.value.trim();
        const imageUrl = this.safeImageUrl(rawImg);
        const description = document.getElementById("reqDescription")?.value.trim();

        const config = CURRENCY_CONFIG[this.activeCurrency] || CURRENCY_CONFIG.NGN;
        const budgetUsd = budgetInp / config.rate;

        const newRequest = {
            id: `req-${Date.now()}`,
            title,
            category,
            format: reqType === "service" ? "request_service" : "request_good",
            isRequest: true,
            requestType: reqType,
            budget: budgetUsd,
            currentPrice: budgetUsd,
            startingPrice: budgetUsd,
            urgency,
            condition,
            rateType,
            city,
            neighborhood,
            distanceMiles: 1.8,
            fulfillment,
            imageUrl,
            description,
            seller: {
                name: "John Doe (You)",
                avatar: "JD",
                rating: 5.0,
                reviewsCount: 1,
                verified: true
            },
            offers: [],
            createdAt: Date.now()
        };

        this.listings.unshift(newRequest);
        this.myRequests.add(newRequest.id);
        this.saveListings();
        this.saveMyRequests();

        document.getElementById("postModalOverlay").style.display = "none";
        document.body.style.overflow = "auto";
        document.getElementById("postRequestForm").reset();

        this.showToast("🙋 Buyer Request published! Local African suppliers will send quotes.", "success");
        this.renderListings();
        this.renderCategoryCounts();
        this.updateTopBarStats();
        this.updateDashboardMetrics();
    }

    renderPresetPhotos() {
        const postList = document.getElementById("samplePhotosList");
        const reqList = document.getElementById("reqSamplePhotosList");

        if (postList) {
            postList.innerHTML = SAMPLE_PRESET_PHOTOS.map(p => `
                <button type="button" class="btn-sample-photo" data-url="${p.url}">${p.label}</button>
            `).join("");

            postList.querySelectorAll(".btn-sample-photo").forEach(b => {
                b.addEventListener("click", () => {
                    const inp = document.getElementById("postImageUrl");
                    if (inp) inp.value = b.dataset.url;
                });
            });
        }

        if (reqList) {
            reqList.innerHTML = SAMPLE_PRESET_PHOTOS.map(p => `
                <button type="button" class="btn-sample-photo" data-url="${p.url}">${p.label}</button>
            `).join("");

            reqList.querySelectorAll(".btn-sample-photo").forEach(b => {
                b.addEventListener("click", () => {
                    const inp = document.getElementById("reqImageUrl");
                    if (inp) inp.value = b.dataset.url;
                });
            });
        }
    }

    // ========================================================================
    // WATCHLIST & DRAWER
    // ========================================================================

    toggleWatchlist(listingId) {
        if (this.watchlist.has(listingId)) {
            this.watchlist.delete(listingId);
            this.showToast("Removed from Watchlist", "info");
        } else {
            this.watchlist.add(listingId);
            this.showToast("❤️ Saved to your Watchlist!", "success");
        }
        this.saveWatchlist();
        this.renderListings();
    }

    openDrawer(tab = "watchlist") {
        const overlay = document.getElementById("drawerModalOverlay");
        if (!overlay) return;

        overlay.style.display = "flex";
        document.body.style.overflow = "hidden";
        this.switchDrawerTab(tab);
    }

    switchDrawerTab(tab) {
        this.activeDrawerTab = tab;

        document.querySelectorAll(".drawer-tab").forEach(t => t.classList.remove("active"));
        if (tab === "watchlist") document.getElementById("tabWatchlist")?.classList.add("active");
        if (tab === "my_bids") document.getElementById("tabMyBids")?.classList.add("active");
        if (tab === "my_requests") document.getElementById("tabMyRequests")?.classList.add("active");
        if (tab === "my_quotes") document.getElementById("tabMyQuotes")?.classList.add("active");

        this.renderDrawer();
    }

    renderDrawer() {
        const body = document.getElementById("drawerBody");
        if (!body) return;

        if (this.activeDrawerTab === "watchlist") {
            const items = this.listings.filter(l => this.watchlist.has(l.id));
            if (items.length === 0) {
                body.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #64748b;">
                        <span style="font-size: 2.5rem;">🤍</span>
                        <h4 style="margin: 8px 0; color: #0f172a;">Watchlist is empty</h4>
                        <p style="font-size: 0.8125rem;">Heart any auction or classified to track it here.</p>
                    </div>
                `;
                return;
            }

            body.innerHTML = items.map(item => `
                <div class="drawer-item-card" data-id="${item.id}">
                    <img src="${item.imageUrl}" alt="${this.escapeHtml(item.title)}" class="drawer-thumb">
                    <div class="drawer-item-info">
                        <h4 class="drawer-item-title">${this.escapeHtml(item.title)}</h4>
                        <div class="drawer-item-meta">
                            <span><strong>${this.formatMoney(item.budget || item.currentPrice, false)}</strong></span>
                            <span>${item.format === 'auction' ? '⏱️ ' + this.formatTimeLeft(item.endTime) : '⚡ Buy Now'}</span>
                        </div>
                    </div>
                    <button class="chip-remove btn-drawer-remove" data-id="${item.id}">&times;</button>
                </div>
            `).join("");

        } else if (this.activeDrawerTab === "my_bids") {
            const entries = Object.entries(this.myBids);
            if (entries.length === 0) {
                body.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #64748b;">
                        <span style="font-size: 2.5rem;">🔨</span>
                        <h4 style="margin: 8px 0; color: #0f172a;">No active bids placed</h4>
                        <p style="font-size: 0.8125rem;">Bid on live auctions in Lagos, Nairobi, Accra, and Kigali.</p>
                    </div>
                `;
                return;
            }

            body.innerHTML = entries.map(([id, bidData]) => {
                const item = this.listings.find(l => l.id === id);
                if (!item) return "";
                const isWinning = bidData.status === "winning";
                return `
                    <div class="drawer-item-card" data-id="${item.id}">
                        <img src="${item.imageUrl}" alt="${this.escapeHtml(item.title)}" class="drawer-thumb">
                        <div class="drawer-item-info">
                            <h4 class="drawer-item-title">${this.escapeHtml(item.title)}</h4>
                            <div class="drawer-item-meta">
                                <span>Your Bid: <strong>${this.formatMoney(bidData.amount, false)}</strong></span>
                                <span class="drawer-status-badge ${isWinning ? 'status-winning' : 'status-outbid'}">
                                    ${isWinning ? '🏆 High Bidder' : '⚠️ Outbid'}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");

        } else if (this.activeDrawerTab === "my_requests") {
            const userReqs = this.listings.filter(l => this.myRequests.has(l.id) || (l.seller && l.seller.name.includes("You") && l.isRequest));
            if (userReqs.length === 0) {
                body.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #64748b;">
                        <span style="font-size: 2.5rem;">🙋</span>
                        <h4 style="margin: 8px 0; color: #0f172a;">No requests posted yet</h4>
                        <p style="font-size: 0.8125rem;">Post an ISO request to let suppliers bid for your business.</p>
                    </div>
                `;
                return;
            }

            body.innerHTML = userReqs.map(item => `
                <div class="drawer-item-card" data-id="${item.id}">
                    <img src="${item.imageUrl}" alt="${this.escapeHtml(item.title)}" class="drawer-thumb">
                    <div class="drawer-item-info">
                        <h4 class="drawer-item-title">${this.escapeHtml(item.title)}</h4>
                        <div class="drawer-item-meta">
                            <span>Budget: <strong>${this.formatMoney(item.budget || item.currentPrice, false)}</strong></span>
                            <span>💬 ${(item.offers ? item.offers.length : 0)} quotes</span>
                        </div>
                    </div>
                    <button class="chip-remove btn-drawer-delete-req" data-id="${item.id}">&times;</button>
                </div>
            `).join("");

        } else if (this.activeDrawerTab === "my_quotes") {
            const entries = Object.entries(this.myQuotes);
            if (entries.length === 0) {
                body.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #64748b;">
                        <span style="font-size: 2.5rem;">💼</span>
                        <h4 style="margin: 8px 0; color: #0f172a;">No quotes submitted</h4>
                        <p style="font-size: 0.8125rem;">Browse buyer requests and submit competitive quotes.</p>
                    </div>
                `;
                return;
            }

            body.innerHTML = entries.map(([id, q]) => `
                <div class="drawer-item-card" data-id="${id}">
                    <div class="drawer-item-info">
                        <h4 class="drawer-item-title">${this.escapeHtml(q.itemTitle || 'Buyer Request')}</h4>
                        <div class="drawer-item-meta">
                            <span>Your Quote: <strong>${this.formatMoney(q.price, false)}</strong></span>
                            <span class="drawer-status-badge status-winning">${this.escapeHtml(q.status || 'Under Review')}</span>
                        </div>
                    </div>
                </div>
            `).join("");
        }

        // Drawer click handlers
        body.querySelectorAll(".drawer-item-card").forEach(c => {
            c.addEventListener("click", (e) => {
                if (e.target.closest(".btn-drawer-remove") || e.target.closest(".btn-drawer-delete-req")) return;
                const id = c.dataset.id;
                document.getElementById("drawerModalOverlay").style.display = "none";
                document.body.style.overflow = "auto";
                this.openDetailModal(id);
            });
        });

        body.querySelectorAll(".btn-drawer-remove").forEach(b => {
            b.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggleWatchlist(b.dataset.id);
                this.renderDrawer();
            });
        });

        body.querySelectorAll(".btn-drawer-delete-req").forEach(b => {
            b.addEventListener("click", (e) => {
                e.stopPropagation();
                this.deleteRequest(b.dataset.id);
                this.renderDrawer();
            });
        });
    }

    updateWatchlistBadges() {
        const count = this.watchlist.size;
        const b1 = document.getElementById("watchlistCountBadge");
        const b2 = document.getElementById("drawerWatchlistCount");
        if (b1) b1.textContent = count;
        if (b2) b2.textContent = count;
    }

    updateMyBidsBadges() {
        const count = Object.keys(this.myBids).length;
        const b1 = document.getElementById("myBidsCountBadge");
        const b2 = document.getElementById("drawerBidsCount");
        if (b1) b1.textContent = count;
        if (b2) b2.textContent = count;
    }

    updateMyRequestsBadges() {
        const count = this.myRequests.size;
        const b1 = document.getElementById("myRequestsCountBadge");
        const b2 = document.getElementById("drawerRequestsCount");
        if (b1) b1.textContent = count;
        if (b2) b2.textContent = count;
    }

    updateMyQuotesBadges() {
        const count = Object.keys(this.myQuotes).length;
        const b = document.getElementById("drawerQuotesCount");
        if (b) b.textContent = count;
    }

    // ========================================================================
    // CHAT / MESSAGING MODAL
    // ========================================================================

    openChatModal(sellerName, itemTitle) {
        const overlay = document.getElementById("chatModalOverlay");
        if (!overlay) return;

        const sName = document.getElementById("chatSellerName");
        const iTitle = document.getElementById("chatItemTitle");
        if (sName) sName.textContent = sellerName || "Seller";
        if (iTitle) iTitle.textContent = itemTitle || "Item";

        overlay.style.display = "flex";
        document.body.style.overflow = "hidden";
    }

    handleSendChatMessage() {
        const inp = document.getElementById("chatInput");
        const container = document.getElementById("chatMessages");
        if (!inp || !container || !inp.value.trim()) return;

        const text = inp.value.trim();
        inp.value = "";

        const msgEl = document.createElement("div");
        msgEl.className = "chat-msg msg-sent";
        msgEl.innerHTML = `
            <div class="msg-bubble">${this.escapeHtml(text)}</div>
            <span class="msg-time">Just now</span>
        `;
        container.appendChild(msgEl);
        container.scrollTop = container.scrollHeight;

        // Auto-reply simulation for realism
        setTimeout(() => {
            const replyEl = document.createElement("div");
            replyEl.className = "chat-msg msg-received";
            replyEl.innerHTML = `
                <div class="msg-bubble">Thanks for your message! Yes, this is available. Happy to meet at the safe public exchange zone or handle through Servilist Escrow.</div>
                <span class="msg-time">Just now</span>
            `;
            container.appendChild(replyEl);
            container.scrollTop = container.scrollHeight;
        }, 1200);
    }

    // ========================================================================
    // TIMERS, CATEGORY COUNTS & TOAST NOTIFICATIONS
    // ========================================================================

    startTimerTicker() {
        setInterval(() => {
            document.querySelectorAll(".card-countdown-overlay").forEach(overlay => {
                const endTime = parseInt(overlay.dataset.end, 10);
                if (endTime) {
                    const display = overlay.querySelector(".timer-display");
                    if (display) display.textContent = this.formatTimeLeft(endTime);
                    if ((endTime - Date.now()) < 1000 * 60 * 60) {
                        overlay.classList.add("urgent");
                    }
                }
            });

            const modalClock = document.getElementById("modalTimerClock");
            if (modalClock && this.currentListingDetail && this.currentListingDetail.endTime) {
                modalClock.textContent = this.formatTimeLeft(this.currentListingDetail.endTime);
            }
        }, 1000);
    }

    formatTimeLeft(endTime) {
        if (!endTime) return "No limit";
        const diff = endTime - Date.now();
        if (diff <= 0) return "Auction Ended";

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h left`;
        }
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    renderCategoryCounts() {
        const counts = { all: 0, electronics: 0, solar: 0, services: 0, collectibles: 0, vehicles: 0, housing: 0, home: 0, agriculture: 0, community: 0 };

        this.listings.forEach(item => {
            counts.all++;
            if (counts[item.category] !== undefined) {
                counts[item.category]++;
            }
        });

        const setC = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setC("countAll", counts.all);
        setC("countElectronics", counts.electronics);
        setC("countSolar", counts.solar);
        setC("countServices", counts.services);
        setC("countCollectibles", counts.collectibles);
        setC("countVehicles", counts.vehicles);
        setC("countHousing", counts.housing);
        setC("countHome", counts.home);
        setC("countAgriculture", counts.agriculture);
        setC("countCommunity", counts.community);
    }

    setCategory(cat) {
        this.filters.category = cat;

        const headerCat = document.getElementById("headerCategorySelect");
        if (headerCat) headerCat.value = cat;

        document.querySelectorAll("#categoryTree .category-item").forEach(item => {
            if (item.dataset.cat === cat) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });

        this.renderListings();
    }

    resetFilters() {
        this.marketMode = "all";
        this.filters = {
            city: "Lagos, Nigeria",
            category: "all",
            formatPill: "all",
            formatCheckboxes: ["auction", "buy_now", "service", "free_barter", "request_good", "request_service"],
            fulfillmentCheckboxes: ["pickup", "shipping"],
            radius: 50,
            minPrice: null,
            maxPrice: null,
            searchQuery: ""
        };

        const citySelector = document.getElementById("citySelector");
        if (citySelector) citySelector.value = "Lagos, Nigeria";

        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.value = "";

        const clearSearchBtn = document.getElementById("clearSearchBtn");
        if (clearSearchBtn) clearSearchBtn.style.display = "none";

        const minPriceInput = document.getElementById("minPriceInput");
        const maxPriceInput = document.getElementById("maxPriceInput");
        if (minPriceInput) minPriceInput.value = "";
        if (maxPriceInput) maxPriceInput.value = "";

        // Reset format pills
        document.querySelectorAll("#formatPills .pill-btn").forEach((p, idx) => {
            if (idx === 0) p.classList.add("active");
            else p.classList.remove("active");
        });

        // Reset market mode segments
        document.querySelectorAll("#marketModeControl .mode-seg-btn").forEach((b, idx) => {
            if (idx === 0) b.classList.add("active");
            else b.classList.remove("active");
        });

        document.querySelectorAll("input[name='formatFilter']").forEach(c => c.checked = true);
        document.querySelectorAll("input[name='fulfillmentFilter']").forEach(c => c.checked = true);

        this.setCategory("all");
        this.showToast("All marketplace filters reset", "info");
    }

    updateTopBarStats() {
        const statsEl = document.getElementById("activeStats");
        if (statsEl) {
            const auctionCount = this.listings.filter(l => l.format === "auction").length;
            const requestCount = this.listings.filter(l => Boolean(l.isRequest || (l.format && l.format.startsWith("request_")))).length;
            statsEl.innerHTML = `<strong>${this.listings.length}</strong> African Listings &bull; <strong>${auctionCount}</strong> Live Auctions &bull; <strong>${requestCount}</strong> Buyer Requests`;
        }
    }

    showToast(message, type = "info") {
        const container = document.getElementById("toastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        const icons = { success: "✅", warning: "⚠️", info: "ℹ️" };
        toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${this.escapeHtml(message)}</span>`;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            toast.style.transition = "all 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    capitalize(str) {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Instantiate on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    window.servilistApp = new ServilistApp();
    window.servlistApp = window.servilistApp;
});
