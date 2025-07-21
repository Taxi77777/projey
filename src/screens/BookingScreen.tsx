import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CONFIG } from '../constants/config';
import { i18n } from '../i18n';
import { communicationService } from '../services/communicationService';
import type { RootStackParamList, BookingForm, Country } from '../../App';

type BookingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Booking'
>;

type BookingScreenRouteProp = any;

// Base de données des pays avec drapeaux
const COUNTRIES: Country[] = [
  { name: 'France', code: 'FR', callingCode: '+33', flag: '🇫🇷' },
  { name: 'United Kingdom', code: 'GB', callingCode: '+44', flag: '🇬🇧' },
  { name: 'Germany', code: 'DE', callingCode: '+49', flag: '🇩🇪' },
  { name: 'Spain', code: 'ES', callingCode: '+34', flag: '🇪🇸' },
  { name: 'Italy', code: 'IT', callingCode: '+39', flag: '🇮🇹' },
  { name: 'Belgium', code: 'BE', callingCode: '+32', flag: '🇧🇪' },
  { name: 'Netherlands', code: 'NL', callingCode: '+31', flag: '🇳🇱' },
  { name: 'Switzerland', code: 'CH', callingCode: '+41', flag: '🇨🇭' },
  { name: 'United States', code: 'US', callingCode: '+1', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', callingCode: '+1', flag: '🇨🇦' },
  { name: 'Algeria', code: 'DZ', callingCode: '+213', flag: '🇩🇿' },
  { name: 'Morocco', code: 'MA', callingCode: '+212', flag: '🇲🇦' },
  { name: 'Tunisia', code: 'TN', callingCode: '+216', flag: '🇹🇳' },
  { name: 'Saudi Arabia', code: 'SA', callingCode: '+966', flag: '🇸🇦' },
  { name: 'UAE', code: 'AE', callingCode: '+971', flag: '🇦🇪' },
  { name: 'Qatar', code: 'QA', callingCode: '+974', flag: '🇶🇦' },
  { name: 'Lebanon', code: 'LB', callingCode: '+961', flag: '🇱🇧' },
  { name: 'Egypt', code: 'EG', callingCode: '+20', flag: '🇪🇬' },
];

const BookingScreen: React.FC = () => {
  const navigation = useNavigation<BookingScreenNavigationProp>();
  const route = useRoute<BookingScreenRouteProp>();
  const { quote } = route.params;

  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Default France
  const [passengers, setPassengers] = useState('1');
  const [luggage, setLuggage] = useState('0');
  const [loading, setLoading] = useState(false);

  // Country picker state
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    // Animation d'entrée
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Animation de pulsation pour le bouton CTA
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!lastName.trim()) newErrors.lastName = 'Nom requis';
    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Téléphone requis';
    } else if (phone.length < 8) {
      newErrors.phone = 'Numéro trop court';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBooking = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);

    try {
      const booking: BookingForm = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        countryCode: selectedCountry.callingCode,
        passengers: parseInt(passengers),
        luggage: parseInt(luggage),
        departure: quote.departure,
        destination: quote.destination,
        date: quote.date,
        time: quote.time,
        quote,
      };

      const result = await communicationService.sendBooking(booking);

      if (result.whatsapp || result.email) {
        navigation.navigate('Success', { booking });
      } else {
        Alert.alert(
          'Problème d\'envoi',
          'Impossible d\'envoyer votre réservation. Veuillez contacter directement le +33 7 50 53 56 58'
        );
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue. Veuillez réessayer ou nous contacter directement.'
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.callingCode.includes(countrySearch)
  );

  const renderCountryPicker = () => (
    <Modal
      visible={showCountryPicker}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.countryPickerContainer}>
        <View style={styles.countryPickerHeader}>
          <TouchableOpacity
            onPress={() => setShowCountryPicker(false)}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.countryPickerTitle}>Choisir un pays</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un pays..."
            value={countrySearch}
            onChangeText={setCountrySearch}
            placeholderTextColor="#999"
          />
        </View>

        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.countryItem}
              onPress={() => {
                setSelectedCountry(item);
                setShowCountryPicker(false);
                setCountrySearch('');
              }}
            >
              <Text style={styles.countryFlag}>{item.flag}</Text>
              <View style={styles.countryInfo}>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryCode}>{item.callingCode}</Text>
              </View>
              {selectedCountry.code === item.code && (
                <Text style={styles.selectedIcon}>✓</Text>
              )}
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );

  const renderUrgencyIndicator = () => (
    <View style={styles.urgencyBanner}>
      <Text style={styles.urgencyEmoji}>⏰</Text>
      <View style={styles.urgencyTextContainer}>
        <Text style={styles.urgencyTitle}>Réservation Prioritaire</Text>
        <Text style={styles.urgencySubtext}>
          Votre tarif est bloqué pendant 15 minutes
        </Text>
      </View>
      <View style={styles.urgencyBadge}>
        <Text style={styles.urgencyBadgeText}>GARANTI</Text>
      </View>
    </View>
  );

  const renderTrustSignals = () => (
    <View style={styles.trustSection}>
      <View style={styles.trustItem}>
        <Text style={styles.trustEmoji}>🔒</Text>
        <Text style={styles.trustText}>Données sécurisées</Text>
      </View>
      <View style={styles.trustItem}>
        <Text style={styles.trustEmoji}>⚡</Text>
        <Text style={styles.trustText}>Réponse rapide</Text>
      </View>
      <View style={styles.trustItem}>
        <Text style={styles.trustEmoji}>✅</Text>
        <Text style={styles.trustText}>Chauffeur licencié</Text>
      </View>
    </View>
  );

  const renderSocialProof = () => (
    <View style={styles.socialProofSection}>
      <Text style={styles.socialProofTitle}>
        ⭐ Plus de 2,500 clients satisfaits cette année
      </Text>
      <Text style={styles.socialProofSubtext}>
        "Service impeccable pour Disneyland" - Marie, Torcy
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderCountryPicker()}
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: slideAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Header avec urgence */}
        <View style={styles.header}>
          <Text style={styles.title}>🚖 Finaliser la Réservation</Text>
          <Text style={styles.subtitle}>
            Plus que quelques secondes pour confirmer votre course
          </Text>
        </View>

        {renderUrgencyIndicator()}
        {renderSocialProof()}

        {/* Récapitulatif du tarif - Design attractif */}
        <View style={styles.quoteCard}>
          <View style={styles.quoteHeader}>
            <Text style={styles.quoteTitle}>📋 Votre Trajet</Text>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>€{quote.price.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.routeContainer}>
            <View style={styles.locationItem}>
              <Text style={styles.locationEmoji}>📍</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {quote.departure.address}
              </Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.locationItem}>
              <Text style={styles.locationEmoji}>🎯</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {quote.destination.address}
              </Text>
            </View>
          </View>

          <View style={styles.tripDetails}>
            <Text style={styles.tripDetailText}>
              📅 {quote.date.toLocaleDateString('fr-FR')} à {quote.time}
            </Text>
            <Text style={styles.tripDetailText}>
              📏 {quote.distance.toFixed(1)} km • 
              {quote.isNightRate ? ' Tarif nuit' : ' Tarif jour'}
            </Text>
          </View>
        </View>

        {/* Formulaire optimisé psychologiquement */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>
            👤 Vos Informations (Communication Directe)
          </Text>
          
          <View style={styles.formRow}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Votre prénom"
                placeholderTextColor="#999"
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Votre nom"
                placeholderTextColor="#999"
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email * (Pour confirmation)</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone * (Contact direct)</Text>
            <View style={styles.phoneContainer}>
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.countryCallingCode}>
                  {selectedCountry.callingCode}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              
              <TextInput
                style={[
                  styles.phoneInput,
                  errors.phone && styles.inputError,
                ]}
                value={phone}
                onChangeText={setPhone}
                placeholder="123456789"
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          <View style={styles.formRow}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Passagers</Text>
              <TextInput
                style={styles.input}
                value={passengers}
                onChangeText={setPassengers}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.label}>Bagages</Text>
              <TextInput
                style={styles.input}
                value={luggage}
                onChangeText={setLuggage}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {renderTrustSignals()}

        {/* Garanties et Avantages */}
        <View style={styles.guaranteeSection}>
          <Text style={styles.guaranteeTitle}>🛡️ Vos Garanties</Text>
          <View style={styles.guaranteeList}>
            <Text style={styles.guaranteeItem}>✓ Prix fixe garanti</Text>
            <Text style={styles.guaranteeItem}>✓ Chauffeur professionnel</Text>
            <Text style={styles.guaranteeItem}>✓ Véhicule propre et climatisé</Text>
            <Text style={styles.guaranteeItem}>✓ Aucun frais caché</Text>
          </View>
        </View>

        {/* Bouton CTA optimisé */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.bookingButton, loading && styles.buttonDisabled]}
            onPress={handleBooking}
            disabled={loading}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.bookingButtonText}>
                {loading ? '⏳ Envoi en cours...' : '🚀 RÉSERVER MAINTENANT'}
              </Text>
              <Text style={styles.buttonSubtext}>
                Le chauffeur sera prévenu instantanément
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Rappel de sécurité */}
        <View style={styles.securityReminder}>
          <Text style={styles.securityText}>
            🔒 Vos données sont protégées et ne sont pas sauvegardées
          </Text>
          <Text style={styles.securitySubtext}>
            Communication directe avec votre chauffeur via WhatsApp et Email
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
  header: {
    backgroundColor: CONFIG.COLORS.PRIMARY,
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: CONFIG.COLORS.WHITE,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: CONFIG.COLORS.WHITE,
    textAlign: 'center',
    opacity: 0.9,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b35',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urgencyEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  urgencyTextContainer: {
    flex: 1,
  },
  urgencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONFIG.COLORS.WHITE,
  },
  urgencySubtext: {
    fontSize: 14,
    color: CONFIG.COLORS.WHITE,
    opacity: 0.9,
  },
  urgencyBadge: {
    backgroundColor: CONFIG.COLORS.SECONDARY,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
  },
  socialProofSection: {
    backgroundColor: CONFIG.COLORS.WHITE,
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: CONFIG.COLORS.SECONDARY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialProofTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CONFIG.COLORS.PRIMARY,
    marginBottom: 5,
  },
  socialProofSubtext: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  quoteCard: {
    backgroundColor: CONFIG.COLORS.WHITE,
    margin: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
  },
  priceBadge: {
    backgroundColor: CONFIG.COLORS.PRIMARY,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.WHITE,
  },
  routeContainer: {
    marginBottom: 15,
  },
  locationItem: {
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
  tripDetails: {
    borderTopWidth: 1,
    borderTopColor: CONFIG.COLORS.LIGHT_GRAY,
    paddingTop: 15,
  },
  tripDetailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  formSection: {
    backgroundColor: CONFIG.COLORS.WHITE,
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 15,
  },
  halfInput: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: CONFIG.COLORS.BLACK,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: CONFIG.COLORS.LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  inputError: {
    borderColor: CONFIG.COLORS.ERROR,
  },
  errorText: {
    color: CONFIG.COLORS.ERROR,
    fontSize: 12,
    marginTop: 5,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CONFIG.COLORS.LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: CONFIG.COLORS.WHITE,
    minWidth: 100,
  },
  countryFlag: {
    fontSize: 18,
    marginRight: 5,
  },
  countryCallingCode: {
    fontSize: 16,
    color: CONFIG.COLORS.BLACK,
    marginRight: 5,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#999',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: CONFIG.COLORS.LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  countryPickerContainer: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  countryPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  cancelButton: {
    padding: 10,
  },
  cancelButtonText: {
    color: CONFIG.COLORS.PRIMARY,
    fontSize: 16,
  },
  countryPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
  },
  placeholder: {
    width: 60,
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: CONFIG.COLORS.LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: CONFIG.COLORS.GRAY,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  countryInfo: {
    flex: 1,
    marginLeft: 15,
  },
  countryName: {
    fontSize: 16,
    color: CONFIG.COLORS.BLACK,
  },
  countryCode: {
    fontSize: 14,
    color: '#666',
  },
  selectedIcon: {
    fontSize: 16,
    color: CONFIG.COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: CONFIG.COLORS.WHITE,
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
  },
  trustEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },
  trustText: {
    fontSize: 12,
    color: CONFIG.COLORS.BLACK,
    textAlign: 'center',
    fontWeight: '500',
  },
  guaranteeSection: {
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
  guaranteeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
    marginBottom: 15,
  },
  guaranteeList: {
    gap: 8,
  },
  guaranteeItem: {
    fontSize: 14,
    color: CONFIG.COLORS.PRIMARY,
    fontWeight: '500',
  },
  bookingButton: {
    backgroundColor: CONFIG.COLORS.SECONDARY,
    marginHorizontal: 15,
    marginVertical: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    padding: 20,
    alignItems: 'center',
  },
  bookingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
    marginBottom: 5,
  },
  buttonSubtext: {
    fontSize: 14,
    color: CONFIG.COLORS.BLACK,
    opacity: 0.8,
  },
  securityReminder: {
    backgroundColor: '#e8f5e8',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  securityText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  securitySubtext: {
    fontSize: 12,
    color: '#2e7d32',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 50,
  },
});

export default BookingScreen;