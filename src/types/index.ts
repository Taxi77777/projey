export interface Location {
  address: string;
  latitude: number;
  longitude: number;
  place_id?: string;
}

export interface TripQuote {
  departure: Location;
  destination: Location;
  date: Date;
  time: string;
  distance: number; // in kilometers
  price: number;
  isNightRate: boolean;
}

export interface BookingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  departure: Location;
  destination: Location;
  date: Date;
  time: string;
  passengers: number;
  luggage: number;
  quote: TripQuote;
}

export interface Country {
  name: string;
  code: string;
  callingCode: string;
  flag: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface WhatsAppMessage {
  to: string;
  message: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface GooglePlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface DirectionsResult {
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
}