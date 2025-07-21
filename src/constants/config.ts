export const CONFIG = {
  // Google Maps API Key
  GOOGLE_MAPS_API_KEY: 'AIzaSyBxDQCkhDXUBjHekVmUPxpu23ZzetSEfL8',
  
  // Pricing configuration (per km)
  PRICING: {
    DAY_RATE: 2.00,   // 7h - 19h
    NIGHT_RATE: 2.63, // 19h - 7h
    DAY_START: 7,     // 7:00 AM
    DAY_END: 19,      // 7:00 PM
  },
  
  // Contact information
  CONTACT: {
    WHATSAPP_NUMBER: '+33750535658',
    EMAIL: 'contact@taximarnelavallee.com',
    OWNER_EMAIL: 'rachidleg77@gmail.com',
    FORMSPREE_ENDPOINT: 'https://formspree.io/f/myzwoaoz',
    COMPANY_NAME: 'Taxi Marne-la-Vallée',
  },

  // Fleet information
  VEHICLES: {
    PEUGEOT_508: {
      model: 'Peugeot 508 Hybride',
      capacity: 4,
      type: 'berline',
      features: ['Hybride', 'Climatisation', 'GPS', 'WiFi'],
      emoji: '🚗',
      description: 'Berline hybride confortable et écologique'
    },
    MERCEDES_V: {
      model: 'Mercedes Classe V',
      capacity: 7,
      type: 'van',
      features: ['7 places', 'Climatisation', 'Espace bagages', 'Confort premium'],
      emoji: '🚐',
      description: 'Van premium pour groupes et familles'
    }
  },

  // Payment information
  PAYMENT: {
    methods: ['Espèces', 'Carte bancaire', 'Chèque'],
    policy: 'Paiement à bord du véhicule uniquement',
    noAdvancePayment: true,
  },
  
  // Service areas - prioritized cities for SEO
  SERVICE_AREAS: {
    PRIORITY: [
      'Marne-la-Vallée',
      'Torcy', 
      'Lognes',
      'Bussy-Saint-Georges',
      'Bussy-Saint-Martin',
      'Chanteloup-en-Brie',
      'Collégien',
      'Conches-sur-Gondoire',
      'Ferrières-en-Brie',
      'Gouvernes',
      'Guermantes',
      'Jossigny',
      'Lagny-sur-Marne',
      'Montévrain',
      'Saint-Thibault-des-Vignes',
      'Bailly-Romainvilliers',
      'Chessy',
      'Coupvray',
      'Magny-le-Hongre',
      'Serris',
      'Villeneuve-le-Comte'
    ],
    MAJOR_DESTINATIONS: [
      'Paris',
      'Disneyland Paris',
      'Aéroport CDG',
      'Aéroport Orly'
    ]
  },
  
  // App Theme Colors
  COLORS: {
    PRIMARY: '#1a237e',     // Bleu nuit
    SECONDARY: '#ffd700',   // Doré
    WHITE: '#ffffff',
    BLACK: '#000000',
    GRAY: '#f5f5f5',
    LIGHT_GRAY: '#e0e0e0',
    SUCCESS: '#4caf50',
    ERROR: '#f44336',
    WARNING: '#ff9800',
  },
  
  // SEO Keywords for app visibility
  SEO_KEYWORDS: [
    'Taxi Marne-la-Vallée',
    'Réservation taxi Disneyland',
    'Taxi pas cher Val d\'Europe', 
    'Trajet CDG ORLY',
    'Réserver un taxi Bussy',
    'Transport privé Paris Disney',
    'Application taxi sans compte',
    'Estimation prix taxi rapide'
  ]
};