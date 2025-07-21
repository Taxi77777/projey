import { CONFIG } from '../constants/config';
import { Location, GooglePlacePrediction } from '../types';

export class PlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = CONFIG.GOOGLE_MAPS_API_KEY;
  }

  /**
   * Search places with autocomplete, prioritizing service areas
   */
  async searchPlaces(input: string): Promise<GooglePlacePrediction[]> {
    if (input.length < 2) {
      return [];
    }

    try {
      // Bias search towards service areas (Marne-la-Vallée region)
      const location = '48.8584,2.6331'; // Marne-la-Vallée coordinates
      const radius = 50000; // 50km radius
      
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${this.apiKey}&location=${location}&radius=${radius}&language=fr&components=country:fr&types=address`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.predictions.map((prediction: any) => ({
          description: prediction.description,
          place_id: prediction.place_id,
          structured_formatting: {
            main_text: prediction.structured_formatting.main_text,
            secondary_text: prediction.structured_formatting.secondary_text,
          },
        }));
      } else {
        console.error('Places API error:', data.status);
        return [];
      }
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  /**
   * Get place details including coordinates
   */
  async getPlaceDetails(placeId: string): Promise<Location | null> {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${this.apiKey}&fields=formatted_address,geometry&language=fr`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const place = data.result;
        return {
          address: place.formatted_address,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          place_id: placeId,
        };
      } else {
        console.error('Place details error:', data.status);
        return null;
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  /**
   * Get predefined popular destinations for quick selection
   */
  getPopularDestinations(): Array<{ name: string; searchTerm: string; icon: string }> {
    return [
      { name: 'Disneyland Paris', searchTerm: 'Disneyland Paris, Chessy', icon: '🏰' },
      { name: 'Val d\'Europe', searchTerm: 'Val d\'Europe, Serris', icon: '🛍️' },
      { name: 'Gare de Marne-la-Vallée', searchTerm: 'Gare de Marne-la-Vallée Chessy', icon: '🚂' },
      { name: 'Aéroport CDG', searchTerm: 'Aéroport Charles de Gaulle, Roissy-en-France', icon: '✈️' },
      { name: 'Aéroport Orly', searchTerm: 'Aéroport d\'Orly, Orly', icon: '✈️' },
      { name: 'Gare de l\'Est', searchTerm: 'Gare de l\'Est, Paris', icon: '🚂' },
      { name: 'Châtelet-Les Halles', searchTerm: 'Châtelet-Les Halles, Paris', icon: '🚇' },
      { name: 'Torcy Centre', searchTerm: 'Centre commercial Bay 2, Torcy', icon: '🛍️' },
      { name: 'Bussy-Saint-Georges', searchTerm: 'Bussy-Saint-Georges centre', icon: '🏘️' },
      { name: 'Lognes', searchTerm: 'Lognes centre', icon: '🏘️' },
    ];
  }

  /**
   * Get service area suggestions for SEO optimization
   */
  getServiceAreaSuggestions(): Array<{ name: string; searchTerm: string }> {
    return CONFIG.SERVICE_AREAS.PRIORITY.map(city => ({
      name: city,
      searchTerm: `${city}, France`,
    }));
  }

  /**
   * Check if location is in priority service area
   */
  isInPriorityServiceArea(address: string): boolean {
    const lowerAddress = address.toLowerCase();
    return CONFIG.SERVICE_AREAS.PRIORITY.some(city => 
      lowerAddress.includes(city.toLowerCase())
    ) || CONFIG.SERVICE_AREAS.MAJOR_DESTINATIONS.some(destination =>
      lowerAddress.includes(destination.toLowerCase())
    );
  }

  /**
   * Get location suggestions based on input
   */
  getLocationSuggestions(input: string): Array<{ name: string; searchTerm: string; priority: boolean }> {
    const suggestions = [];
    const lowerInput = input.toLowerCase();

    // Priority areas
    const priorityMatches = CONFIG.SERVICE_AREAS.PRIORITY.filter(city =>
      city.toLowerCase().includes(lowerInput)
    );
    
    priorityMatches.forEach(city => {
      suggestions.push({
        name: city,
        searchTerm: `${city}, France`,
        priority: true,
      });
    });

    // Major destinations
    const destinationMatches = CONFIG.SERVICE_AREAS.MAJOR_DESTINATIONS.filter(dest =>
      dest.toLowerCase().includes(lowerInput)
    );

    destinationMatches.forEach(dest => {
      suggestions.push({
        name: dest,
        searchTerm: dest,
        priority: true,
      });
    });

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }
}

export const placesService = new PlacesService();