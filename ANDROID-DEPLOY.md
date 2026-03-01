# 📱 Guida per Deploy su Android (Google Play Store)

## Panoramica

Street Chaos è una Progressive Web App (PWA) che può essere convertita in un'app Android nativa usando strumenti come **Cordova** o **Capacitor**.

## Metodo 1: PWA Trusted Web Activity (Consigliato)

### Requisiti
- Android Studio
- Google Play Console account
- Dominio web con HTTPS

### Passaggi

1. **Hosting del Gioco**
   ```bash
   # Carica il gioco su un server HTTPS
   # Esempio: https://tuodominio.com/gta-style-game.html
   ```

2. **Bubblewrap (Google Tool)**
   ```bash
   npm install -g @bubblewrap/cli
   bubblewrap init --manifest https://tuodominio.com/manifest.json
   bubblewrap build
   ```

3. **Firma l'APK**
   ```bash
   # Genera keystore
   keytool -genkey -v -keystore my-release-key.keystore \
     -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
   
   # Firma l'app
   jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
     -keystore my-release-key.keystore app-release-unsigned.apk alias_name
   ```

4. **Carica su Play Store**
   - Vai su Google Play Console
   - Crea nuova applicazione
   - Carica l'APK firmato
   - Compila le info richieste
   - Pubblica

## Metodo 2: Apache Cordova

### Setup
```bash
npm install -g cordova

# Crea progetto
cordova create StreetChaos com.yourcompany.streetchaos StreetChaos
cd StreetChaos

# Aggiungi piattaforma Android
cordova platform add android

# Copia i file del gioco
cp ../gta-style-game.html www/index.html
cp ../manifest.json www/
```

### Configurazione (config.xml)
```xml
<?xml version='1.0' encoding='utf-8'?>
<widget id="com.devopsncode.streetchaos" version="1.0.0" xmlns="http://www.w3.org/ns/widgets">
    <name>Street Chaos</name>
    <description>
        GTA-style open world action game
    </description>
    <author email="dev@devopsncode.com" href="http://devopsncode.com">
        DevOpsNCode Team
    </author>
    <content src="index.html" />
    <preference name="Fullscreen" value="true" />
    <preference name="Orientation" value="landscape" />
    <platform name="android">
        <icon density="ldpi" src="res/icon/android/ldpi.png" />
        <icon density="mdpi" src="res/icon/android/mdpi.png" />
        <icon density="hdpi" src="res/icon/android/hdpi.png" />
        <icon density="xhdpi" src="res/icon/android/xhdpi.png" />
        <icon density="xxhdpi" src="res/icon/android/xxhdpi.png" />
        <icon density="xxxhdpi" src="res/icon/android/xxxhdpi.png" />
    </platform>
</widget>
```

### Build
```bash
# Debug build
cordova build android

# Release build
cordova build android --release

# APK location: platforms/android/app/build/outputs/apk/release/
```

## Metodo 3: Capacitor (Consigliato per PWA)

### Setup
```bash
npm install @capacitor/core @capacitor/cli
npx cap init StreetChaos com.devopsncode.streetchaos --web-dir www

# Aggiungi Android
npm install @capacitor/android
npx cap add android

# Copia files
npx cap copy

# Apri in Android Studio
npx cap open android
```

### Configurazione (capacitor.config.json)
```json
{
  "appId": "com.devopsncode.streetchaos",
  "appName": "Street Chaos",
  "webDir": "www",
  "bundledWebRuntime": false,
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#000000",
      "showSpinner": false
    }
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true,
    "webContentsDebuggingEnabled": false
  }
}
```

### Build in Android Studio
1. Apri il progetto in Android Studio
2. Build → Generate Signed Bundle / APK
3. Scegli APK
4. Crea nuovo keystore o usa esistente
5. Build Release
6. Ottieni APK da `app/release/`

## Icone Necessarie

### Genera icone di varie dimensioni:

**LDPI** (36x36)
**MDPI** (48x48)
**HDPI** (72x72)
**XHDPI** (96x96)
**XXHDPI** (144x144)
**XXXHDPI** (192x192)

### Tool per generare icone:
- https://romannurik.github.io/AndroidAssetStudio/
- https://icon.kitchen/

## Screenshot per Play Store

Requisiti Google Play:
- **Phone**: 1080x1920 o 1920x1080 (2-8 screenshot)
- **7-inch Tablet**: 1200x1920 o 1920x1200 (opzionale)
- **10-inch Tablet**: 1440x2560 o 2560x1440 (opzionale)

```bash
# Prendi screenshot dal gioco in vari momenti:
# - Schermata iniziale
# - Gameplay in azione
# - Combattimento
# - Inseguimento polizia
# - Vari veicoli
# - Esplosioni
```

## Informazioni per Play Store

### Titolo
Street Chaos - GTA Style Game

### Descrizione Breve (80 caratteri)
Azione open world stile GTA: ruba auto, usa armi, fuggi dalla polizia!

