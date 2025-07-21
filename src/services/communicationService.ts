import { BookingForm, WhatsAppMessage, EmailMessage } from '../types';
import { CONFIG } from '../constants/config';
import { Linking } from 'react-native';

export class CommunicationService {
  /**
   * Format booking details for messaging
   */
  formatBookingMessage(booking: BookingForm, language: string = 'fr'): string {
    const { quote, firstName, lastName, email, phone, countryCode, passengers, luggage } = booking;
    
    const isNightRate = quote.isNightRate;
    const rateType = isNightRate ? 'Nuit (19h-7h)' : 'Jour (7h-19h)';
    const rate = isNightRate ? CONFIG.PRICING.NIGHT_RATE : CONFIG.PRICING.DAY_RATE;
    
    const date = quote.date.toLocaleDateString('fr-FR');
    const distance = quote.distance.toFixed(1);
    const price = quote.price.toFixed(2);
    
    return `🚖 NOUVELLE RÉSERVATION TAXI MARNE-LA-VALLÉE

👤 CLIENT:
• Nom: ${firstName} ${lastName}
• Email: ${email}
• Téléphone: ${countryCode} ${phone}

🗺️ TRAJET:
• Départ: ${quote.departure.address}
• Arrivée: ${quote.destination.address}
• Date: ${date}
• Heure: ${quote.time}

💰 TARIF:
• Distance: ${distance} km
• Tarif ${rateType}: ${rate}€/km
• Prix total: ${price}€

👥 DÉTAILS:
• Passagers: ${passengers}
• Bagages: ${luggage}

📱 Réservation effectuée via l'application Taxi Marne-la-Vallée
🌐 www.taximarnelavallee.com

Merci de confirmer la disponibilité au client.`;
  }

  /**
   * Format email subject
   */
  formatEmailSubject(booking: BookingForm): string {
    const date = booking.quote.date.toLocaleDateString('fr-FR');
    return `🚖 Réservation Taxi ${date} ${booking.quote.time} - ${booking.firstName} ${booking.lastName}`;
  }

  /**
   * Send booking via WhatsApp
   */
  async sendWhatsAppBooking(booking: BookingForm): Promise<boolean> {
    try {
      const message = this.formatBookingMessage(booking);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `whatsapp://send?phone=${CONFIG.CONTACT.WHATSAPP_NUMBER}&text=${encodedMessage}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return true;
      } else {
        // Fallback to web WhatsApp
        const webWhatsappUrl = `https://wa.me/${CONFIG.CONTACT.WHATSAPP_NUMBER.replace('+', '')}?text=${encodedMessage}`;
        await Linking.openURL(webWhatsappUrl);
        return true;
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send booking via Email
   */
  async sendEmailBooking(booking: BookingForm): Promise<boolean> {
    try {
      const subject = this.formatEmailSubject(booking);
      const body = this.formatBookingMessage(booking);
      
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      
      const emailUrl = `mailto:${CONFIG.CONTACT.EMAIL}?subject=${encodedSubject}&body=${encodedBody}`;
      
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
        return true;
      } else {
        throw new Error('Cannot open email client');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send booking via both WhatsApp and Email
   */
  async sendBooking(booking: BookingForm): Promise<{ whatsapp: boolean; email: boolean }> {
    try {
      // Send WhatsApp first (primary method)
      const whatsappSent = await this.sendWhatsAppBooking(booking);
      
      // Small delay before sending email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Send email as backup
      const emailSent = await this.sendEmailBooking(booking);
      
      return {
        whatsapp: whatsappSent,
        email: emailSent,
      };
    } catch (error) {
      console.error('Error sending booking:', error);
      return {
        whatsapp: false,
        email: false,
      };
    }
  }

  /**
   * Generate booking summary for display
   */
  generateBookingSummary(booking: BookingForm): string {
    const { quote } = booking;
    const date = quote.date.toLocaleDateString('fr-FR');
    const price = quote.price.toFixed(2);
    
    return `${quote.departure.address} → ${quote.destination.address}
${date} à ${quote.time}
${quote.distance.toFixed(1)} km - ${price}€`;
  }

  /**
   * Open taxi website
   */
  async openWebsite(): Promise<void> {
    const websiteUrl = 'https://www.taximarnelavallee.com';
    try {
      const canOpen = await Linking.canOpenURL(websiteUrl);
      if (canOpen) {
        await Linking.openURL(websiteUrl);
      }
    } catch (error) {
      console.error('Error opening website:', error);
    }
  }

  /**
   * Call taxi directly
   */
  async callTaxi(): Promise<void> {
    const phoneUrl = `tel:${CONFIG.CONTACT.WHATSAPP_NUMBER}`;
    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      }
    } catch (error) {
      console.error('Error making phone call:', error);
    }
  }
}

export const communicationService = new CommunicationService();