# 🚖 BUILD & TEST - Taxi Marne-la-Vallée App

## 🏗️ COMPILATION ET BUILD

### Prérequis
```bash
# Node.js 18+ et npm/yarn
node --version  # v18+
npm --version   # 9+

# React Native CLI
npm install -g @react-native-community/cli

# Android Studio avec SDK Platform-Tools
# JDK 11 ou 17
```

### Installation des dépendances
```bash
cd TaxiMarneApp
npm install

# Pour iOS (si développement macOS)
cd ios && pod install && cd ..
```

### Build Android (Debug)
```bash
# Démarrer Metro bundler
npx react-native start

# Dans un nouveau terminal - Build et run Android
npx react-native run-android
```

### Build Android (Release)
```bash
# Générer le bundle de release
cd android
./gradlew bundleRelease

# Générer l'APK signé
./gradlew assembleRelease
```

## 🧪 TESTS ET VALIDATION

### Tests Unitaires
```bash
npm test
```

### Tests End-to-End
```bash
# Installer Detox pour les tests E2E
npm install -g detox-cli
detox build --configuration android
detox test --configuration android
```

### Validation ASO
- [x] Titre optimisé (50 chars): ✅ "Taxi Marne-la-Vallée - Réservation Disneyland"
- [x] Description courte (80 chars): ✅ "Réservation taxi Disneyland • Transport CDG Orly • App sans inscription"
- [x] Mots-clés intégrés dans l'app: ✅ Toutes les zones desservies visibles
- [x] Support multilingue: ✅ 6 langues (FR, EN, ES, DE, IT, AR)
- [x] Contact visible: ✅ WhatsApp, Email, Site web
- [x] Fonctionnalités SEO: ✅ Simulation obligatoire, sans inscription

## 📱 FONCTIONNALITÉS TESTÉES

### ✅ Écran d'accueil (WelcomeScreen)
- [x] Affichage des zones desservies (SEO critical)
- [x] Sélecteur de langue multilingue
- [x] Bouton CTA vers simulation
- [x] Informations de contact
- [x] Tarifs transparents
- [x] Destinations populaires

### 🔄 Écran de simulation (QuoteScreen) - À créer
- [ ] Autocomplétion Google Places
- [ ] Sélection date/heure
- [ ] Calcul prix jour/nuit
- [ ] Validation obligatoire avant réservation

### 🔄 Écran de réservation (BookingScreen) - À créer
- [ ] Formulaire client complet
- [ ] Sélection pays + téléphone
- [ ] Récapitulatif tarif
- [ ] Validation formulaire

### 🔄 Écran de succès (SuccessScreen) - À créer
- [ ] Confirmation envoi WhatsApp
- [ ] Confirmation envoi Email
- [ ] Bouton nouvelle réservation

## 🌐 TESTS MULTILINGUES

### Langues supportées:
- [x] 🇫🇷 Français (par défaut)
- [x] 🇬🇧 Anglais
- [x] 🇪🇸 Espagnol  
- [x] 🇩🇪 Allemand
- [x] 🇮🇹 Italien
- [x] 🇸🇦 Arabe

### Test changement de langue:
```javascript
// Tester dans l'app
i18n.setLanguage('en');  // Switch to English
i18n.setLanguage('de');  // Switch to German
i18n.setLanguage('ar');  // Switch to Arabic
```

## 🚀 DÉPLOIEMENT GOOGLE PLAY STORE

### Génération du bundle AAB
```bash
cd android
./gradlew bundleRelease

# Le fichier sera généré ici:
# android/app/build/outputs/bundle/release/app-release.aab
```

### Signature APK
```bash
# Créer le keystore (première fois)
keytool -genkey -v -keystore taxi-marne-release-key.keystore -alias taxi-marne -keyalg RSA -keysize 2048 -validity 10000

# Signer l'APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore taxi-marne-release-key.keystore app-release-unsigned.apk taxi-marne
```

### Upload Google Play Console
1. Créer l'app sur [Google Play Console](https://play.google.com/console)
2. Titre: **Taxi Marne-la-Vallée - Réservation Disneyland**
3. Description courte: **Réservation taxi Disneyland • Transport CDG Orly • App sans inscription**
4. Upload AAB file
5. Screenshots des 4 écrans principaux
6. Icône 512x512 avec logo taxi

## 📊 MÉTRIQUES À SUIVRE

### KPIs Techniques
- Temps de chargement app < 3s
- Taille APK < 50MB
- Crash rate < 1%
- Note Play Store > 4.5⭐

### KPIs Business
- Taux conversion simulation → réservation > 30%
- Temps moyen simulation < 2 minutes
- Satisfaction client (reviews)

## 🔗 LIENS DE TEST

### 🌐 Demo Web (à créer)
- **URL**: `https://taxi-marne-app-demo.vercel.app`
- **Status**: 🔄 En développement

### 📱 APK de Test
- **Lien APK Debug**: À générer après build complet
- **QR Code**: À générer pour téléchargement direct

### 🛜 Test en ligne (React Native Web)
- **URL démo**: À déployer sur Vercel/Netlify
- **Compatible**: Chrome, Safari, Firefox

## ⚡ COMMANDES RAPIDES

```bash
# Build complet
npm run build:android

# Test avec device
npm run android:device

# Release build
npm run build:release

# Test ASO
npm run test:aso

# Deploy demo
npm run deploy:demo
```

## 🎯 PROCHAINES ÉTAPES

1. **Finaliser les écrans manquants** (Quote, Booking, Success)
2. **Intégrer Google Places API** pour autocomplétion
3. **Tester sur device réel Android**
4. **Générer APK de test** 
5. **Créer demo web** pour tests utilisateurs
6. **Upload Google Play Store** en version beta
7. **Optimiser ASO** avec premiers retours

---

## 🚀 LIEN DE TEST FINAL

**Une fois l'application complètement buildée, le lien de test sera disponible ici :**

### 📲 APK Test Direct
```
https://github.com/taxi-marne-app/releases/download/v1.0.0-beta/taxi-marne-app.apk
```

### 🌐 Demo Web Interactive  
```
https://taxi-marne-lavallee-demo.vercel.app
```

### 📱 QR Code de téléchargement
```
[QR CODE sera généré après build]
```

**Status actuel**: 🔄 Application en cours de développement
**ETA lien de test**: Après finalisation des écrans Quote/Booking/Success

---

Cette application est optimisée ASO pour dominer les recherches "taxi marne-la-vallée", "réservation taxi disneyland", et "transport CDG Orly" sur le Google Play Store ! 🚀