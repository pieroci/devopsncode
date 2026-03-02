# 🔫 STREET CHAOS - GTA Style Open World Game

Un gioco open world in stile GTA con vista dall'alto, sviluppato con HTML5 Canvas. Commetti crimini, ruba auto, usa armi e sopravvivi alla polizia, agenti segreti e all'esercito!

## 🎮 Caratteristiche del Gioco

### Gameplay Principale
- **Open World**: Mappa di città esplorabile con edifici, veicoli e NPC
- **Sistema di Combattimento**: 5 armi diverse (Pugno, Pistola, Fucile, Shotgun, RPG)
- **Furto di Auto**: Ruba veicoli dai civili e guida per la città
- **Sistema di Ricercato**: 5 livelli di wanted (stelle)
- **Economia**: Guadagna soldi commettendo crimini
- **Fisica Realistica**: Esplosioni, particelle, collisioni

### Sistema di Ricercato ⭐
1. **★ Livello 1**: Polizia base ti insegue
2. **★★ Livello 2**: Più poliziotti, più aggressivi
3. **★★★ Livello 3**: Agenti segreti con veicoli veloci
4. **★★★★ Livello 4**: Agenti segreti in forze
5. **★★★★★ Livello 5**: Esercito con carri armati ed elicotteri (rappresentati come veicoli pesanti)

### Armi Disponibili
- **1. Pugno**: Danni base, munizioni infinite
- **2. Pistola**: 50 colpi, buona precisione
- **3. Fucile**: 200 colpi, automatico
- **4. Shotgun**: 30 colpi, alto danno a corto raggio
- **5. RPG**: 10 razzi, esplosivi devastanti

### Tipi di Veicoli
- **Sedan**: Velocità media, resistenza media
- **Sports Car**: Alta velocità, bassa resistenza
- **SUV**: Bassa velocità, alta resistenza
- **Truck**: Molto lento, altissima resistenza
- **Police**: Velocità media-alta (usato dalla polizia)

## 🎯 Comandi

