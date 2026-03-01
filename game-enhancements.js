// Enhanced Game Features Module for Street Chaos

// Achievement System
const achievements = [
    { id: 'first_blood', name: 'First Blood', description: 'Elimina il primo nemico', unlocked: false, reward: 100 },
    { id: 'car_thief', name: 'Ladro di Auto', description: 'Ruba 10 veicoli', unlocked: false, reward: 500 },
    { id: 'wanted_man', name: 'Ricercato', description: 'Raggiungi 5 stelle', unlocked: false, reward: 1000 },
    { id: 'survivor', name: 'Sopravvissuto', description: 'Sopravvivi 10 minuti', unlocked: false, reward: 2000 },
    { id: 'millionaire', name: 'Milionario', description: 'Guadagna $10,000', unlocked: false, reward: 5000 },
    { id: 'mass_destruction', name: 'Distruzione di Massa', description: 'Uccidi 50 nemici', unlocked: false, reward: 3000 },
    { id: 'cop_killer', name: 'Killer di Poliziotti', description: 'Elimina 20 poliziotti', unlocked: false, reward: 2500 },
    { id: 'tank_destroyer', name: 'Distruttore di Carri', description: 'Distruggi un carro armato', unlocked: false, reward: 5000 },
    { id: 'speed_demon', name: 'Demone della Velocità', description: 'Ruba una Sports Car', unlocked: false, reward: 300 },
    { id: 'untouchable', name: 'Intoccabile', description: 'Raggiungi 5 minuti senza subire danni', unlocked: false, reward: 4000 }
];

// Mission System
const missions = [
    {
        id: 'steal_cars',
        name: 'Auto Rubate',
        description: 'Ruba 5 veicoli',
        objective: { type: 'steal_cars', target: 5 },
        reward: 1000,
        active: false,
        completed: false
    },
    {
        id: 'survive_time',
        name: 'Sopravvivenza',
        description: 'Sopravvivi 5 minuti',
        objective: { type: 'survive', target: 300000 },
        reward: 1500,
        active: false,
        completed: false
    },
    {
        id: 'eliminate_enemies',
        name: 'Eliminazione',
        description: 'Elimina 20 nemici',
        objective: { type: 'kills', target: 20 },
        reward: 2000,
        active: false,
        completed: false
    },
    {
        id: 'earn_money',
        name: 'Ricchezza',
        description: 'Guadagna $5,000',
        objective: { type: 'money', target: 5000 },
        reward: 3000,
        active: false,
        completed: false
    },
    {
        id: 'max_wanted',
        name: 'Ricercato Numero Uno',
        description: 'Raggiungi il livello ricercato massimo',
        objective: { type: 'wanted', target: 5 },
        reward: 5000,
        active: false,
        completed: false
    }
];

// Sound Effects (Web Audio API simulation)
class SoundManager {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.volume = 0.5;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.enabled = false;
        }
    }
    
    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.context) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(this.volume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    }
    
    playShoot() {
        this.playTone(800, 0.1, 'square');
    }
    
    playExplosion() {
        this.playTone(80, 0.5, 'sawtooth');
        setTimeout(() => this.playTone(40, 0.3, 'sawtooth'), 100);
    }
    
    playCarStart() {
        this.playTone(200, 0.3, 'sawtooth');
    }
    
    playPickup() {
        this.playTone(600, 0.2, 'sine');
        setTimeout(() => this.playTone(800, 0.2, 'sine'), 100);
    }
    
    playDeath() {
        this.playTone(400, 0.1, 'square');
        setTimeout(() => this.playTone(300, 0.1, 'square'), 100);
        setTimeout(() => this.playTone(200, 0.3, 'square'), 200);
    }
    
    playSiren() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.playTone(800, 0.2, 'sine');
                setTimeout(() => this.playTone(600, 0.2, 'sine'), 200);
            }, i * 400);
        }
    }
}

// Weather System
class WeatherSystem {
    constructor() {
        this.currentWeather = 'clear';
        this.rainDrops = [];
        this.changeInterval = 120000; // Change every 2 minutes
        this.lastChange = 0;
    }
    
    update(gameTime) {
        if (gameTime - this.lastChange > this.changeInterval) {
            this.changeWeather();
            this.lastChange = gameTime;
        }
        
        if (this.currentWeather === 'rain') {
            // Add rain drops
            if (Math.random() < 0.3) {
                this.rainDrops.push({
                    x: Math.random() * 1200,
                    y: -10,
                    speed: 5 + Math.random() * 3,
                    length: 10 + Math.random() * 10
                });
            }
            
            // Update rain drops
            this.rainDrops = this.rainDrops.filter(drop => {
                drop.y += drop.speed;
                return drop.y < 800;
            });
        }
    }
    
    changeWeather() {
        const weathers = ['clear', 'rain', 'fog'];
        this.currentWeather = weathers[Math.floor(Math.random() * weathers.length)];
    }
    
