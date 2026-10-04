/**
 * SERVLIST - Local Classifieds & Live Auction Marketplace Engine
 * Combines Craigslist hyperlocal classifieds with eBay auction & fixed-price mechanics.
 */

// ============================================================================
// INITIAL SEED DATA
// ============================================================================

const SEED_LISTINGS = [
    {
        id: "serv-101",
        title: "2021 Apple MacBook Pro 14\" M1 Pro (16GB RAM / 512GB SSD) Space Gray",
        category: "electronics",
        format: "auction", // 'auction', 'buy_now', 'service', 'free_barter'
        startingPrice: 750,
        currentPrice: 885,
        buyItNowPrice: 1150,
        reservePrice: 850,
        bidsCount: 14,
        endTime: Date.now() + 1000 * 60 * 42, // Ends in 42 minutes (urgent!)
        city: "Austin, TX",
        neighborhood: "Downtown / South Congress",
        distanceMiles: 2.4,
        fulfillment: "both", // 'pickup', 'shipping', 'both'
        shippingFee: 14.50,
        imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        description: "M1 Pro chip with 8-core CPU and 14-core GPU. Immaculate condition, battery health at 94%. Comes with original MagSafe 3 charger and box. Preferred local pickup at safe exchange zone or fast USPS Priority shipping.",
        seller: {
            name: "Marcus Vance",
            avatar: "MV",
            rating: 4.9,
            reviewsCount: 88,
            verified: true
        },
        bidHistory: [
            { bidder: "t***9", amount: 885, time: "3 mins ago" },
            { bidder: "b***2", amount: 860, time: "18 mins ago" },
            { bidder: "k***5", amount: 820, time: "1 hour ago" },
            { bidder: "j***1", amount: 750, time: "4 hours ago" }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 20
    },
    {
        id: "serv-102",
        title: "Herman Miller Aeron Chair - Size B (Fully Loaded PostureFit)",
        category: "home",
        format: "buy_now",
        currentPrice: 420,
        buyItNowPrice: 420,
        city: "Austin, TX",
        neighborhood: "East Austin / Mueller",
        distanceMiles: 4.1,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1580481077195-c3a9927b798b?auto=format&fit=crop&w=800&q=80",
        description: "Classic graphite color with mineral mesh. Forward tilt, tilt limiter, adjustable lumbar and leather armrests. Perfect home office upgrade. Cash or Venmo on pickup. Can help load into your car.",
        seller: {
            name: "Sarah Jenkins",
            avatar: "SJ",
            rating: 5.0,
            reviewsCount: 32,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 8
    },
    {
        id: "serv-103",
        title: "1974 Gibson Les Paul Custom Electric Guitar - Ebony Fretboard",
        category: "collectibles",
        format: "auction",
        startingPrice: 2200,
        currentPrice: 2950,
        reservePrice: 2800,
        bidsCount: 21,
        endTime: Date.now() + 1000 * 60 * 60 * 3.5, // 3.5 hours left
        city: "Austin, TX",
        neighborhood: "Zilker Park Area",
        distanceMiles: 3.2,
        fulfillment: "both",
        shippingFee: 65.00,
        imageUrl: "https://images.unsplash.com/photo-1550291652-6ea9114a47b1?auto=format&fit=crop&w=800&q=80",
        description: "Norlin era vintage perfection. Original T-Top humbuckers, waffle-back tuners, and chainsaw hardshell case included. Low action, fresh setup with 10-46 strings. Play test available in safe studio.",
        seller: {
            name: "Austin Vintage Gear",
            avatar: "AV",
            rating: 4.9,
            reviewsCount: 312,
            verified: true
        },
        bidHistory: [
            { bidder: "r***7", amount: 2950, time: "12 mins ago" },
            { bidder: "m***0", amount: 2850, time: "45 mins ago" },
            { bidder: "c***3", amount: 2700, time: "2 hours ago" }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 48
    },
    {
        id: "serv-104",
        title: "Master Handyman Services: Drywall, Plumbing, Electrical & Carpentry",
        category: "services",
        format: "service",
        currentPrice: 65, // Hourly rate
        city: "Austin, TX",
        neighborhood: "Greater Austin Metro",
        distanceMiles: 1.5,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
        description: "Licensed & insured local contractor with 15+ years experience. TV mounting, ceiling fans, drywall repair, deck staining, faucet replacement. Free local estimates. Same-day emergency response available.",
        seller: {
            name: "Dave Miller Contracting",
            avatar: "DM",
            rating: 4.9,
            reviewsCount: 164,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 12
    },
    {
        id: "serv-105",
        title: "Nintendo 64 Atomic Purple Console Bundle with 2 Controllers & GoldenEye",
        category: "electronics",
        format: "auction",
        startingPrice: 60,
        currentPrice: 125,
        reservePrice: 100,
        bidsCount: 16,
        endTime: Date.now() + 1000 * 60 * 18, // 18 mins left (very urgent!)
        city: "San Francisco, CA",
        neighborhood: "Mission District",
        distanceMiles: 8.5,
        fulfillment: "both",
        shippingFee: 12.00,
        imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
        description: "Authentic translucent Atomic Purple N64. Expansion Pak installed! Includes OEM power brick, RCA cables, 2 tight joystick controllers, GoldenEye 007 and Super Mario 64. Fully tested and cleaned.",
        seller: {
            name: "RetroBay Collectibles",
            avatar: "RB",
            rating: 4.8,
            reviewsCount: 420,
            verified: true
        },
        bidHistory: [
            { bidder: "g***4", amount: 125, time: "2 mins ago" },
            { bidder: "p***8", amount: 115, time: "8 mins ago" },
            { bidder: "w***9", amount: 105, time: "22 mins ago" }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 30
    },
    {
        id: "serv-106",
        title: "Solid Oak 6-Person Dining Table & Benches - Free Curb Alert!",
        category: "community",
        format: "free_barter",
        currentPrice: 0,
        city: "Austin, TX",
        neighborhood: "Hyde Park",
        distanceMiles: 3.8,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80",
        description: "Moving out this weekend! Heavy solid oak dining table with two matching benches. Sturdy construction, minor surface scratches easily buffed out. Out in the covered driveway, first come first served!",
        seller: {
            name: "Elena Rostova",
            avatar: "ER",
            rating: 5.0,
            reviewsCount: 14,
            verified: false
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 2
    },
    {
        id: "serv-107",
        title: "2018 Toyota RAV4 XLE AWD - 62k Miles, Single Owner, Clean Carfax",
        category: "vehicles",
        format: "buy_now",
        currentPrice: 19800,
        buyItNowPrice: 19800,
        city: "Austin, TX",
        neighborhood: "Round Rock / North Austin",
        distanceMiles: 14.2,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80",
        description: "Super reliable AWD compact SUV. Heated seats, sunroof, blind spot monitor, lane keep assist, backup camera. Recent dealer oil change and brand new Michelin tires. Title in hand.",
        seller: {
            name: "Robert Chen",
            avatar: "RC",
            rating: 4.9,
            reviewsCount: 8,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 72
    },
    {
        id: "serv-108",
        title: "Sunny Furnished 1BR Sublet - South Congress Ave (Nov 1 to Feb 28)",
        category: "housing",
        format: "service",
        currentPrice: 1450, // Per month
        city: "Austin, TX",
        neighborhood: "South Congress / Travis Heights",
        distanceMiles: 1.8,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        description: "Spacious loft-style 1-bedroom apartment right off SoCo. In-unit washer/dryer, high-speed fiber internet, swimming pool access, reserved covered parking. Perfect for remote workers or traveling professionals.",
        seller: {
            name: "Chloe Bennett",
            avatar: "CB",
            rating: 5.0,
            reviewsCount: 6,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 18
    },
    {
        id: "serv-109",
        title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones (Silver, Sealed)",
        category: "electronics",
        format: "buy_now",
        currentPrice: 260,
        buyItNowPrice: 260,
        city: "New York, NY",
        neighborhood: "Brooklyn / Williamsburg",
        distanceMiles: 12.0,
        fulfillment: "both",
        shippingFee: 8.50,
        imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
        description: "Brand new in box, factory plastic seal intact. Industry leading noise cancellation with 30-hour battery life. Won in a company raffle and don't need it. Local cash meetup or ships with tracking.",
        seller: {
            name: "David Kim",
            avatar: "DK",
            rating: 4.9,
            reviewsCount: 54,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 5
    },
    {
        id: "serv-110",
        title: "1989 Vintage Rolex Submariner Ref. 16610 - Box, Papers & Service History",
        category: "collectibles",
        format: "auction",
        startingPrice: 6500,
        currentPrice: 8400,
        reservePrice: 8000,
        bidsCount: 29,
        endTime: Date.now() + 1000 * 60 * 60 * 14, // 14 hours left
        city: "New York, NY",
        neighborhood: "Manhattan / Diamond District",
        distanceMiles: 6.2,
        fulfillment: "both",
        shippingFee: 75.00,
        imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
        description: "Iconic neo-vintage Submariner with tritium dial developing a gorgeous creamy patina. Serviced in 2024 by certified watchmaker. Includes original warranty punch paper, inner/outer box, and extra links.",
        seller: {
            name: "Gotham Timepieces",
            avatar: "GT",
            rating: 5.0,
            reviewsCount: 890,
            verified: true
        },
        bidHistory: [
            { bidder: "w***1", amount: 8400, time: "25 mins ago" },
            { bidder: "e***8", amount: 8250, time: "1 hour ago" },
            { bidder: "s***6", amount: 8000, time: "3 hours ago" }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 96
    },
    {
        id: "serv-111",
        title: "Eco Lawn Care & Garden Spring Cleanup Service",
        category: "services",
        format: "service",
        currentPrice: 45, // Per visit
        city: "Austin, TX",
        neighborhood: "South Austin / Oak Hill",
        distanceMiles: 5.0,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80",
        description: "All electric zero-emissions lawn care! Mowing, edging, weed whacking, leaf blowing, and organic flowerbed mulching. Recurring weekly or bi-weekly slots available. Free quotes over text.",
        seller: {
            name: "GreenThumb ATX",
            avatar: "GT",
            rating: 4.8,
            reviewsCount: 46,
            verified: true
        },
        createdAt: Date.now() - 1000 * 60 * 60 * 24
    },
    {
        id: "serv-112",
        title: "1st Edition Shadowless Charizard Holo (PSA 8 NM-MT)",
        category: "collectibles",
        format: "auction",
        startingPrice: 3500,
        currentPrice: 4650,
        reservePrice: 4500,
        bidsCount: 18,
        endTime: Date.now() + 1000 * 60 * 60 * 1.2, // 1.2 hours left
        city: "Chicago, IL",
        neighborhood: "Loop / West Loop",
        distanceMiles: 18.0,
        fulfillment: "both",
        shippingFee: 35.00,
        imageUrl: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=80",
        description: "Holy grail of vintage Pokémon cards. PSA certified authentic slab 8 NM-MT. Sub-grades and cert verification code visible. Free fully insured signature courier delivery or safe bank vault pickup.",
        seller: {
            name: "Apex Collectibles",
            avatar: "AC",
            rating: 4.9,
            reviewsCount: 512,
            verified: true
        },
        bidHistory: [
            { bidder: "m***3", amount: 4650, time: "8 mins ago" },
            { bidder: "z***0", amount: 4500, time: "30 mins ago" },
            { bidder: "d***5", amount: 4300, time: "1 hour ago" }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 60
    },
    // SEED REQUESTS: GOODS WANTED (BUYER ISO) & SERVICES NEEDED (GIGS WANTED)
    {
        id: "req-201",
        title: "ISO: Herman Miller Sayl or Mirra 2 Ergonomic Desk Chair",
        category: "home",
        format: "request_good",
        isRequest: true,
        requestType: "good",
        budget: 320,
        currentPrice: 320,
        startingPrice: 320,
        urgency: "Within 2-3 Days",
        condition: "Gently Used / Like New",
        city: "Austin, TX",
        neighborhood: "Downtown / South Congress",
        distanceMiles: 2.1,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1580481077195-c3a9927b798b?auto=format&fit=crop&w=800&q=80",
        description: "Setting up a home office in South Congress. Looking for an authentic Herman Miller Sayl or Mirra 2 with adjustable arms and lumbar support. Cash or instant Venmo payment on pickup. Can pick up anywhere in Austin metro.",
        seller: {
            name: "Elena Rostova",
            avatar: "ER",
            rating: 4.9,
            reviewsCount: 14,
            verified: true
        },
        offers: [
            {
                id: "off-1",
                providerName: "OfficeLiquidators ATX",
                providerAvatar: "OL",
                providerRating: 4.9,
                price: 295,
                timeline: "Available Today for Pickup",
                message: "We have two black Herman Miller Sayl chairs in excellent condition from a tech company office downsize. Both inspected, cleaned, and cylinders tested.",
                time: "1 hour ago"
            },
            {
                id: "off-2",
                providerName: "David K.",
                providerAvatar: "DK",
                providerRating: 5.0,
                price: 310,
                timeline: "Can deliver tomorrow",
                message: "Selling my mineral grey Mirra 2 with forward tilt limiter and PostureFit. Only 1 year old, smoke-free home.",
                time: "3 hours ago"
            }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 14
    },
    {
        id: "req-202",
        title: "Need Licensed Electrician: Install 240V NEMA 14-50 EV Charger in Garage",
        category: "services",
        format: "request_service",
        isRequest: true,
        requestType: "service",
        budget: 400,
        currentPrice: 400,
        startingPrice: 400,
        urgency: "ASAP (Within 24 Hours)",
        city: "Austin, TX",
        neighborhood: "Mueller / East Austin",
        distanceMiles: 3.8,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1558441719-756184518e11?auto=format&fit=crop&w=800&q=80",
        description: "Just took delivery of a Tesla Model Y and need a dedicated 50-amp 240V circuit installed with industrial NEMA 14-50 receptacle in garage. Main 200A breaker panel is located right on the exterior garage wall (short run, under 15 feet). Need licensed TECL electrician.",
        seller: {
            name: "Robert Chen",
            avatar: "RC",
            rating: 5.0,
            reviewsCount: 22,
            verified: true
        },
        offers: [
            {
                id: "off-3",
                providerName: "SparkMaster Electric (Dave M.)",
                providerAvatar: "SM",
                providerRating: 4.9,
                price: 380,
                timeline: "Tomorrow Morning (9:00 AM)",
                message: "TECL #28410 master electrician. Short run under 15ft is very straightforward. Price includes 50A Square D breaker, 6/3 Romex copper, and Bryant industrial-grade receptacle. City permit & inspection ready.",
                time: "35 mins ago"
            }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 6
    },
    {
        id: "req-203",
        title: "Wanted: 2021+ Apple iPad Air (M1) or iPad Mini 6 with Apple Pencil 2",
        category: "electronics",
        format: "request_good",
        isRequest: true,
        requestType: "good",
        budget: 450,
        currentPrice: 450,
        startingPrice: 450,
        urgency: "Within 2-3 Days",
        condition: "Gently Used / Like New",
        city: "Austin, TX",
        neighborhood: "Barton Springs / Zilker",
        distanceMiles: 1.8,
        fulfillment: "both",
        imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
        description: "Needed for university digital note-taking and architecture sketching. Looking for either an iPad Air 5th gen (M1) or iPad Mini 6. Prefer 64GB or 256GB with healthy battery. Must include charger and ideally Apple Pencil 2. Safe exchange zone meetup.",
        seller: {
            name: "Chloe Martinez",
            avatar: "CM",
            rating: 4.8,
            reviewsCount: 9,
            verified: true
        },
        offers: [
            {
                id: "off-4",
                providerName: "TechTrader ATX",
                providerAvatar: "TT",
                providerRating: 5.0,
                price: 420,
                timeline: "Can meet this evening",
                message: "Have a Space Gray iPad Air 5 (M1, 64GB) with Apple Pencil 2 and Apple Smart Folio case. Battery health 98% with 42 cycles. Includes original boxes.",
                time: "18 mins ago"
            }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 18
    },
    {
        id: "req-204",
        title: "Mobile Auto Detailer Wanted: Full Interior Steam Clean & Pet Hair Removal",
        category: "services",
        format: "request_service",
        isRequest: true,
        requestType: "service",
        budget: 160,
        currentPrice: 160,
        startingPrice: 160,
        urgency: "This Week",
        city: "Austin, TX",
        neighborhood: "North Loop / Hyde Park",
        distanceMiles: 4.5,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80",
        description: "2019 Subaru Outback needs a thorough interior clean before a cross-country family road trip. Needs carpet shampoo, seat hot water extraction, steam vent disinfection, and leather UV conditioning. Have driveway with water hose and power outlet ready.",
        seller: {
            name: "Daniel Vance",
            avatar: "DV",
            rating: 4.9,
            reviewsCount: 16,
            verified: true
        },
        offers: [],
        createdAt: Date.now() - 1000 * 60 * 60 * 32
    },
    {
        id: "req-205",
        title: "ISO: Vintage Technics SL-1200MK2 Direct Drive Turntable",
        category: "collectibles",
        format: "request_good",
        isRequest: true,
        requestType: "good",
        budget: 650,
        currentPrice: 650,
        startingPrice: 650,
        urgency: "Flexible / Anytime",
        condition: "Any Condition",
        city: "San Francisco, CA",
        neighborhood: "Mission District",
        distanceMiles: 2.8,
        fulfillment: "both",
        imageUrl: "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80",
        description: "Audiophile and vinyl enthusiast looking for an authentic Technics SL-1200MK2 or MK3. Must have pitch fader accurate with zero center click drift and solid tonearm bearings. Cosmetic scratches are fine. Willing to pay cash or escrow.",
        seller: {
            name: "Mateo Silva",
            avatar: "MS",
            rating: 5.0,
            reviewsCount: 45,
            verified: true
        },
        offers: [
            {
                id: "off-5",
                providerName: "Bay Vinyl & Audio",
                providerAvatar: "BV",
                providerRating: 4.9,
                price: 620,
                timeline: "Available in Mission studio",
                message: "Fully serviced MK2 with new Mogami RCA cables and internal grounding done. Ortofon Pro S cartridge included. Play test ready.",
                time: "4 hours ago"
            }
        ],
        createdAt: Date.now() - 1000 * 60 * 60 * 40
    },
    {
        id: "req-206",
        title: "Emergency Drywall & Ceiling Plaster Patch After Bathroom Leak",
        category: "services",
        format: "request_service",
        isRequest: true,
        requestType: "service",
        budget: 280,
        currentPrice: 280,
        startingPrice: 280,
        urgency: "ASAP (Within 24 Hours)",
        city: "New York, NY",
        neighborhood: "Brooklyn (Williamsburg)",
        distanceMiles: 3.1,
        fulfillment: "pickup",
        imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
        description: "Upstairs tenant pipe leak caused a 2ft x 2ft drywall ceiling cutout in living room. Plumbing is fully repaired and framing is 100% dry. Need drywall patch board, mesh tape, mudding, and smooth level 4 skim coat ready for primer.",
        seller: {
            name: "Liam O'Connor",
            avatar: "LO",
            rating: 4.9,
            reviewsCount: 38,
            verified: true
        },
        offers: [],
        createdAt: Date.now() - 1000 * 60 * 60 * 10
    }
];

// SAMPLE PHOTOS FOR POSTING MODAL
const SAMPLE_PRESET_PHOTOS = [
    { label: "Electronics / Laptop", url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80" },
    { label: "Phone / Tech", url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80" },
    { label: "Furniture", url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80" },
    { label: "Vintage / Collectibles", url: "https://images.unsplash.com/photo-1550291652-6ea9114a47b1?auto=format&fit=crop&w=800&q=80" },
    { label: "Tools / Services", url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80" },
    { label: "Vehicles / Car", url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80" }
];

// ============================================================================
// APPLICATION STATE
// ============================================================================

class ServlistApp {
    constructor() {
        this.listings = [];
        this.watchlist = new Set();
        this.myBids = {}; // { [listingId]: { amount, status, time } }
        this.myRequests = new Set(); // set of request ids posted by user
        this.myQuotes = {}; // { [listingId]: { quoteId, price, timeline, message, time, itemTitle } }
        this.currentListingDetail = null;

        this.marketMode = "all"; // 'all' | 'supply' | 'requests'

        this.filters = {
            city: "Austin, TX",
            category: "all",
            formatPill: "all",
            formatCheckboxes: ["auction", "buy_now", "service", "free_barter", "request_good", "request_service"],
            fulfillmentCheckboxes: ["pickup", "shipping"],
            radius: 25,
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
        this.loadStorage();
        this.bindEvents();
        this.renderCategoryCounts();
        this.renderPresetPhotos();
        this.renderListings();
        this.updateTopBarStats();
        this.startTimerTicker();
    }

    // Storage Handling
    loadStorage() {
        try {
            const savedListings = localStorage.getItem("servlist_items");
            if (savedListings) {
                this.listings = JSON.parse(savedListings);
                // Ensure seed requests are populated if missing in older storage
                const hasRequests = this.listings.some(l => l.isRequest || (l.format && l.format.startsWith("request_")));
                if (!hasRequests) {
                    const seedRequests = SEED_LISTINGS.filter(l => l.isRequest);
                    this.listings = [...this.listings, ...seedRequests];
                    this.saveListings();
                }
            } else {
                this.listings = [...SEED_LISTINGS];
                this.saveListings();
            }

            const savedWatchlist = localStorage.getItem("servlist_watchlist");
            if (savedWatchlist) {
                this.watchlist = new Set(JSON.parse(savedWatchlist));
            }

            const savedBids = localStorage.getItem("servlist_my_bids");
            if (savedBids) {
                this.myBids = JSON.parse(savedBids);
            }

            const savedRequests = localStorage.getItem("servlist_my_requests");
            if (savedRequests) {
                this.myRequests = new Set(JSON.parse(savedRequests));
            }

            const savedQuotes = localStorage.getItem("servlist_my_quotes");
            if (savedQuotes) {
                this.myQuotes = JSON.parse(savedQuotes);
            }
        } catch (e) {
            console.warn("Storage error, fallback to seeds", e);
            this.listings = [...SEED_LISTINGS];
        }
    }

    saveListings() {
        localStorage.setItem("servlist_items", JSON.stringify(this.listings));
    }

    saveWatchlist() {
        localStorage.setItem("servlist_watchlist", JSON.stringify(Array.from(this.watchlist)));
        this.updateWatchlistBadges();
    }

    saveMyBids() {
        localStorage.setItem("servlist_my_bids", JSON.stringify(this.myBids));
        this.updateMyBidsBadges();
    }

    saveMyRequests() {
        localStorage.setItem("servlist_my_requests", JSON.stringify(Array.from(this.myRequests)));
        this.updateMyRequestsBadges();
    }

    saveMyQuotes() {
        localStorage.setItem("servlist_my_quotes", JSON.stringify(this.myQuotes));
        this.updateMyQuotesBadges();
    }

    // ============================================================================
    // EVENT BINDINGS
    // ============================================================================
    bindEvents() {
        // City Selector
        const citySelector = document.getElementById("citySelector");
        if (citySelector) {
            citySelector.value = this.filters.city;
            citySelector.addEventListener("change", (e) => {
                this.filters.city = e.target.value;
                this.showToast(`Switched market to ${this.filters.city}`, "info");
                this.renderListings();
                this.renderCategoryCounts();
            });
        }

        // Header Category Dropdown
        const headerCat = document.getElementById("headerCategorySelect");
        if (headerCat) {
            headerCat.addEventListener("change", (e) => {
                this.setCategory(e.target.value);
            });
        }

        // Search Omnibar
        const searchInput = document.getElementById("searchInput");
        const clearSearchBtn = document.getElementById("clearSearchBtn");
        const searchBtn = document.getElementById("searchSubmitBtn");

        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.filters.searchQuery = e.target.value.trim();
                clearSearchBtn.style.display = this.filters.searchQuery ? "block" : "none";
                this.renderListings();
            });
            searchInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    this.renderListings();
                }
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener("click", () => {
                searchInput.value = "";
                this.filters.searchQuery = "";
                clearSearchBtn.style.display = "none";
                this.renderListings();
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener("click", () => {
                this.renderListings();
            });
        }

        // Format Pills Bar
        const formatPills = document.querySelectorAll("#formatPills .pill-btn");
        formatPills.forEach(pill => {
            pill.addEventListener("click", () => {
                formatPills.forEach(p => p.classList.remove("active"));
                pill.classList.add("active");
                this.filters.formatPill = pill.dataset.format;
                this.renderListings();
            });
        });

        // Marketplace Mode Switcher (All Market vs For Sale vs Requests)
        const marketModeBtns = document.querySelectorAll("#marketModeControl .mode-seg-btn");
        marketModeBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                marketModeBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.marketMode = btn.dataset.marketMode;
                this.renderListings();
            });
        });

        // Sidebar Category Tree
        const catItems = document.querySelectorAll("#categoryTree .category-item");
        catItems.forEach(item => {
            item.addEventListener("click", () => {
                this.setCategory(item.dataset.cat);
            });
        });

        // Sidebar Format Checkboxes
        const formatChecks = document.querySelectorAll("input[name='formatFilter']");
        formatChecks.forEach(cb => {
            cb.addEventListener("change", () => {
                this.filters.formatCheckboxes = Array.from(formatChecks)
                    .filter(c => c.checked)
                    .map(c => c.value);
                this.renderListings();
            });
        });

        // Sidebar Fulfillment Checkboxes
        const fulfillChecks = document.querySelectorAll("input[name='fulfillmentFilter']");
        fulfillChecks.forEach(cb => {
            cb.addEventListener("change", () => {
                this.filters.fulfillmentCheckboxes = Array.from(fulfillChecks)
                    .filter(c => c.checked)
                    .map(c => c.value);
                this.renderListings();
            });
        });

        // Local Radius Slider
        const radiusSlider = document.getElementById("radiusRange");
        const radiusLabel = document.getElementById("radiusValueLabel");
        if (radiusSlider && radiusLabel) {
            radiusSlider.addEventListener("input", (e) => {
                const val = e.target.value;
                this.filters.radius = parseInt(val, 10);
                radiusLabel.textContent = `Within ${val} miles`;
                this.renderListings();
            });
        }

        // Price Filter Apply
        const applyPriceBtn = document.getElementById("applyPriceBtn");
        const minPriceInput = document.getElementById("minPriceInput");
        const maxPriceInput = document.getElementById("maxPriceInput");
        if (applyPriceBtn) {
            applyPriceBtn.addEventListener("click", () => {
                this.filters.minPrice = minPriceInput.value ? parseFloat(minPriceInput.value) : null;
                this.filters.maxPrice = maxPriceInput.value ? parseFloat(maxPriceInput.value) : null;
                this.renderListings();
            });
        }

        // Reset Filters Button
        const resetFiltersBtn = document.getElementById("resetFiltersBtn");
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener("click", () => this.resetFilters());
        }

        const resetAllEmptyBtn = document.getElementById("resetAllEmptyBtn");
        if (resetAllEmptyBtn) {
            resetAllEmptyBtn.addEventListener("click", () => this.resetFilters());
        }

        // Sort Selector
        const sortSelector = document.getElementById("sortSelector");
        if (sortSelector) {
            sortSelector.addEventListener("change", (e) => {
                this.sortMode = e.target.value;
                this.renderListings();
            });
        }

        // View Mode Toggles (Grid vs List)
        const viewGridBtn = document.getElementById("viewGridBtn");
        const viewListBtn = document.getElementById("viewListBtn");
        if (viewGridBtn && viewListBtn) {
            viewGridBtn.addEventListener("click", () => {
                this.viewMode = "grid";
                viewGridBtn.classList.add("active");
                viewListBtn.classList.remove("active");
                const container = document.getElementById("listingsContainer");
                container.className = "listings-container grid-mode";
            });
            viewListBtn.addEventListener("click", () => {
                this.viewMode = "list";
                viewListBtn.classList.add("active");
                viewGridBtn.classList.remove("active");
                const container = document.getElementById("listingsContainer");
                container.className = "listings-container list-mode";
            });
        }

        // Brand Logo Reset
        const logoReset = document.getElementById("logoReset");
        if (logoReset) {
            logoReset.addEventListener("click", (e) => {
                e.preventDefault();
                this.resetFilters();
            });
        }

        // Post Listing / Request Modal triggers
        const openPostModalBtn = document.getElementById("openPostModalBtn");
        const openRequestModalBtn = document.getElementById("openRequestModalBtn");
        const postFromEmptyBtn = document.getElementById("postFromEmptyBtn");
        const closePostModalBtn = document.getElementById("closePostModalBtn");
        const cancelPostBtn = document.getElementById("cancelPostBtn");
        const cancelReqBtn = document.getElementById("cancelReqBtn");
        const postModalOverlay = document.getElementById("postModalOverlay");

        const modalTabSell = document.getElementById("modalTabSell");
        const modalTabRequest = document.getElementById("modalTabRequest");
        const postListingForm = document.getElementById("postListingForm");
        const postRequestForm = document.getElementById("postRequestForm");
        const postModalTitle = document.getElementById("postModalTitle");
        const postModalSubtitle = document.getElementById("postModalSubtitle");

        const switchModalTab = (tab) => {
            if (tab === "request") {
                if (modalTabRequest) modalTabRequest.classList.add("active");
                if (modalTabSell) modalTabSell.classList.remove("active");
                if (postRequestForm) postRequestForm.style.display = "block";
                if (postListingForm) postListingForm.style.display = "none";
                if (postModalTitle) postModalTitle.textContent = "Post a Request for Good or Service";
                if (postModalSubtitle) postModalSubtitle.textContent = "Tell verified local sellers and providers what item you want to buy or what service you need.";
            } else {
                if (modalTabSell) modalTabSell.classList.add("active");
                if (modalTabRequest) modalTabRequest.classList.remove("active");
                if (postListingForm) postListingForm.style.display = "block";
                if (postRequestForm) postRequestForm.style.display = "none";
                if (postModalTitle) postModalTitle.textContent = "Post a Listing on Servlist";
                if (postModalSubtitle) postModalSubtitle.textContent = "Choose between an eBay-style timed auction, fixed price Buy-It-Now, or Craigslist local classified / gig.";
            }
        };

        if (modalTabSell) modalTabSell.addEventListener("click", () => switchModalTab("sell"));
        if (modalTabRequest) modalTabRequest.addEventListener("click", () => switchModalTab("request"));

        const openPostModal = (tab = "sell") => {
            switchModalTab(tab);
            postModalOverlay.style.display = "flex";
            document.body.style.overflow = "hidden";
        };
        const closePostModal = () => {
            postModalOverlay.style.display = "none";
            document.body.style.overflow = "auto";
        };

        if (openPostModalBtn) openPostModalBtn.addEventListener("click", () => openPostModal("sell"));
        if (openRequestModalBtn) openRequestModalBtn.addEventListener("click", () => openPostModal("request"));
        if (postFromEmptyBtn) postFromEmptyBtn.addEventListener("click", () => openPostModal("sell"));
        if (closePostModalBtn) closePostModalBtn.addEventListener("click", closePostModal);
        if (cancelPostBtn) cancelPostBtn.addEventListener("click", closePostModal);
        if (cancelReqBtn) cancelReqBtn.addEventListener("click", closePostModal);

        // Post Listing Format Radio Change
        const postFormatRadios = document.querySelectorAll("input[name='postFormat']");
        postFormatRadios.forEach(radio => {
            radio.addEventListener("change", (e) => {
                this.adjustPostModalFields(e.target.value);
            });
        });

        // Request Type Radios Change (Good vs Service)
        const reqTypeRadios = document.querySelectorAll("input[name='requestType']");
        reqTypeRadios.forEach(radio => {
            radio.addEventListener("change", (e) => {
                const val = e.target.value;
                const reqTitleLabel = document.getElementById("reqTitleLabel");
                const reqTitleInput = document.getElementById("reqTitle");
                const reqBudgetLabel = document.getElementById("reqBudgetLabel");
                const reqRateTypeGroup = document.getElementById("reqRateTypeGroup");
                const reqConditionGroup = document.getElementById("reqConditionGroup");
                const reqCategory = document.getElementById("reqCategory");

                if (val === "good") {
                    if (reqTitleLabel) reqTitleLabel.innerHTML = 'Request Title / Item Wanted <span class="required">*</span>';
                    if (reqTitleInput) reqTitleInput.placeholder = 'e.g. ISO: Herman Miller Aeron Chair (Size B) or 2021 MacBook Pro';
                    if (reqBudgetLabel) reqBudgetLabel.innerHTML = 'Target / Max Budget ($) <span class="required">*</span>';
                    if (reqRateTypeGroup) reqRateTypeGroup.style.display = 'none';
                    if (reqConditionGroup) reqConditionGroup.style.display = 'block';
                    if (reqCategory && reqCategory.value === "services") reqCategory.value = "electronics";
                } else {
                    if (reqTitleLabel) reqTitleLabel.innerHTML = 'Service or Task Needed <span class="required">*</span>';
                    if (reqTitleInput) reqTitleInput.placeholder = 'e.g. Need: Licensed Electrician for EV Charger or House Deep Cleaning';
                    if (reqBudgetLabel) reqBudgetLabel.innerHTML = 'Estimated Job Budget ($) <span class="required">*</span>';
                    if (reqRateTypeGroup) reqRateTypeGroup.style.display = 'block';
                    if (reqConditionGroup) reqConditionGroup.style.display = 'none';
                    if (reqCategory) reqCategory.value = "services";
                }
            });
        });

        // Post Listing Form Submit
        if (postListingForm) {
            postListingForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleCreateListing();
                closePostModal();
            });
        }

        // Post Request Form Submit
        if (postRequestForm) {
            postRequestForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleCreateRequest();
                closePostModal();
            });
        }

        // Detail Modal Close
        const detailOverlay = document.getElementById("detailModalOverlay");
        const closeDetailBtn = document.getElementById("closeDetailModalBtn");
        if (closeDetailBtn && detailOverlay) {
            closeDetailBtn.addEventListener("click", () => {
                detailOverlay.style.display = "none";
                document.body.style.overflow = "auto";
                this.currentListingDetail = null;
            });
            detailOverlay.addEventListener("click", (e) => {
                if (e.target === detailOverlay) {
                    detailOverlay.style.display = "none";
                    document.body.style.overflow = "auto";
                    this.currentListingDetail = null;
                }
            });
        }

        // Watchlist / My Bids / My Requests / My Quotes Drawer
        const viewWatchlistBtn = document.getElementById("viewWatchlistBtn");
        const viewMyBidsBtn = document.getElementById("viewMyBidsBtn");
        const viewMyRequestsBtn = document.getElementById("viewMyRequestsBtn");
        const footerWatchlistLink = document.getElementById("footerWatchlistLink");
        const footerBidsLink = document.getElementById("footerBidsLink");
        const footerRequestsLink = document.getElementById("footerRequestsLink");
        const drawerOverlay = document.getElementById("drawerModalOverlay");
        const closeDrawerBtn = document.getElementById("closeDrawerBtn");
        const tabWatchlist = document.getElementById("tabWatchlist");
        const tabMyBids = document.getElementById("tabMyBids");
        const tabMyRequests = document.getElementById("tabMyRequests");
        const tabMyQuotes = document.getElementById("tabMyQuotes");

        const drawerTabList = [
            { el: tabWatchlist, name: "watchlist" },
            { el: tabMyBids, name: "my_bids" },
            { el: tabMyRequests, name: "my_requests" },
            { el: tabMyQuotes, name: "my_quotes" }
        ];

        const openDrawer = (tab) => {
            this.activeDrawerTab = tab;
            drawerTabList.forEach(t => {
                if (t.el) {
                    if (t.name === tab) t.el.classList.add("active");
                    else t.el.classList.remove("active");
                }
            });
            this.renderDrawer();
            drawerOverlay.style.display = "block";
            document.body.style.overflow = "hidden";
        };

        const closeDrawer = () => {
            drawerOverlay.style.display = "none";
            document.body.style.overflow = "auto";
        };

        if (viewWatchlistBtn) viewWatchlistBtn.addEventListener("click", () => openDrawer("watchlist"));
        if (viewMyBidsBtn) viewMyBidsBtn.addEventListener("click", () => openDrawer("my_bids"));
        if (viewMyRequestsBtn) viewMyRequestsBtn.addEventListener("click", () => openDrawer("my_requests"));
        if (footerWatchlistLink) footerWatchlistLink.addEventListener("click", (e) => { e.preventDefault(); openDrawer("watchlist"); });
        if (footerBidsLink) footerBidsLink.addEventListener("click", (e) => { e.preventDefault(); openDrawer("my_bids"); });
        if (footerRequestsLink) footerRequestsLink.addEventListener("click", (e) => { e.preventDefault(); openDrawer("my_requests"); });
        if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", closeDrawer);
        if (drawerOverlay) {
            drawerOverlay.addEventListener("click", (e) => {
                if (e.target === drawerOverlay) closeDrawer();
            });
        }

        drawerTabList.forEach(t => {
            if (t.el) {
                t.el.addEventListener("click", () => openDrawer(t.name));
            }
        });

        // Contact Seller Modal
        const btnContactSeller = document.getElementById("btnContactSeller");
        const chatModalOverlay = document.getElementById("chatModalOverlay");
        const closeChatModalBtn = document.getElementById("closeChatModalBtn");
        const chatForm = document.getElementById("chatForm");

        if (btnContactSeller) {
            btnContactSeller.addEventListener("click", () => {
                if (!this.currentListingDetail) return;
                document.getElementById("chatSellerName").textContent = this.currentListingDetail.seller.name;
                document.getElementById("chatItemTitle").textContent = this.currentListingDetail.title;
                chatModalOverlay.style.display = "flex";
            });
        }

        if (closeChatModalBtn) {
            closeChatModalBtn.addEventListener("click", () => {
                chatModalOverlay.style.display = "none";
            });
        }

        // Quick chat message chips
        const chatChips = document.querySelectorAll(".btn-chat-chip");
        const chatInput = document.getElementById("chatInput");
        chatChips.forEach(chip => {
            chip.addEventListener("click", () => {
                if (chatInput) {
                    chatInput.value = chip.dataset.template;
                    chatInput.focus();
                }
            });
        });

        if (chatForm) {
            chatForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const msg = chatInput.value.trim();
                if (!msg) return;

                const msgContainer = document.getElementById("chatMessages");
                const newMsg = document.createElement("div");
                newMsg.className = "chat-msg msg-sent";
                newMsg.innerHTML = `
                    <div class="msg-bubble">${this.escapeHtml(msg)}</div>
                    <span class="msg-time">Just now</span>
                `;
                msgContainer.appendChild(newMsg);
                msgContainer.scrollTop = msgContainer.scrollHeight;
                chatInput.value = "";

                this.showToast("Message sent to seller!", "success");

                // Auto seller reply simulation after 2 seconds
                setTimeout(() => {
                    const replyMsg = document.createElement("div");
                    replyMsg.className = "chat-msg msg-received";
                    replyMsg.innerHTML = `
                        <div class="msg-bubble">Thanks for reaching out! Yes, let's schedule a time or complete via escrow. I am available today.</div>
                        <span class="msg-time">Just now</span>
                    `;
                    msgContainer.appendChild(replyMsg);
                    msgContainer.scrollTop = msgContainer.scrollHeight;
                }, 2000);
            });
        }

        // Footer City Links
        const footerCityLinks = document.querySelectorAll(".footer-city-link");
        footerCityLinks.forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const city = link.dataset.city;
                if (citySelector) citySelector.value = city;
                this.filters.city = city;
                this.renderListings();
                this.renderCategoryCounts();
                window.scrollTo({ top: 0, behavior: "smooth" });
                this.showToast(`Switched market to ${city}`, "info");
            });
        });

        // Footer Filter Links
        const footerFilterLinks = document.querySelectorAll(".footer-filter-link");
        footerFilterLinks.forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const fType = link.dataset.filterType;
                const fVal = link.dataset.val;
                if (fType === "category") {
                    this.setCategory(fVal);
                } else if (fType === "format") {
                    const targetPill = document.querySelector(`#formatPills .pill-btn[data-format="${fVal}"]`);
                    if (targetPill) targetPill.click();
                }
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });

        // Newsletter Demo
        const newsletterBtn = document.getElementById("newsletterBtn");
        const newsletterInput = document.getElementById("newsletterInput");
        if (newsletterBtn && newsletterInput) {
            newsletterBtn.addEventListener("click", () => {
                if (newsletterInput.value) {
                    this.showToast("Subscribed to local auction alerts!", "success");
                    newsletterInput.value = "";
                }
            });
        }
    }

    setCategory(cat) {
        this.filters.category = cat;

        // Sync header dropdown
        const headerCat = document.getElementById("headerCategorySelect");
        if (headerCat) headerCat.value = cat;

        // Sync sidebar tree
        const catItems = document.querySelectorAll("#categoryTree .category-item");
        catItems.forEach(item => {
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
            city: "Austin, TX",
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
        if (citySelector) citySelector.value = "Austin, TX";

        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.value = "";

        const clearSearchBtn = document.getElementById("clearSearchBtn");
        if (clearSearchBtn) clearSearchBtn.style.display = "none";

        const minPriceInput = document.getElementById("minPriceInput");
        const maxPriceInput = document.getElementById("maxPriceInput");
        if (minPriceInput) minPriceInput.value = "";
        if (maxPriceInput) maxPriceInput.value = "";

        const radiusSlider = document.getElementById("radiusRange");
        const radiusLabel = document.getElementById("radiusValueLabel");
        if (radiusSlider) radiusSlider.value = 50;
        if (radiusLabel) radiusLabel.textContent = "Within 50 miles";

        // Reset market mode switch
        const marketModeBtns = document.querySelectorAll("#marketModeControl .mode-seg-btn");
        marketModeBtns.forEach(b => b.classList.remove("active"));
        if (marketModeBtns[0]) marketModeBtns[0].classList.add("active");

        // Reset format pills
        const formatPills = document.querySelectorAll("#formatPills .pill-btn");
        formatPills.forEach(p => p.classList.remove("active"));
        if (formatPills[0]) formatPills[0].classList.add("active");

        // Reset checkboxes
        document.querySelectorAll("input[name='formatFilter']").forEach(c => c.checked = true);
        document.querySelectorAll("input[name='fulfillmentFilter']").forEach(c => c.checked = true);

        this.setCategory("all");
        this.showToast("All filters have been reset", "info");
    }

    adjustPostModalFields(format) {
        const startPriceGroup = document.getElementById("startPriceGroup");
        const priceLabel = document.getElementById("priceInputLabel");
        const auctionDurationGroup = document.getElementById("auctionDurationGroup");
        const reservePriceGroup = document.getElementById("reservePriceGroup");

        if (format === "auction") {
            startPriceGroup.style.display = "flex";
            priceLabel.innerHTML = `Starting Bid ($) <span class="required">*</span>`;
            auctionDurationGroup.style.display = "flex";
            reservePriceGroup.style.display = "flex";
        } else if (format === "buy_now") {
            startPriceGroup.style.display = "flex";
            priceLabel.innerHTML = `Fixed Price ($) <span class="required">*</span>`;
            auctionDurationGroup.style.display = "none";
            reservePriceGroup.style.display = "none";
        } else if (format === "service") {
            startPriceGroup.style.display = "flex";
            priceLabel.innerHTML = `Hourly or Flat Rate ($) <span class="required">*</span>`;
            auctionDurationGroup.style.display = "none";
            reservePriceGroup.style.display = "none";
        } else if (format === "free_barter") {
            startPriceGroup.style.display = "none";
            auctionDurationGroup.style.display = "none";
            reservePriceGroup.style.display = "none";
        }
    }

    renderPresetPhotos() {
        // Preset photos for Selling modal
        const container = document.getElementById("samplePhotosList");
        if (container) {
            container.innerHTML = SAMPLE_PRESET_PHOTOS.map((photo, idx) => `
                <img src="${photo.url}" alt="${photo.label}" class="sample-photo-thumb" data-url="${photo.url}" title="${photo.label}">
            `).join("");

            container.querySelectorAll(".sample-photo-thumb").forEach(img => {
                img.addEventListener("click", () => {
                    container.querySelectorAll(".sample-photo-thumb").forEach(i => i.classList.remove("selected"));
                    img.classList.add("selected");
                    const urlInput = document.getElementById("postImageUrl");
                    if (urlInput) urlInput.value = img.dataset.url;
                });
            });
        }

        // Preset photos for Request modal
        const reqContainer = document.getElementById("reqSamplePhotosList");
        if (reqContainer) {
            reqContainer.innerHTML = SAMPLE_PRESET_PHOTOS.map((photo, idx) => `
                <img src="${photo.url}" alt="${photo.label}" class="sample-photo-thumb" data-url="${photo.url}" title="${photo.label}">
            `).join("");

            reqContainer.querySelectorAll(".sample-photo-thumb").forEach(img => {
                img.addEventListener("click", () => {
                    reqContainer.querySelectorAll(".sample-photo-thumb").forEach(i => i.classList.remove("selected"));
                    img.classList.add("selected");
                    const urlInput = document.getElementById("reqImageUrl");
                    if (urlInput) urlInput.value = img.dataset.url;
                });
            });
        }
    }

    // ============================================================================
    // LISTING FILTERING, SORTING & RENDERING
    // ============================================================================

    getFilteredListings() {
        return this.listings.filter(item => {
            const isReq = Boolean(item.isRequest || (item.format && item.format.startsWith("request_")));

            // Market Mode check (all, supply, requests)
            if (this.marketMode === "supply" && isReq) return false;
            if (this.marketMode === "requests" && !isReq) return false;

            // City check
            if (this.filters.city !== "Nationwide") {
                if (item.city !== this.filters.city && item.city !== "Nationwide") {
                    return false;
                }
            }

            // Category check
            if (this.filters.category !== "all" && item.category !== this.filters.category) {
                return false;
            }

            // Quick Format Pill check
            if (this.filters.formatPill === "auction" && item.format !== "auction") return false;
            if (this.filters.formatPill === "buy_now" && item.format !== "buy_now") return false;
            if (this.filters.formatPill === "local_only" && item.fulfillment !== "pickup") return false;
            if (this.filters.formatPill === "service" && item.format !== "service") return false;
            if (this.filters.formatPill === "free_barter" && item.format !== "free_barter") return false;
            if (this.filters.formatPill === "requests" && !isReq) return false;

            // Sidebar Format Checkboxes
            if (!this.filters.formatCheckboxes.includes(item.format)) {
                return false;
            }

            // Sidebar Fulfillment Checkboxes
            const matchPickup = this.filters.fulfillmentCheckboxes.includes("pickup") && (item.fulfillment === "pickup" || item.fulfillment === "both");
            const matchShipping = this.filters.fulfillmentCheckboxes.includes("shipping") && (item.fulfillment === "shipping" || item.fulfillment === "both");
            if (!matchPickup && !matchShipping) {
                return false;
            }

            // Radius check
            if (item.distanceMiles && item.distanceMiles > this.filters.radius) {
                return false;
            }

            // Price checks (handles currentPrice or target budget)
            const price = item.budget !== undefined ? item.budget : (item.currentPrice || 0);
            if (this.filters.minPrice !== null && price < this.filters.minPrice) return false;
            if (this.filters.maxPrice !== null && price > this.filters.maxPrice) return false;

            // Search Query
            if (this.filters.searchQuery) {
                const q = this.filters.searchQuery.toLowerCase();
                const titleMatch = item.title && item.title.toLowerCase().includes(q);
                const descMatch = item.description && item.description.toLowerCase().includes(q);
                const neighMatch = item.neighborhood && item.neighborhood.toLowerCase().includes(q);
                const reqTypeMatch = item.requestType && item.requestType.toLowerCase().includes(q);
                if (!titleMatch && !descMatch && !neighMatch && !reqTypeMatch) {
                    return false;
                }
            }

            return true;
        });
    }

    sortListings(items) {
        return [...items].sort((a, b) => {
            const aPrice = a.budget !== undefined ? a.budget : (a.currentPrice || 0);
            const bPrice = b.budget !== undefined ? b.budget : (b.currentPrice || 0);

            if (this.sortMode === "ending_soon") {
                const aTime = a.endTime || (a.isRequest ? Infinity - 100 : Infinity);
                const bTime = b.endTime || (b.isRequest ? Infinity - 100 : Infinity);
                return aTime - bTime;
            } else if (this.sortMode === "newest") {
                return (b.createdAt || 0) - (a.createdAt || 0);
            } else if (this.sortMode === "price_low") {
                return aPrice - bPrice;
            } else if (this.sortMode === "price_high") {
                return bPrice - aPrice;
            } else if (this.sortMode === "most_bids") {
                const aActivity = (a.offers ? a.offers.length : 0) + (a.bidsCount || 0);
                const bActivity = (b.offers ? b.offers.length : 0) + (b.bidsCount || 0);
                return bActivity - aActivity;
            } else if (this.sortMode === "distance") {
                return (a.distanceMiles || 0) - (b.distanceMiles || 0);
            }
            return 0;
        });
    }

    renderListings() {
        const rawFiltered = this.getFilteredListings();
        const sorted = this.sortListings(rawFiltered);

        const container = document.getElementById("listingsContainer");
        const emptyState = document.getElementById("emptyState");
        const resultsCountText = document.getElementById("resultsCountText");
        const resultsHeading = document.getElementById("resultsHeading");
        const emptyCityName = document.getElementById("emptyCityName");

        // Update results meta
        if (resultsCountText) {
            resultsCountText.textContent = `Showing ${sorted.length} item${sorted.length === 1 ? "" : "s"} in ${this.filters.city}`;
        }
        if (resultsHeading) {
            if (this.filters.category !== "all") {
                resultsHeading.textContent = `${this.capitalize(this.filters.category)} in ${this.filters.city}`;
            } else if (this.filters.formatPill === "auction") {
                resultsHeading.textContent = `Live Auctions Ending Soon in ${this.filters.city}`;
            } else {
                resultsHeading.textContent = `All Current Listings &bull; ${this.filters.city}`;
            }
        }
        if (emptyCityName) {
            emptyCityName.textContent = this.filters.city;
        }

        // Render applied chips
        this.renderAppliedChips();

        if (sorted.length === 0) {
            container.innerHTML = "";
            emptyState.style.display = "flex";
            return;
        }

        emptyState.style.display = "none";

        container.innerHTML = sorted.map(item => this.buildCardHtml(item)).join("");

        // Attach Card Interactions
        container.querySelectorAll(".listing-card").forEach(card => {
            const id = card.dataset.id;
            
            // Open detail on card click
            card.addEventListener("click", (e) => {
                // If clicked watchlist button, do not open detail modal
                if (e.target.closest(".card-watchlist-btn")) return;
                this.openDetailModal(id);
            });

            // Watchlist toggle
            const watchBtn = card.querySelector(".card-watchlist-btn");
            if (watchBtn) {
                watchBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
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
            request_good: "🔍 WANTED GOOD",
            request_service: "🛠️ SERVICE NEEDED"
        }[item.format] || (isReq ? "🙋 REQUEST" : "FOR SALE");

        // Fulfillment Badge
        let fulfillmentLabel = "Local Pickup";
        let fulfillmentClass = "local-pickup";
        if (item.fulfillment === "both") {
            fulfillmentLabel = isReq ? "🤝 Local or 📦 Ship" : "🤝 Local + 📦 Ships";
            fulfillmentClass = "local-pickup";
        } else if (item.fulfillment === "shipping") {
            fulfillmentLabel = isReq ? "📦 Shipping Preferred" : "📦 Shipping Only";
            fulfillmentClass = "";
        } else if (isReq && item.fulfillment === "pickup") {
            fulfillmentLabel = "🤝 Local Meetup Only";
            fulfillmentClass = "local-pickup";
        }

        // Price & Bids Block
        let priceHtml = "";
        if (isReq) {
            const budgetVal = item.budget !== undefined ? item.budget : (item.currentPrice || 0);
            priceHtml = `
                <div class="price-block">
                    <span class="price-label">Target Budget</span>
                    <span class="current-price req-price">$${budgetVal.toLocaleString()}${item.hourly ? '/hr' : ' Max'}</span>
                </div>
            `;
        } else if (item.format === "auction") {
            priceHtml = `
                <div class="price-block">
                    <span class="price-label">Current Bid (${item.bidsCount || 0} bids)</span>
                    <span class="current-price">$${item.currentPrice.toLocaleString()}</span>
                </div>
            `;
        } else if (item.format === "buy_now") {
            priceHtml = `
                <div class="price-block">
                    <span class="price-label">Buy It Now</span>
                    <span class="current-price">$${item.currentPrice.toLocaleString()}</span>
                </div>
            `;
        } else if (item.format === "service") {
            priceHtml = `
                <div class="price-block">
                    <span class="price-label">Service Rate</span>
                    <span class="current-price">$${item.currentPrice}/hr</span>
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

        // Live Countdown Overlay (Auctions)
        let timerHtml = "";
        if (item.format === "auction" && item.endTime) {
            const timeLeft = this.formatTimeLeft(item.endTime);
            const isUrgent = (item.endTime - Date.now()) < 1000 * 60 * 60; // < 1 hour
            timerHtml = `
                <div class="card-countdown-overlay ${isUrgent ? 'urgent' : ''}" data-end="${item.endTime}">
                    <span>⏱️</span>
                    <span class="timer-display">${timeLeft}</span>
                </div>
            `;
        }

        // Action hint
        const actionHint = isReq
            ? "Submit Quote &rarr;"
            : item.format === "auction" ? "Place Bid &rarr;" : item.format === "buy_now" ? "Buy Now &rarr;" : "View Details &rarr;";

        const sellerRole = isReq ? "Requester" : "Verified Seller";
        const sellerName = item.seller ? item.seller.name : "Member";

        return `
            <div class="listing-card ${isReq ? 'card-is-request' : ''}" data-id="${item.id}">
                <div class="card-media">
                    <img src="${item.imageUrl}" alt="${this.escapeHtml(item.title)}" loading="lazy">
                    <span class="card-format-badge ${formatBadgeClass}">${formatBadgeLabel}</span>
                    <button class="card-watchlist-btn ${isWatchlisted ? 'is-active' : ''}" title="${isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}">
                        ${isWatchlisted ? '❤️' : '🤍'}
                    </button>
                    ${timerHtml}
                </div>

                <div class="card-body">
                    <div class="card-meta-row">
                        <span class="card-category">${this.capitalize(item.category)}</span>
                        <span class="card-location">📍 ${item.distanceMiles ? item.distanceMiles + ' mi • ' : ''}${this.escapeHtml(item.neighborhood || item.city)}</span>
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
                        <span class="stars" style="font-size: 0.6875rem; color: #64748b;">(${sellerRole})</span>
                    </div>
                    <span class="card-action-hint">
                        ${actionHint}
                    </span>
                </div>
            </div>
        `;
    }

    // ============================================================================
    // APPLIED CHIPS & COUNTS
    // ============================================================================

    renderAppliedChips() {
        const row = document.getElementById("appliedChipsRow");
        const list = document.getElementById("chipsList");
        const clearBtn = document.getElementById("clearAllChipsBtn");
        if (!row || !list) return;

        const chips = [];

        if (this.filters.category !== "all") {
            chips.push({ label: `Category: ${this.capitalize(this.filters.category)}`, onRemove: () => this.setCategory("all") });
        }
        if (this.filters.formatPill !== "all") {
            chips.push({
                label: `Format: ${this.capitalize(this.filters.formatPill.replace("_", " "))}`,
                onRemove: () => {
                    const firstPill = document.querySelector("#formatPills .pill-btn[data-format='all']");
                    if (firstPill) firstPill.click();
                }
            });
        }
        if (this.filters.minPrice !== null || this.filters.maxPrice !== null) {
            const min = this.filters.minPrice !== null ? `$${this.filters.minPrice}` : "$0";
            const max = this.filters.maxPrice !== null ? `$${this.filters.maxPrice}` : "Any";
            chips.push({
                label: `Price: ${min} - ${max}`,
                onRemove: () => {
                    this.filters.minPrice = null;
                    this.filters.maxPrice = null;
                    const minEl = document.getElementById("minPriceInput");
                    const maxEl = document.getElementById("maxPriceInput");
                    if (minEl) minEl.value = "";
                    if (maxEl) maxEl.value = "";
                    this.renderListings();
                }
            });
        }
        if (this.filters.searchQuery) {
            chips.push({
                label: `Search: "${this.filters.searchQuery}"`,
                onRemove: () => {
                    this.filters.searchQuery = "";
                    const s = document.getElementById("searchInput");
                    if (s) s.value = "";
                    this.renderListings();
                }
            });
        }

        if (chips.length === 0) {
            row.style.display = "none";
            return;
        }

        row.style.display = "flex";
        list.innerHTML = "";
        chips.forEach((c, idx) => {
            const chipEl = document.createElement("div");
            chipEl.className = "filter-chip";
            chipEl.innerHTML = `<span>${this.escapeHtml(c.label)}</span><button class="chip-remove">&times;</button>`;
            chipEl.querySelector(".chip-remove").addEventListener("click", c.onRemove);
            list.appendChild(chipEl);
        });

        if (clearBtn) {
            clearBtn.onclick = () => this.resetFilters();
        }
    }

    renderCategoryCounts() {
        const counts = {
            all: 0,
            electronics: 0,
            services: 0,
            collectibles: 0,
            vehicles: 0,
            housing: 0,
            home: 0,
            community: 0
        };

        this.listings.forEach(item => {
            if (this.filters.city === "Nationwide" || item.city === this.filters.city || item.city === "Nationwide") {
                counts.all++;
                if (counts[item.category] !== undefined) {
                    counts[item.category]++;
                }
            }
        });

        document.getElementById("countAll").textContent = counts.all;
        document.getElementById("countElectronics").textContent = counts.electronics;
        document.getElementById("countServices").textContent = counts.services;
        document.getElementById("countCollectibles").textContent = counts.collectibles;
        document.getElementById("countVehicles").textContent = counts.vehicles;
        document.getElementById("countHousing").textContent = counts.housing;
        document.getElementById("countHome").textContent = counts.home;
        document.getElementById("countCommunity").textContent = counts.community;
    }

    // ============================================================================
    // ITEM DETAIL MODAL & BIDDING ENGINE
    // ============================================================================

    openDetailModal(listingId) {
        const item = this.listings.find(l => l.id === listingId);
        if (!item) return;

        this.currentListingDetail = item;
        const modalOverlay = document.getElementById("detailModalOverlay");

        document.getElementById("detailMainImg").src = item.imageUrl;
        document.getElementById("detailFormatBadge").textContent = item.format.toUpperCase().replace("_", " ");
        document.getElementById("detailTitle").textContent = item.title;
        document.getElementById("detailBreadcrumbs").textContent = `${this.capitalize(item.category)} > ${this.capitalize(item.format.replace('_', ' '))}`;
        document.getElementById("detailDescriptionText").textContent = item.description;

        // Location & Fulfillment
        document.getElementById("detailLocationText").textContent = `📍 ${item.city} • ${item.neighborhood || 'Local Area'} (${item.distanceMiles || '3.0'} mi away)`;
        document.getElementById("detailFulfillmentBadge").textContent = item.fulfillment === "both" 
            ? "🤝 Local Pickup & 📦 Shipping"
            : item.fulfillment === "pickup" ? "🤝 Local Pickup Only" : "📦 Shipping Only";

        // Seller
        const seller = item.seller || { name: "Local Seller", avatar: "LS", rating: 4.9, reviewsCount: 15 };
        document.getElementById("detailSellerAvatar").textContent = seller.avatar || "LS";
        document.getElementById("detailSellerName").textContent = seller.name;
        document.getElementById("detailSellerRating").textContent = `${seller.rating} (${seller.reviewsCount} sales • 99.4% positive)`;

        // Action Box (Auction vs Buy Now vs Service)
        this.renderDetailActionBox(item);

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
                        <span>${i === 0 ? '🏆 ' : ''}Bidder: <strong>${bid.bidder}</strong></span>
                        <span>$${bid.amount.toLocaleString()} • ${bid.time}</span>
                    </div>
                `).join("");
            }
        } else {
            historySection.style.display = "none";
        }

        // Watchlist Button sync
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

        // Share Button
        const shareBtn = document.getElementById("detailShareBtn");
        shareBtn.onclick = () => {
            navigator.clipboard.writeText(window.location.href);
            this.showToast("Listing link copied to clipboard!", "success");
        };

        modalOverlay.style.display = "flex";
        document.body.style.overflow = "hidden";
    }

    renderDetailActionBox(item) {
        const box = document.getElementById("detailActionBox");
        if (!box) return;

        if (item.format === "auction") {
            const minBid = item.currentPrice + (item.currentPrice >= 500 ? 25 : item.currentPrice >= 100 ? 10 : 5);
            const timeLeft = this.formatTimeLeft(item.endTime);

            box.innerHTML = `
                <div class="action-box-timer">
                    <span class="timer-label">⏱️ Live Bidding Countdown:</span>
                    <span class="timer-clock" id="modalTimerClock">${timeLeft}</span>
                </div>
                <div class="action-price-row">
                    <div>
                        <span class="action-price-label">Current High Bid</span>
                        <div class="action-big-price" id="modalCurrentPrice">$${item.currentPrice.toLocaleString()}</div>
                    </div>
                    <span class="action-bids-stat" id="modalBidsCount">${item.bidsCount || 0} bids placed</span>
                </div>
                <form id="placeBidForm" class="bid-input-group">
                    <div class="bid-input-wrap">
                        <span>$</span>
                        <input type="number" id="bidAmountInput" min="${minBid}" step="1" value="${minBid}" required>
                    </div>
                    <button type="submit" class="btn-place-bid">🔨 Place Bid</button>
                </form>
                <div style="font-size: 0.75rem; color: #64748b; display: flex; justify-content: space-between;">
                    <span>Minimum next bid: <strong>$${minBid}</strong></span>
                    <span>${item.fulfillment === "pickup" ? "Local Meetup" : `Shipping: $${item.shippingFee || 0}`}</span>
                </div>
            `;

            // Bid Form Submission
            const form = document.getElementById("placeBidForm");
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const inputVal = parseFloat(document.getElementById("bidAmountInput").value);
                this.handlePlaceBid(item.id, inputVal, minBid);
            });

        } else if (item.format === "buy_now") {
            box.innerHTML = `
                <div class="action-price-row">
                    <div>
                        <span class="action-price-label">Fixed Purchase Price</span>
                        <div class="action-big-price">$${item.currentPrice.toLocaleString()}</div>
                    </div>
                    <span class="action-bids-stat">⚡ Immediate Purchase</span>
                </div>
                <button type="button" class="btn-buy-now" id="btnBuyNowSubmit">
                    ⚡ Buy It Now ($${item.currentPrice.toLocaleString()})
                </button>
                <button type="button" class="btn-make-offer" id="btnMakeOffer">
                    💬 Make a Best Offer to Seller
                </button>
                <div style="font-size: 0.75rem; color: #64748b; text-align: center;">
                    🤝 Protected by Servlist Local Escrow & Buyer Guarantee
                </div>
            `;

            document.getElementById("btnBuyNowSubmit").addEventListener("click", () => {
                this.showToast(`Congratulations! You purchased "${item.title}" for $${item.currentPrice.toLocaleString()}!`, "success");
            });

            document.getElementById("btnMakeOffer").addEventListener("click", () => {
                document.getElementById("btnContactSeller").click();
            });

        } else if (item.format === "service") {
            box.innerHTML = `
                <div class="action-price-row">
                    <div>
                        <span class="action-price-label">Service Rate</span>
                        <div class="action-big-price">$${item.currentPrice}/hr</div>
                    </div>
                    <span class="action-bids-stat">🛠️ Local Classified Gig</span>
                </div>
                <button type="button" class="btn-buy-now" id="btnBookService" style="background: linear-gradient(135deg, #7c3aed, #6d28d9);">
                    📅 Contact & Book Service
                </button>
                <div style="font-size: 0.75rem; color: #64748b; text-align: center;">
                    Direct local communication with no hidden booking fees.
                </div>
            `;

            document.getElementById("btnBookService").addEventListener("click", () => {
                document.getElementById("btnContactSeller").click();
            });

        } else if (item.format === "free_barter") {
            box.innerHTML = `
                <div class="action-price-row">
                    <div>
                        <span class="action-price-label">Curb Alert / Barter</span>
                        <div class="action-big-price">FREE</div>
                    </div>
                    <span class="action-bids-stat">🔄 Community Board</span>
                </div>
                <button type="button" class="btn-buy-now" id="btnClaimFree" style="background: #334155;">
                    📍 View Pickup Instructions & Map
                </button>
            `;

            document.getElementById("btnClaimFree").addEventListener("click", () => {
                this.showToast("Curb alert location pinned in South Austin. First come, first served!", "info");
            });
        }
    }

    handlePlaceBid(listingId, amount, minBid) {
        if (amount < minBid) {
            this.showToast(`Bid must be at least $${minBid}!`, "warning");
            return;
        }

        const item = this.listings.find(l => l.id === listingId);
        if (!item) return;

        item.currentPrice = amount;
        item.bidsCount = (item.bidsCount || 0) + 1;
        if (!item.bidHistory) item.bidHistory = [];

        item.bidHistory.unshift({
            bidder: "You (JD)",
            amount: amount,
            time: "Just now"
        });

        // Save in My Bids
        this.myBids[listingId] = {
            amount: amount,
            status: "winning",
            time: Date.now()
        };

        this.saveListings();
        this.saveMyBids();
        this.showToast(`Bid of $${amount.toLocaleString()} placed! You are the highest bidder! 🎉`, "success");

        // Refresh Detail UI
        this.openDetailModal(listingId);
        this.renderListings();

        // Exciting eBay Feature: Simulated competing bidder after 10-15 seconds for hot items
        if (Math.random() > 0.4) {
            const nextSimBid = amount + (amount >= 500 ? 25 : 10);
            const simBidderName = ["a***8", "c***2", "x***9", "v***4"][Math.floor(Math.random() * 4)];
            setTimeout(() => {
                item.currentPrice = nextSimBid;
                item.bidsCount = (item.bidsCount || 0) + 1;
                item.bidHistory.unshift({
                    bidder: simBidderName,
                    amount: nextSimBid,
                    time: "Just now"
                });
                if (this.myBids[listingId]) {
                    this.myBids[listingId].status = "outbid";
                }
                this.saveListings();
                this.saveMyBids();
                this.showToast(`Outbid alert! Another buyer bid $${nextSimBid.toLocaleString()} on "${item.title.substring(0, 30)}..."`, "warning");
                if (this.currentListingDetail && this.currentListingDetail.id === listingId) {
                    this.openDetailModal(listingId);
                }
                this.renderListings();
            }, 12000);
        }
    }

    // ============================================================================
    // POST NEW LISTING
    // ============================================================================

    handleCreateListing() {
        const title = document.getElementById("postTitle").value.trim();
        const category = document.getElementById("postCategory").value;
        const format = document.querySelector("input[name='postFormat']:checked").value;
        const city = document.getElementById("postCity").value;
        const neighborhood = document.getElementById("postNeighborhood").value.trim() || `${city} Area`;
        const fulfillment = document.getElementById("postFulfillment").value;
        const imageUrl = document.getElementById("postImageUrl").value.trim();
        const description = document.getElementById("postDescription").value.trim();

        let currentPrice = 0;
        let startingPrice = 0;
        let reservePrice = null;
        let endTime = null;

        if (format === "auction") {
            startingPrice = parseFloat(document.getElementById("postStartPrice").value) || 10;
            currentPrice = startingPrice;
            const durationHours = parseFloat(document.getElementById("postDuration").value) || 24;
            endTime = Date.now() + durationHours * 60 * 60 * 1000;
            const resInput = document.getElementById("postReservePrice").value;
            if (resInput) reservePrice = parseFloat(resInput);
        } else if (format === "buy_now" || format === "service") {
            currentPrice = parseFloat(document.getElementById("postStartPrice").value) || 50;
        }

        const newListing = {
            id: `serv-${Date.now()}`,
            title,
            category,
            format,
            startingPrice,
            currentPrice,
            buyItNowPrice: format === "buy_now" ? currentPrice : null,
            reservePrice,
            bidsCount: 0,
            endTime,
            city,
            neighborhood,
            distanceMiles: 1.2,
            fulfillment,
            shippingFee: fulfillment === "pickup" ? 0 : 12.00,
            imageUrl: imageUrl || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
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
        this.renderCategoryCounts();
        this.renderListings();
        this.showToast(`Listing "${title.substring(0, 30)}..." published successfully! 🚀`, "success");

        // Clear Form
        document.getElementById("postListingForm").reset();
    }

    // ============================================================================
    // WATCHLIST & MY BIDS DRAWER
    // ============================================================================

    toggleWatchlist(listingId) {
        if (this.watchlist.has(listingId)) {
            this.watchlist.delete(listingId);
            this.showToast("Removed from Watchlist", "info");
        } else {
            this.watchlist.add(listingId);
            this.showToast("Saved to Watchlist! ❤️", "success");
        }
        this.saveWatchlist();
        this.renderListings();
    }

    updateWatchlistBadges() {
        const count = this.watchlist.size;
        const topBadge = document.getElementById("watchlistCountBadge");
        const drawerBadge = document.getElementById("drawerWatchlistCount");
        if (topBadge) topBadge.textContent = count;
        if (drawerBadge) drawerBadge.textContent = count;
    }

    updateMyBidsBadges() {
        const count = Object.keys(this.myBids).length;
        const topBadge = document.getElementById("myBidsCountBadge");
        const drawerBadge = document.getElementById("drawerBidsCount");
        if (topBadge) topBadge.textContent = count;
        if (drawerBadge) drawerBadge.textContent = count;
    }

    renderDrawer() {
        this.updateWatchlistBadges();
        this.updateMyBidsBadges();

        const body = document.getElementById("drawerBody");
        if (!body) return;

        if (this.activeDrawerTab === "watchlist") {
            const watchedItems = this.listings.filter(l => this.watchlist.has(l.id));
            if (watchedItems.length === 0) {
                body.innerHTML = `
                    <div style="text-align: center; padding: 40px 10px; color: #64748b;">
                        <span style="font-size: 2.5rem;">🤍</span>
                        <h4 style="margin: 8px 0; color: #0f172a;">Your Watchlist is empty</h4>
                        <p style="font-size: 0.8125rem;">Click the heart icon on any auction or classified to track it here!</p>
                    </div>
                `;
                return;
            }

            body.innerHTML = watchedItems.map(item => `
                <div class="drawer-item-card" data-id="${item.id}">
                    <img src="${item.imageUrl}" alt="${this.escapeHtml(item.title)}" class="drawer-thumb">
                    <div class="drawer-item-info">
                        <h4 class="drawer-item-title">${this.escapeHtml(item.title)}</h4>
                        <div class="drawer-item-meta">
                            <span style="font-weight: 800; color: #0f172a;">$${item.currentPrice.toLocaleString()}</span>
                            <span>${item.format === 'auction' ? '⏱️ ' + this.formatTimeLeft(item.endTime) : '⚡ Buy Now'}</span>
                        </div>
                    </div>
                    <button class="chip-remove btn-drawer-remove" data-id="${item.id}" title="Remove">&times;</button>
                </div>
            `).join("");

        } else if (this.activeDrawerTab === "my_bids") {
            const bidEntries = Object.entries(this.myBids);
            if (bidEntries.length === 0) {
                body.innerHTML = `
                    <div style="text-align: center; padding: 40px 10px; color: #64748b;">
                        <span style="font-size: 2.5rem;">🔨</span>
                        <h4 style="margin: 8px 0; color: #0f172a;">No active bids yet</h4>
                        <p style="font-size: 0.8125rem;">Bid on any live auction to track competing offers and winning status.</p>
                    </div>
                `;
                return;
            }

            body.innerHTML = bidEntries.map(([id, bidData]) => {
                const item = this.listings.find(l => l.id === id);
                if (!item) return "";
                const isWinning = bidData.status === "winning";
                return `
                    <div class="drawer-item-card" data-id="${item.id}">
                        <img src="${item.imageUrl}" alt="${this.escapeHtml(item.title)}" class="drawer-thumb">
                        <div class="drawer-item-info">
                            <h4 class="drawer-item-title">${this.escapeHtml(item.title)}</h4>
                            <div class="drawer-item-meta">
                                <span>Your Bid: <strong>$${bidData.amount.toLocaleString()}</strong></span>
                                <span class="drawer-status-badge ${isWinning ? 'status-winning' : 'status-outbid'}">
                                    ${isWinning ? '🏆 High Bidder' : '⚠️ Outbid'}
                                </span>
                            </div>
                            <div style="font-size: 0.6875rem; color: #64748b; margin-top: 2px;">
                                Current: $${item.currentPrice.toLocaleString()} • ⏱️ ${this.formatTimeLeft(item.endTime)}
                            </div>
                        </div>
                    </div>
                `;
            }).join("");
        }

        // Drawer item click -> open detail modal
        body.querySelectorAll(".drawer-item-card").forEach(card => {
            card.addEventListener("click", (e) => {
                if (e.target.closest(".btn-drawer-remove")) return;
                const id = card.dataset.id;
                document.getElementById("drawerModalOverlay").style.display = "none";
                document.body.style.overflow = "auto";
                this.openDetailModal(id);
            });
        });

        // Drawer remove button
        body.querySelectorAll(".btn-drawer-remove").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                this.toggleWatchlist(id);
                this.renderDrawer();
            });
        });
    }

    // ============================================================================
    // TICKER & LIVE TIMERS
    // ============================================================================

    startTimerTicker() {
        setInterval(() => {
            // Update timers in listing cards
            document.querySelectorAll(".card-countdown-overlay").forEach(overlay => {
                const endTime = parseInt(overlay.dataset.end, 10);
                if (endTime) {
                    const display = overlay.querySelector(".timer-display");
                    if (display) {
                        display.textContent = this.formatTimeLeft(endTime);
                    }
                    if ((endTime - Date.now()) < 1000 * 60 * 60) {
                        overlay.classList.add("urgent");
                    }
                }
            });

            // Update modal timer clock if open
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

    updateTopBarStats() {
        const statsEl = document.getElementById("activeStats");
        if (statsEl) {
            const auctionCount = this.listings.filter(l => l.format === "auction").length;
            statsEl.innerHTML = `<strong>${this.listings.length * 115}+</strong> Local Listings &bull; <strong>${auctionCount * 28}</strong> Live Auctions Active`;
        }
    }

    // ============================================================================
    // TOAST NOTIFICATIONS & UTILS
    // ============================================================================

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
    window.servlistApp = new ServlistApp();
});
