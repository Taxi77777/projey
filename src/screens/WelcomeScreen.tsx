import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CONFIG } from '../constants/config';
import { i18n, supportedLanguages, Language } from '../i18n';
import type { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Welcome'
>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('fr');
  const [showLanguages, setShowLanguages] = useState(false);

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    i18n.setLanguage(language);
    setShowLanguages(false);
  };

  const handleStartQuote = () => {
    navigation.navigate('Quote');
  };

  const renderServiceArea = (city: string, index: number) => (
    <View key={index} style={styles.cityChip}>
      <Text style={styles.cityText}>{city}</Text>
    </View>
  );

  const renderDestination = (destination: string, index: number) => (
    <View key={index} style={styles.destinationChip}>
      <Text style={styles.destinationText}>{destination}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={CONFIG.COLORS.PRIMARY} />
      
      {/* Header with logo and language selector */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🚖</Text>
          <Text style={styles.logoText}>Taxi MLV</Text>
        </View>
        
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowLanguages(!showLanguages)}
        >
          <Text style={styles.languageButtonText}>
            {supportedLanguages.find(lang => lang.code === currentLanguage)?.flag} {currentLanguage.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Language Dropdown */}
      {showLanguages && (
        <View style={styles.languageDropdown}>
          {supportedLanguages.map(language => (
            <TouchableOpacity
              key={language.code}
              style={styles.languageOption}
              onPress={() => handleLanguageChange(language.code as Language)}
            >
              <Text style={styles.languageOptionText}>
                {language.flag} {language.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>{i18n.t('welcome.title')}</Text>
          <Text style={styles.subtitle}>{i18n.t('welcome.subtitle')}</Text>
          <Text style={styles.description}>{i18n.t('welcome.description')}</Text>
          
          {/* SEO optimized app description */}
          <View style={styles.seoContainer}>
            <Text style={styles.seoTitle}>{i18n.t('app.subtitle')}</Text>
            <Text style={styles.seoDescription}>{i18n.t('app.description')}</Text>
          </View>
        </View>

        {/* Main CTA Button */}
        <TouchableOpacity style={styles.ctaButton} onPress={handleStartQuote}>
          <Text style={styles.ctaButtonText}>{i18n.t('welcome.startButton')}</Text>
        </TouchableOpacity>

        {/* Pricing Info */}
        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>💰 Tarifs Transparents</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{i18n.t('quote.dayRate')}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{i18n.t('quote.nightRate')}</Text>
          </View>
          <Text style={styles.priceNote}>{i18n.t('legal.priceInfo')}</Text>
        </View>

        {/* Fleet Section */}
        <View style={styles.fleetSection}>
          <Text style={styles.sectionTitle}>🚗 Notre Flotte Premium</Text>
          
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <Text style={styles.vehicleEmoji}>{CONFIG.VEHICLES.PEUGEOT_508.emoji}</Text>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleModel}>{CONFIG.VEHICLES.PEUGEOT_508.model}</Text>
                <Text style={styles.vehicleCapacity}>Jusqu'à {CONFIG.VEHICLES.PEUGEOT_508.capacity} passagers</Text>
              </View>
            </View>
            <Text style={styles.vehicleDescription}>{CONFIG.VEHICLES.PEUGEOT_508.description}</Text>
            <View style={styles.featuresList}>
              {CONFIG.VEHICLES.PEUGEOT_508.features.map((feature, index) => (
                <Text key={index} style={styles.vehicleFeature}>✓ {feature}</Text>
              ))}
            </View>
          </View>

          <View style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <Text style={styles.vehicleEmoji}>{CONFIG.VEHICLES.MERCEDES_V.emoji}</Text>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleModel}>{CONFIG.VEHICLES.MERCEDES_V.model}</Text>
                <Text style={styles.vehicleCapacity}>Jusqu'à {CONFIG.VEHICLES.MERCEDES_V.capacity} passagers</Text>
              </View>
            </View>
            <Text style={styles.vehicleDescription}>{CONFIG.VEHICLES.MERCEDES_V.description}</Text>
            <View style={styles.featuresList}>
              {CONFIG.VEHICLES.MERCEDES_V.features.map((feature, index) => (
                <Text key={index} style={styles.vehicleFeature}>✓ {feature}</Text>
              ))}
            </View>
          </View>

          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>💳 Paiement Simple & Sans Inscription</Text>
            <Text style={styles.paymentPolicy}>{CONFIG.PAYMENT.policy}</Text>
            <View style={styles.paymentMethods}>
              {CONFIG.PAYMENT.methods.map((method, index) => (
                <Text key={index} style={styles.paymentMethod}>✓ {method}</Text>
              ))}
            </View>
            <Text style={styles.noAdvanceText}>
              ⚡ Réservation 100% GRATUITE - Aucun paiement en ligne requis
            </Text>
          </View>
        </View>

        {/* Service Areas - SEO Critical */}
        <View style={styles.serviceSection}>
          <Text style={styles.sectionTitle}>🗺️ {i18n.t('welcome.serviceAreas')}</Text>
          <Text style={styles.serviceNote}>{i18n.t('legal.companyInfo')}</Text>
          <View style={styles.citiesContainer}>
            {CONFIG.SERVICE_AREAS.PRIORITY.map((city, index) => 
              renderServiceArea(city, index)
            )}
          </View>
          <Text style={styles.availabilityNote}>{i18n.t('legal.serviceNote')}</Text>
        </View>

        {/* Major Destinations - SEO Critical */}
        <View style={styles.destinationsSection}>
          <Text style={styles.sectionTitle}>🎯 {i18n.t('welcome.majorDestinations')}</Text>
          <View style={styles.destinationsContainer}>
            {CONFIG.SERVICE_AREAS.MAJOR_DESTINATIONS.map((destination, index) => 
              renderDestination(destination, index)
            )}
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>⭐ Avantages Exclusifs</Text>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>📱</Text>
            <Text style={styles.featureText}>{i18n.t('contact.instantBooking')}</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>🔒</Text>
            <Text style={styles.featureText}>{i18n.t('legal.dataPrivacy')}</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>💳</Text>
            <Text style={styles.featureText}>Aucun frais caché - Prix affiché = Prix final</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>🌍</Text>
            <Text style={styles.featureText}>Application multilingue (6 langues)</Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>📞 Contact Direct</Text>
          <Text style={styles.contactText}>{i18n.t('contact.whatsapp')}</Text>
          <Text style={styles.contactText}>{i18n.t('contact.email')}</Text>
          <Text style={styles.websiteText}>🌐 www.taximarnelavallee.com</Text>
        </View>

        {/* SEO Keywords Footer */}
        <View style={styles.seoFooter}>
          <Text style={styles.seoKeywords}>
            Mots-clés: {CONFIG.SEO_KEYWORDS.join(' • ')}
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CONFIG.COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 25,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 32,
    marginRight: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CONFIG.COLORS.WHITE,
  },
  languageButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  languageButtonText: {
    color: CONFIG.COLORS.WHITE,
    fontSize: 14,
    fontWeight: '500',
  },
  languageDropdown: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: CONFIG.COLORS.WHITE,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  languageOption: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  languageOptionText: {
    fontSize: 14,
    color: CONFIG.COLORS.BLACK,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    padding: 20,
    backgroundColor: CONFIG.COLORS.PRIMARY,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: CONFIG.COLORS.WHITE,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: CONFIG.COLORS.WHITE,
    textAlign: 'center',
    marginBottom: 15,
    opacity: 0.9,
  },
  description: {
    fontSize: 16,
    color: CONFIG.COLORS.WHITE,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  seoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  seoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONFIG.COLORS.SECONDARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  seoDescription: {
    fontSize: 14,
    color: CONFIG.COLORS.WHITE,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: CONFIG.COLORS.SECONDARY,
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 18,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
    textAlign: 'center',
  },
  pricingSection: {
    margin: 20,
    padding: 15,
    backgroundColor: CONFIG.COLORS.GRAY,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
    marginBottom: 12,
  },
  priceRow: {
    marginBottom: 8,
  },
  priceText: {
    fontSize: 16,
    color: CONFIG.COLORS.BLACK,
    fontWeight: '500',
  },
  priceNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  fleetSection: {
    margin: 20,
    padding: 15,
    backgroundColor: CONFIG.COLORS.WHITE,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleCard: {
    backgroundColor: CONFIG.COLORS.GRAY,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: CONFIG.COLORS.SECONDARY,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  vehicleEmoji: {
    fontSize: 32,
    marginRight: 15,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.PRIMARY,
    marginBottom: 2,
  },
  vehicleCapacity: {
    fontSize: 14,
    color: '#666',
  },
  vehicleDescription: {
    fontSize: 14,
    color: CONFIG.COLORS.BLACK,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  featuresList: {
    gap: 5,
  },
  vehicleFeature: {
    fontSize: 13,
    color: CONFIG.COLORS.PRIMARY,
    fontWeight: '500',
  },
  paymentSection: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    marginTop: 10,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONFIG.COLORS.PRIMARY,
    marginBottom: 10,
    textAlign: 'center',
  },
  paymentPolicy: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },
  noAdvanceText: {
    fontSize: 14,
    color: '#1b5e20',
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: CONFIG.COLORS.SECONDARY,
    padding: 8,
    borderRadius: 8,
  },
  serviceSection: {
    margin: 20,
  },
  serviceNote: {
    fontSize: 14,
    color: CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
    marginBottom: 15,
  },
  citiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    backgroundColor: CONFIG.COLORS.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 8,
  },
  cityText: {
    color: CONFIG.COLORS.WHITE,
    fontSize: 12,
    fontWeight: '500',
  },
  availabilityNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  destinationsSection: {
    margin: 20,
  },
  destinationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  destinationChip: {
    backgroundColor: CONFIG.COLORS.SECONDARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 8,
  },
  destinationText: {
    color: CONFIG.COLORS.BLACK,
    fontSize: 12,
    fontWeight: '600',
  },
  featuresSection: {
    margin: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: CONFIG.COLORS.BLACK,
    lineHeight: 20,
  },
  contactSection: {
    margin: 20,
    padding: 15,
    backgroundColor: CONFIG.COLORS.GRAY,
    borderRadius: 12,
  },
  contactText: {
    fontSize: 14,
    color: CONFIG.COLORS.BLACK,
    marginBottom: 5,
  },
  websiteText: {
    fontSize: 14,
    color: CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
    marginTop: 5,
  },
  seoFooter: {
    margin: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  seoKeywords: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    lineHeight: 14,
  },
  bottomSpacing: {
    height: 50,
  },
});

export default WelcomeScreen;