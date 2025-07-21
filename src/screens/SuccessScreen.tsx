import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CONFIG } from '../constants/config';
import { i18n } from '../i18n';
import { communicationService } from '../services/communicationService';
import type { RootStackParamList } from '../../App';

type SuccessScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Success'
>;

type SuccessScreenRouteProp = any;

const SuccessScreen: React.FC = () => {
  const navigation = useNavigation<SuccessScreenNavigationProp>();
  const route = useRoute<SuccessScreenRouteProp>();
  const { booking } = route.params;

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation d'entrée avec effet de célébration
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNewBooking = () => {
    navigation.navigate('Welcome');
  };

  const handleCallTaxi = () => {
    communicationService.callTaxi();
  };

  const handleOpenWhatsApp = () => {
    const message = `Bonjour, je viens de faire une réservation via l'application pour le ${booking.quote.date.toLocaleDateString('fr-FR')} à ${booking.quote.time}. Merci de confirmer ma course.`;
    const url = `https://wa.me/${CONFIG.CONTACT.WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  const handleOpenWebsite = () => {
    communicationService.openWebsite();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Header de succès avec animation */}
        <Animated.View 
          style={[
            styles.successHeader,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Réservation Confirmée !</Text>
          <Text style={styles.successSubtitle}>
            Votre demande a été envoyée au chauffeur
          </Text>
        </Animated.View>

        {/* Statut d'envoi */}
        <View style={styles.statusSection}>
          <View style={styles.statusItem}>
            <Text style={styles.statusEmoji}>📱</Text>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>WhatsApp</Text>
              <Text style={styles.statusSubtext}>Message envoyé avec succès</Text>
            </View>
            <Text style={styles.statusCheck}>✅</Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusEmoji}>📧</Text>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>Email</Text>
              <Text style={styles.statusSubtext}>Envoyé à rachidleg77@gmail.com</Text>
            </View>
            <Text style={styles.statusCheck}>✅</Text>
          </View>
        </View>

        {/* Récapitulatif de la réservation */}
        <View style={styles.bookingSummary}>
          <Text style={styles.summaryTitle}>📋 Récapitulatif de votre réservation</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Client:</Text>
              <Text style={styles.summaryValue}>
                {booking.firstName} {booking.lastName}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Téléphone:</Text>
              <Text style={styles.summaryValue}>
                {booking.countryCode} {booking.phone}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Email:</Text>
              <Text style={styles.summaryValue}>{booking.email}</Text>
            </View>

            <View style={styles.divider} />
            
            <View style={styles.tripInfo}>
              <View style={styles.locationRow}>
                <Text style={styles.locationEmoji}>📍</Text>
                <Text style={styles.locationText} numberOfLines={2}>
                  {booking.quote.departure.address}
                </Text>
              </View>
              
              <View style={styles.routeLine} />
              
              <View style={styles.locationRow}>
                <Text style={styles.locationEmoji}>🎯</Text>
                <Text style={styles.locationText} numberOfLines={2}>
                  {booking.quote.destination.address}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date & Heure:</Text>
              <Text style={styles.summaryValue}>
                {booking.quote.date.toLocaleDateString('fr-FR')} à {booking.quote.time}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Distance:</Text>
              <Text style={styles.summaryValue}>{booking.quote.distance.toFixed(1)} km</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Passagers:</Text>
              <Text style={styles.summaryValue}>{booking.passengers}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Bagages:</Text>
              <Text style={styles.summaryValue}>{booking.luggage}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Prix total:</Text>
              <Text style={styles.priceValue}>€{booking.quote.price.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Message d'instruction */}
        <View style={styles.instructionSection}>
          <Text style={styles.instructionTitle}>📞 Prochaines étapes</Text>
          <Text style={styles.instructionText}>
            Le chauffeur a reçu votre réservation et vous contactera rapidement pour confirmer votre course.
          </Text>
          <Text style={styles.instructionSubtext}>
            Vous pouvez également le contacter directement via les boutons ci-dessous.
          </Text>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.whatsappButton} onPress={handleOpenWhatsApp}>
            <Text style={styles.whatsappEmoji}>💬</Text>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Contacter via WhatsApp</Text>
              <Text style={styles.buttonSubtext}>Réponse immédiate</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.callButton} onPress={handleCallTaxi}>
            <Text style={styles.callEmoji}>📞</Text>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Appeler directement</Text>
              <Text style={styles.buttonSubtext}>{CONFIG.CONTACT.WHATSAPP_NUMBER}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Informations de confiance */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>🛡️ Votre réservation est sécurisée</Text>
          <View style={styles.trustList}>
            <Text style={styles.trustItem}>✓ Chauffeur professionnel licencié</Text>
            <Text style={styles.trustItem}>✓ Prix fixe garanti sans surprise</Text>
            <Text style={styles.trustItem}>✓ Véhicule propre et climatisé</Text>
            <Text style={styles.trustItem}>✓ Service ponctuel et fiable</Text>
          </View>
        </View>

        {/* Contact et site web */}
        <View style={styles.contactSection}>
          <TouchableOpacity style={styles.websiteButton} onPress={handleOpenWebsite}>
            <Text style={styles.websiteText}>🌐 www.taximarnelavallee.com</Text>
          </TouchableOpacity>
          <Text style={styles.contactEmail}>📧 contact@taximarnelavallee.com</Text>
        </View>

        {/* Bouton nouvelle réservation */}
        <TouchableOpacity style={styles.newBookingButton} onPress={handleNewBooking}>
          <Text style={styles.newBookingText}>🚖 Nouvelle Réservation</Text>
        </TouchableOpacity>

        {/* Footer de remerciement */}
        <View style={styles.thankYouSection}>
          <Text style={styles.thankYouText}>
            Merci de votre confiance ! 🙏
          </Text>
          <Text style={styles.thankYouSubtext}>
            Nous sommes ravis de vous accompagner dans vos déplacements.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  successHeader: {
    backgroundColor: CONFIG.COLORS.SUCCESS,
    padding: 40,
    alignItems: 'center',
  },
  successEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: CONFIG.COLORS.WHITE,
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 18,
    color: CONFIG.COLORS.WHITE,
    textAlign: 'center',
    opacity: 0.9,
  },
  statusSection: {
    backgroundColor: CONFIG.COLORS.WHITE,
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusEmoji: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CONFIG.COLORS.BLACK,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666',
  },
  statusCheck: {
    fontSize: 20,
    color: CONFIG.COLORS.SUCCESS,
  },
  bookingSummary: {
    margin: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: CONFIG.COLORS.WHITE,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: CONFIG.COLORS.BLACK,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
    marginVertical: 15,
  },
  tripInfo: {
    marginVertical: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationEmoji: {
    fontSize: 16,
    marginRight: 10,
    width: 20,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: CONFIG.COLORS.BLACK,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
    marginLeft: 10,
    marginVertical: 5,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: CONFIG.COLORS.PRIMARY,
  },
  instructionSection: {
    backgroundColor: CONFIG.COLORS.WHITE,
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: CONFIG.COLORS.SECONDARY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: CONFIG.COLORS.BLACK,
    lineHeight: 20,
    marginBottom: 8,
  },
  instructionSubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  actionSection: {
    margin: 15,
    gap: 15,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  whatsappEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CONFIG.COLORS.PRIMARY,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  callEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CONFIG.COLORS.WHITE,
    marginBottom: 2,
  },
  buttonSubtext: {
    fontSize: 14,
    color: CONFIG.COLORS.WHITE,
    opacity: 0.9,
  },
  trustSection: {
    backgroundColor: CONFIG.COLORS.WHITE,
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trustTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
    marginBottom: 15,
  },
  trustList: {
    gap: 8,
  },
  trustItem: {
    fontSize: 14,
    color: CONFIG.COLORS.PRIMARY,
    fontWeight: '500',
  },
  contactSection: {
    alignItems: 'center',
    margin: 15,
  },
  websiteButton: {
    backgroundColor: CONFIG.COLORS.WHITE,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  websiteText: {
    fontSize: 16,
    color: CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
  },
  contactEmail: {
    fontSize: 14,
    color: '#666',
  },
  newBookingButton: {
    backgroundColor: CONFIG.COLORS.SECONDARY,
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  newBookingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
    textAlign: 'center',
  },
  thankYouSection: {
    backgroundColor: CONFIG.COLORS.WHITE,
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thankYouText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  thankYouSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 50,
  },
});

export default SuccessScreen;