    draw(ctx) {
        if (this.currentWeather === 'rain') {
            ctx.strokeStyle = 'rgba(200, 200, 255, 0.5)';
            ctx.lineWidth = 1;
            this.rainDrops.forEach(drop => {
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x + 2, drop.y + drop.length);
                ctx.stroke();
            });
        } else if (this.currentWeather === 'fog') {
            ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
            ctx.fillRect(0, 0, 1200, 800);
        }
    }
}

// Power-ups System
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'health', 'ammo', 'armor', 'speed'
        this.width = 30;
        this.height = 30;
        this.lifetime = 30000; // 30 seconds
        this.created = Date.now();
    }
    
    draw(ctx, camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        
        // Pulsing effect
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 1;
        ctx.scale(pulse, pulse);
        
        switch(this.type) {
            case 'health':
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(-15, -15, 30, 30);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-10, -2, 20, 4);
                ctx.fillRect(-2, -10, 4, 20);
                break;
            case 'ammo':
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(-15, -15, 30, 30);
                ctx.fillStyle = '#000000';
                ctx.fillRect(-10, -5, 20, 10);
                break;
            case 'armor':
                ctx.fillStyle = '#0000ff';
                ctx.fillRect(-15, -15, 30, 30);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.strokeRect(-12, -12, 24, 24);
                break;
            case 'speed':
                ctx.fillStyle = '#ff00ff';
                ctx.beginPath();
                ctx.moveTo(-15, 0);
                ctx.lineTo(15, 0);
                ctx.lineTo(0, -15);
                ctx.closePath();
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
    
    isExpired() {
        return Date.now() - this.created > this.lifetime;
    }
}

// Day/Night Cycle
class DayNightCycle {
    constructor() {
        this.time = 12 * 60; // Start at noon (minutes)
        this.speed = 0.1; // Game minutes per real second
    }
    
    update(deltaTime) {
        this.time += this.speed * (deltaTime / 1000);
        if (this.time >= 24 * 60) this.time = 0;
    }
    
    getHour() {
        return Math.floor(this.time / 60);
    }
    
    getMinute() {
        return Math.floor(this.time % 60);
    }
    
    getTimeString() {
        const hour = this.getHour().toString().padStart(2, '0');
        const minute = this.getMinute().toString().padStart(2, '0');
        return `${hour}:${minute}`;
    }
    
    isNight() {
        const hour = this.getHour();
        return hour < 6 || hour >= 20;
    }
    
    getAmbientColor() {
        const hour = this.getHour();
        if (hour >= 6 && hour < 8) {
            // Dawn - orange tint
            return 'rgba(255, 150, 50, 0.2)';
        } else if (hour >= 8 && hour < 18) {
            // Day - clear
            return 'rgba(0, 0, 0, 0)';
        } else if (hour >= 18 && hour < 20) {
            // Dusk - purple tint
            return 'rgba(150, 50, 255, 0.2)';
        } else {
            // Night - dark blue tint
            return 'rgba(0, 0, 100, 0.4)';
        }
    }
    
    applyLighting(ctx) {
        ctx.fillStyle = this.getAmbientColor();
        ctx.fillRect(0, 0, 1200, 800);
    }
}

// Shop System
class Shop {
    constructor() {
        this.items = [
            { id: 'pistol_ammo', name: 'Munizioni Pistola', price: 100, type: 'ammo', weapon: 1, amount: 50 },
            { id: 'rifle_ammo', name: 'Munizioni Fucile', price: 200, type: 'ammo', weapon: 2, amount: 100 },
            { id: 'shotgun_ammo', name: 'Munizioni Shotgun', price: 150, type: 'ammo', weapon: 3, amount: 30 },
            { id: 'rpg_ammo', name: 'Razzi RPG', price: 500, type: 'ammo', weapon: 4, amount: 5 },
            { id: 'health_kit', name: 'Kit Medico', price: 300, type: 'health', amount: 50 },
            { id: 'armor', name: 'Giubbotto Antiproiettile', price: 500, type: 'armor', amount: 100 }
        ];
    }
    
    draw(ctx, camera, playerMoney) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(100, 100, 1000, 600);
        
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(100, 100, 1000, 600);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.fillText('🏪 NEGOZIO', 500, 150);
        
        ctx.font = '20px Arial';
        ctx.fillText(`💰 Soldi: $${playerMoney}`, 150, 200);
        
        ctx.font = 'bold 24px Arial';
        let y = 250;
        this.items.forEach((item, index) => {
            const canAfford = playerMoney >= item.price;
            ctx.fillStyle = canAfford ? '#00ff00' : '#666666';
            ctx.fillText(`${index + 1}. ${item.name} - $${item.price}`, 150, y);
            y += 50;
        });
        
        ctx.fillStyle = '#ffff00';
        ctx.font = '18px Arial';
        ctx.fillText('Premi 1-6 per comprare, ESC per uscire', 150, 650);
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        achievements,
        missions,
        SoundManager,
        WeatherSystem,
        PowerUp,
        DayNightCycle,
        Shop
    };
}
