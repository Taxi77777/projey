import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CONFIG } from '../constants/config';
import { i18n } from '../i18n';
import { pricingService } from '../services/pricingService';
import type { RootStackParamList, TripQuote } from '../../App';

type QuoteScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Quote'
>;

const QuoteScreen: React.FC = () => {
  const navigation = useNavigation<QuoteScreenNavigationProp>();
  
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [quote, setQuote] = useState<TripQuote | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculateQuote = async () => {
    if (!departure.trim() || !destination.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir les adresses de départ et d\'arrivée');
      return;
    }

    setLoading(true);

    try {
      // Simulation simple sans API Google (pour la démo)
      const distance = Math.random() * 50 + 5; // 5-55 km
      const tripDate = new Date(date + 'T' + time);
      const hour = tripDate.getHours();
      const isNightRate = hour < 7 || hour >= 19;
      const rate = isNightRate ? CONFIG.PRICING.NIGHT_RATE : CONFIG.PRICING.DAY_RATE;
      const price = distance * rate;

      const mockQuote: TripQuote = {
        departure: {
          address: departure,
          latitude: 48.8584,
          longitude: 2.6331,
        },
        destination: {
          address: destination,
          latitude: 48.8566,
          longitude: 2.3522,
        },
        date: tripDate,
        time: time,
        distance: distance,
        price: Math.round(price * 100) / 100,
        isNightRate: isNightRate,
      };

      setQuote(mockQuote);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de calculer le tarif. Veuillez réessayer.');
      console.error('Quote calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToBooking = () => {
    if (quote) {
      navigation.navigate('Booking', { quote });
    }
  };

  const renderQuoteResult = () => {
    if (!quote) return null;

    return (
      <View style={styles.quoteResult}>
        <Text style={styles.resultTitle}>{i18n.t('quote.result')}</Text>
        
        <View style={styles.resultCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Trajet:</Text>
            <Text style={styles.resultValue} numberOfLines={2}>
              {quote.departure.address} → {quote.destination.address}
            </Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Date/Heure:</Text>
            <Text style={styles.resultValue}>
              {quote.date.toLocaleDateString('fr-FR')} à {quote.time}
            </Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Distance:</Text>
            <Text style={styles.resultValue}>{quote.distance.toFixed(1)} km</Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tarif appliqué:</Text>
            <Text style={styles.resultValue}>
              {quote.isNightRate ? 'Nuit (19h-7h)' : 'Jour (7h-19h)'} - 
              {quote.isNightRate ? CONFIG.PRICING.NIGHT_RATE : CONFIG.PRICING.DAY_RATE}€/km
            </Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prix total:</Text>
            <Text style={styles.priceValue}>€{quote.price.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.bookingButton} onPress={handleProceedToBooking}>
          <Text style={styles.bookingButtonText}>{i18n.t('quote.proceedToBooking')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPopularDestinations = () => (
    <View style={styles.popularSection}>
      <Text style={styles.sectionTitle}>🎯 Destinations populaires</Text>
      <View style={styles.destinationGrid}>
        {[
          { name: 'Disneyland Paris', address: 'Disneyland Paris, Chessy' },
          { name: 'Aéroport CDG', address: 'Aéroport Charles de Gaulle, Roissy-en-France' },
          { name: 'Aéroport Orly', address: 'Aéroport d\'Orly, Orly' },
          { name: 'Val d\'Europe', address: 'Val d\'Europe, Serris' },
        ].map((dest, index) => (
          <TouchableOpacity
            key={index}
            style={styles.destinationChip}
            onPress={() => setDestination(dest.address)}
          >
            <Text style={styles.destinationText}>{dest.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('quote.title')}</Text>
        <Text style={styles.subtitle}>{i18n.t('quote.subtitle')}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{i18n.t('quote.departure')}</Text>
          <TextInput
            style={styles.input}
            value={departure}
            onChangeText={setDeparture}
            placeholder="Ex: Torcy, Bussy-Saint-Georges..."
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{i18n.t('quote.destination')}</Text>
          <TextInput
            style={styles.input}
            value={destination}
            onChangeText={setDestination}
            placeholder="Ex: Disneyland Paris, Aéroport CDG..."
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.dateTimeRow}>
          <View style={styles.dateGroup}>
            <Text style={styles.label}>{i18n.t('quote.date')}</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.timeGroup}>
            <Text style={styles.label}>{i18n.t('quote.time')}</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.calculateButton, loading && styles.buttonDisabled]} 
          onPress={handleCalculateQuote}
          disabled={loading}
        >
          <Text style={styles.calculateButtonText}>
            {loading ? 'Calcul en cours...' : i18n.t('quote.calculate')}
          </Text>
        </TouchableOpacity>
      </View>

      {renderPopularDestinations()}

      <View style={styles.pricingInfo}>
        <Text style={styles.sectionTitle}>💰 Tarifs</Text>
        <Text style={styles.priceText}>{i18n.t('quote.dayRate')}</Text>
        <Text style={styles.priceText}>{i18n.t('quote.nightRate')}</Text>
        <Text style={styles.priceNote}>
          Les tarifs sont calculés automatiquement selon l'heure du trajet.
        </Text>
      </View>

      {renderQuoteResult()}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  header: {
    padding: 20,
    backgroundColor: CONFIG.COLORS.PRIMARY,
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
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
  dateTimeRow: {
    flexDirection: 'row',
    gap: 15,
  },
  dateGroup: {
    flex: 2,
  },
  timeGroup: {
    flex: 1,
  },
  calculateButton: {
    backgroundColor: CONFIG.COLORS.SECONDARY,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  popularSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
    marginBottom: 15,
  },
  destinationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  destinationChip: {
    backgroundColor: CONFIG.COLORS.PRIMARY,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  destinationText: {
    color: CONFIG.COLORS.WHITE,
    fontSize: 14,
    fontWeight: '500',
  },
  pricingInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  priceText: {
    fontSize: 16,
    color: CONFIG.COLORS.BLACK,
    marginBottom: 5,
  },
  priceNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  quoteResult: {
    margin: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CONFIG.COLORS.PRIMARY,
    marginBottom: 15,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: CONFIG.COLORS.GRAY,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  resultValue: {
    fontSize: 14,
    color: CONFIG.COLORS.BLACK,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
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
  bookingButton: {
    backgroundColor: CONFIG.COLORS.SECONDARY,
    paddingVertical: 15,
    borderRadius: 8,
  },
  bookingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.COLORS.BLACK,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 50,
  },
});

export default QuoteScreen;