### Tastiera
- **W,A,S,D**: Movimento (a piedi o guida)
- **Spazio**: Freno (in veicolo)
- **E**: Entra/Esci dal veicolo
- **F**: Ruba auto (caccia l'NPC e prendi il controllo)
- **1-5**: Cambia arma

### Mouse
- **Movimento Mouse**: Mira
- **Click Sinistro**: Spara/Attacca
- **Mira Automatica**: Il personaggio guarda verso il mouse

## 📊 HUD Interfaccia

- **💰 Soldi**: Denaro guadagnato
- **❤️ Salute**: Punti vita (0-100%)
- **🚗 Veicolo**: Tipo di veicolo corrente o "A piedi"
- **⏱️ Tempo**: Tempo di sopravvivenza
- **⭐ Stelle**: Livello di ricercato (0-5)
- **🔫 Arma**: Arma corrente e munizioni
- **🗺️ Mini-Mappa**: Mappa in tempo reale (angolo inferiore destro)

## 🏆 Sistema di Punteggio

Al termine del gioco vedrai:
- **💰 Soldi guadagnati**: Totale denaro accumulato
- **⏱️ Tempo sopravvissuto**: Quanto tempo sei durato
- **💀 Nemici eliminati**: Numero di kill
- **🚗 Auto rubate**: Numero di veicoli rubati
- **⭐ Livello ricercato massimo**: Stelle massime raggiunte

## 🌐 Leaderboard Online

Il gioco include un sistema di classifica locale (localStorage) e supporto per un backend online.

### Leaderboard Locale
- Salvataggio automatico nel browser
- Top 10 giocatori
- Ordine per soldi guadagnati

### Backend Server (Opzionale)
Il gioco include un server Node.js/Express per la classifica online.

## 🚀 Come Giocare

### Metodo 1: Solo HTML (Offline)
1. Apri il file `gta-style-game.html` in un browser moderno
2. Clicca su "INIZIA CHAOS!"
3. Gioca!

### Metodo 2: Con Server (Online Leaderboard)
```bash
# Installa le dipendenze
npm install

# Avvia il server
npm start

# Oppure in modalità sviluppo (con auto-reload)
npm run dev

# Il server parte su http://localhost:3000
```

Quindi apri http://localhost:3000 nel browser.

## 📱 Progressive Web App (PWA)

Il gioco supporta PWA per installazione su dispositivi mobili:

1. Apri il gioco in Chrome/Edge/Safari
2. Clicca su "Aggiungi alla schermata Home"
3. L'app sarà installata come app nativa
4. Gioca anche offline!

### Controlli Mobile (Futuri)
- Touch screen per movimento
- Pulsanti virtuali per azioni
- Joystick virtuale

## 🎨 Caratteristiche Tecniche

### Grafica
- Rendering Canvas 2D (1200x800px)
- Sistema di particelle per effetti
- Animazioni fluide (60 FPS)
- Mini-mappa in tempo reale
- Effetti esplosioni

### Fisica
- Sistema di collisione rettangolare
- Momentum e accelerazione per veicoli
- Proiettili balistici
- Esplosioni con area d'effetto

### IA
- **NPC Civili**: Camminano casualmente, fuggono se spaventati
- **Polizia**: Insegue il giocatore, spara
- **Agenti**: Più veloci e precisi della polizia
- **Esercito**: Carri armati con armi devastanti

### Mappa
- Generazione procedurale edifici
- Dimensione: 3000x3000 unità
- 30+ edifici per mappa
- 20+ veicoli in circolazione
- 30+ NPC attivi

## 🔧 API Backend (Server)

### Endpoints Disponibili

#### GET /api/leaderboard
Ottieni la classifica completa
```bash
curl http://localhost:3000/api/leaderboard
```

#### GET /api/leaderboard/top/:count
Ottieni i top N giocatori
```bash
curl http://localhost:3000/api/leaderboard/top/10
```

#### POST /api/score
Invia un punteggio
```bash
curl -X POST http://localhost:3000/api/score \
  -H "Content-Type: application/json" \
  -d '{"name":"Player1","money":5000,"time":300,"kills":50,"cars":10,"wanted":5}'
```

#### GET /api/stats
Ottieni statistiche globali
```bash
curl http://localhost:3000/api/stats
```

#### GET /api/player/:name
Cerca punteggi per nome
```bash
curl http://localhost:3000/api/player/Player1
```

#### GET /api/health
Controlla stato server
```bash
curl http://localhost:3000/api/health
```

## 🎯 Obiettivi e Strategie

### Come Sopravvivere
1. **Usa i Veicoli**: Sono più veloci e resistenti
2. **Evita le Stelle**: Nasconditi per far diminuire il wanted
3. **Conserva Munizioni**: L'RPG è potente ma limitato
4. **Usa gli Edifici**: Come copertura dagli spari
5. **Ruba Auto Costantemente**: Per sfuggire quando danneggiato

### Come Fare Soldi
- Ruba auto: +$100
- Uccidi NPC: +$10-50
- Uccidi polizia: +$200
- Uccidi agenti: +$500
- Uccidi militari: +$1000

### Crimini e Wanted
Ogni crimine aumenta le stelle:
- Sparare/Uccidere NPC: +20 punti
- Uccidere polizia: +30 punti
- Uccidere agenti: +40 punti
- Uccidere militari: +50 punti
- Rubare auto: +50 punti
- Esplosioni: +30 punti

Le stelle diminuiscono lentamente se non commetti crimini per 5 secondi.

## 📦 Struttura File

```
devopsncode/
├── gta-style-game.html      # Gioco principale (standalone)
├── mario-kart-game.html      # Gioco racing originale
├── server.js                 # Backend Node.js per leaderboard
├── package.json              # Dipendenze Node.js
├── manifest.json             # PWA manifest
├── leaderboard.json          # Dati classifica (generato automaticamente)
├── README.md                 # Questo file
├── .gitignore               # File da ignorare in Git
└── LICENSE                   # Licenza MIT
```

## 🔐 Sicurezza

- Validazione input lato server
- Limite lunghezza nomi giocatori
- Protezione CORS configurata
- Rate limiting (da implementare per produzione)
- Sanitizzazione dati

## 🚧 Roadmap Future

### Prossime Funzionalità
- [ ] Multiple mappe/città
- [ ] Missioni e obiettivi
- [ ] Negozi di armi e garage
- [ ] Ciclo giorno/notte
- [ ] Effetti meteo (pioggia, nebbia)
- [ ] Sistema di salvataggio/caricamento
- [ ] Multiplayer locale
- [ ] Controlli touch ottimizzati
- [ ] Più tipi di armi e veicoli
- [ ] Sistema di achievement
- [ ] Suoni ed effetti sonori
- [ ] Musica di sottofondo
- [ ] Boss battles
- [ ] Helicopter chase (elicotteri veri)
- [ ] Tank battles migliorati

### Miglioramenti Tecnici
- [ ] WebGL rendering per performance
- [ ] Web Workers per IA
- [ ] Compressione risorse
- [ ] Service Worker per offline
- [ ] Autenticazione giocatori
- [ ] Database cloud per leaderboard
- [ ] Chat multiplayer

## 📝 Crediti

- **Sviluppo**: DevOpsNCode Team
- **Concept**: Ispirato a GTA series
- **Engine**: HTML5 Canvas + JavaScript vanilla
- **Backend**: Node.js + Express

## 📄 Licenza

MIT License - Vedi il file LICENSE per i dettagli.

## 🤝 Contribuire

Contributi benvenuti! Sentiti libero di:
1. Fare fork del progetto
2. Creare un branch per la tua feature
3. Commit le modifiche
4. Push al branch
5. Aprire una Pull Request

## 🐛 Bug Report

Hai trovato un bug? Apri una issue su GitHub con:
- Descrizione del problema
- Passaggi per riprodurlo
- Screenshot se possibile
- Browser e versione

## 💡 Suggerimenti

Hai idee per migliorare il gioco? Apri una issue con il tag "enhancement"!

---

**Buon divertimento e... fai chaos! 🔫🚗💥**

---

## 🎮 Quick Start

```bash
# Clona il repository
git clone https://github.com/pieroci/devopsncode.git
cd devopsncode

# Metodo 1: Gioca subito (offline)
# Apri gta-style-game.html nel browser

# Metodo 2: Con server (online leaderboard)
npm install
npm start
# Vai su http://localhost:3000
```

## 📊 Stati e Achievement

### Livelli di Criminale
- **Cittadino Modello**: 0 crimini
- **Piccolo Criminale**: 1-10 crimini
- **Gangster**: 11-50 crimini
- **Boss Criminale**: 51-100 crimini
- **Leggenda del Crimine**: 100+ crimini
- **Re del Chaos**: 5 stelle + 30 minuti survived

### Record da Battere
- 💰 **Soldi**: $50,000+
- ⏱️ **Tempo**: 30+ minuti
- 💀 **Kill**: 100+ nemici
- 🚗 **Auto**: 50+ veicoli rubati
- ⭐ **Wanted**: Raggiungere 5 stelle

Sfida te stesso e gli altri giocatori! 🏆