### Descrizione Completa
```
🔫 STREET CHAOS - Azione Open World Estrema! 🚗

Immergiti in un mondo di crimini e caos in questo gioco open world in stile GTA!

🎮 CARATTERISTICHE:
• Open world esplorabile con edifici e veicoli
• 5 armi diverse: pugno, pistola, fucile, shotgun, RPG
• Ruba auto e guida per la città
• Sistema wanted a 5 stelle
• Combatti polizia, agenti segreti ed esercito
• Grafica retrò con effetti moderni
• Sistema di economia e punteggi
• Classifica online
• Completamente GRATIS!

⭐ SISTEMA WANTED:
Commetti crimini e aumenta il tuo livello di ricercato:
★ Livello 1-2: Polizia
★★★ Livello 3-4: Agenti Segreti
★★★★★ Livello 5: Esercito con carri armati

🚗 VEICOLI:
• Sedan, Sports Car, SUV, Truck
• Ogni veicolo con caratteristiche uniche
• Ruba auto dai civili o dalla polizia

💰 GUADAGNA SOLDI:
• Ruba veicoli
• Elimina nemici
• Sopravvivi il più a lungo possibile
• Scala la classifica globale!

🎯 CONTROLLI SEMPLICI:
• WASD per muoverti
• Mouse per mirare e sparare
• Cambio armi con tasti numerici
• Entra/esci dai veicoli con un click

Scarica ora e diventa il re del crimine! 🏆

NOTA: Gioco violento consigliato per 18+
```

### Categoria
Giochi → Azione

### Content Rating
Maturità - 18+ (violenza, crimini simulati)

### Privacy Policy
URL del sito con policy (richiesto da Google)

### Prezzo
Gratuito (con possibili acquisti in-app futuri)

## Requisiti Tecnici

### Permessi Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### Dimensione APK
- Target: < 50 MB
- Attualmente: ~5-10 MB (senza assets aggiuntivi)
- Ottimizza immagini se necessario

### Versioni Android Supportate
- **Min SDK**: 21 (Android 5.0 Lollipop)
- **Target SDK**: 33 (Android 13)
- **Compile SDK**: 33

## Test Prima del Deploy

### Test Locali
```bash
# Test debug su dispositivo
adb devices
cordova run android
# oppure
npx cap run android
```

### Test Beta (Consigliato)
1. Play Console → Gestione release
2. Carica APK in "Beta chiusa"
3. Invita tester (email)
4. Raccogli feedback
5. Correggi bug
6. Pubblica in produzione

## Monetizzazione (Opzionale)

### Google AdMob
```bash
# Aggiungi plugin
cordova plugin add cordova-plugin-admob-free
# oppure per Capacitor
npm install @capacitor-community/admob
```

### In-App Purchases
```bash
# Plugin per acquisti
cordova plugin add cordova-plugin-purchase
```

## Aggiornamenti

### Versioning
- Incrementa `versionCode` per ogni build
- Aggiorna `versionName` per release pubbliche
- Esempio: 1.0.0 → 1.0.1 (bugfix), 1.1.0 (features)

### Processo Aggiornamento
1. Modifica codice
2. Test completi
3. Incrementa versione
4. Build release
5. Carica su Play Console
6. Aggiorna changelog
7. Pubblica

## Checklist Pre-Pubblicazione

- [ ] Test su almeno 3 dispositivi Android diversi
- [ ] Test con diverse risoluzioni
- [ ] Test orientamento landscape
- [ ] Verifica crash e bug
- [ ] Ottimizza performance (60 FPS)
- [ ] Screenshot e video promozionali
- [ ] Icone tutte le dimensioni
- [ ] Privacy policy pubblicata
- [ ] Content rating compilato
- [ ] Descrizione tradotta (opzionale)
- [ ] Keywords ottimizzate per ASO

## ASO (App Store Optimization)

### Keywords Suggerite
- GTA style game
- open world action
- car theft game
- police chase
- crime simulator
- top down shooter
- retro action game
- free action game

### Localizzazioni Consigliate
- 🇮🇹 Italiano (primaria)
- 🇬🇧 Inglese
- 🇪🇸 Spagnolo
- 🇫🇷 Francese
- 🇩🇪 Tedesco
- 🇧🇷 Portoghese (Brasile)

## Supporto Post-Launch

### Monitoraggio
- Crash reports (Firebase Crashlytics)
- Analytics (Google Analytics)
- Recensioni utenti
- Rating medio

### Rispondi alle Recensioni
- Ringrazia feedback positivi
- Risolvi problemi segnalati
- Pianifica aggiornamenti basati su richieste

## Link Utili

- **Play Console**: https://play.google.com/console
- **Cordova Docs**: https://cordova.apache.org/docs/
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Bubblewrap**: https://github.com/GoogleChromeLabs/bubblewrap
- **Icon Generator**: https://icon.kitchen/
- **Screenshot Tools**: https://appetize.io/

## Costi

- **Google Play Developer Account**: $25 (una tantum)
- **Hosting Web** (per PWA): $5-20/mese
- **Domini**: $10-15/anno
- **SSL Certificate**: Gratuito (Let's Encrypt)

## Note Legali

⚠️ **IMPORTANTE**:
- Assicurati di avere diritti su tutti gli asset
- Non usare marchi registrati (GTA è trademark di Rockstar)
- Indica chiaramente che è un gioco ispirato, non ufficiale
- Rispetta le policy di Google Play
- Implementa content rating corretto (18+)

## Conclusione

Seguendo questa guida, potrai pubblicare Street Chaos su Google Play Store. Il processo richiede tempo e attenzione ai dettagli, ma il risultato sarà un'app professionale disponibile a milioni di utenti Android!

Buona fortuna! 🚀📱
