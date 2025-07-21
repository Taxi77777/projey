import { CONFIG } from '../constants/config';
import { TripQuote, Location, DirectionsResult } from '../types';

export class PricingService {
  /**
   * Calculate distance between two locations using Google Maps Directions API
   */
  async calculateDistance(departure: Location, destination: Location): Promise<DirectionsResult> {
    const { GOOGLE_MAPS_API_KEY } = CONFIG;
    
    const origin = `${departure.latitude},${departure.longitude}`;
    const destination_coords = `${destination.latitude},${destination.longitude}`;
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination_coords}&key=${GOOGLE_MAPS_API_KEY}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        return {
          distance: {
            text: leg.distance.text,
            value: leg.distance.value, // in meters
          },
          duration: {
            text: leg.duration.text,
            value: leg.duration.value, // in seconds
          },
        };
      } else {
        throw new Error('Unable to calculate distance');
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      throw new Error('Failed to calculate distance');
    }
  }

  /**
   * Determine if given time is night rate (19h-7h)
   */
  isNightRate(hour: number): boolean {
    const { DAY_START, DAY_END } = CONFIG.PRICING;
    return hour < DAY_START || hour >= DAY_END;
  }

  /**
   * Calculate fare based on distance and time
   */
  calculateFare(distanceInKm: number, tripDateTime: Date): { price: number; isNightRate: boolean } {
    const hour = tripDateTime.getHours();
    const isNight = this.isNightRate(hour);
    
    const rate = isNight ? CONFIG.PRICING.NIGHT_RATE : CONFIG.PRICING.DAY_RATE;
    const price = distanceInKm * rate;
    
    return {
      price: Math.round(price * 100) / 100, // Round to 2 decimal places
      isNightRate: isNight,
    };
  }

  /**
   * Generate complete trip quote
   */
  async generateQuote(
    departure: Location,
    destination: Location,
    date: Date,
    time: string
  ): Promise<TripQuote> {
    try {
      // Calculate distance using Google Maps
      const directionsResult = await this.calculateDistance(departure, destination);
      
      // Convert distance from meters to kilometers
      const distanceInKm = directionsResult.distance.value / 1000;
      
      // Parse time and create complete datetime
      const [hours, minutes] = time.split(':').map(Number);
      const tripDateTime = new Date(date);
      tripDateTime.setHours(hours, minutes, 0, 0);
      
      // Calculate fare
      const { price, isNightRate } = this.calculateFare(distanceInKm, tripDateTime);
      
      return {
        departure,
        destination,
        date,
        time,
        distance: distanceInKm,
        price,
        isNightRate,
      };
    } catch (error) {
      console.error('Error generating quote:', error);
      throw new Error('Failed to generate quote');
    }
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return `€${price.toFixed(2)}`;
  }

  /**
   * Get rate information for display
   */
  getRateInfo(isNightRate: boolean): { rate: number; period: string } {
    if (isNightRate) {
      return {
        rate: CONFIG.PRICING.NIGHT_RATE,
        period: '19h-7h',
      };
    } else {
      return {
        rate: CONFIG.PRICING.DAY_RATE,
        period: '7h-19h',
      };
    }
  }
}

export const pricingService = new PricingService();