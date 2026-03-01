const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple rate limiting middleware
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // max requests per window

function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }
    
    const record = rateLimitMap.get(ip);
    
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + RATE_LIMIT_WINDOW;
        return next();
    }
    
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests, please try again later' });
    }
    
    record.count++;
    next();
}

// Clean up rate limit map periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
}, RATE_LIMIT_WINDOW);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/', rateLimit); // Apply rate limiting to API routes

// Serve only specific static files, not the entire directory
app.use(express.static('public', {
    index: false,
    dotfiles: 'deny'
}));

// Serve specific game files explicitly
app.get('/gta-style-game.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'gta-style-game.html'));
});

app.get('/mario-kart-game.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'mario-kart-game.html'));
});

app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'manifest.json'));
});

app.get('/service-worker.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'service-worker.js'));
});

// Leaderboard data file
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

// Initialize leaderboard file if it doesn't exist
if (!fs.existsSync(LEADERBOARD_FILE)) {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([]));
}

// Helper function to read leaderboard
function getLeaderboard() {
    try {
        const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading leaderboard:', error);
        return [];
    }
}

// Helper function to save leaderboard
function saveLeaderboard(leaderboard) {
    try {
        fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving leaderboard:', error);
        return false;
    }
}

// Routes

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
    const leaderboard = getLeaderboard();
    const limit = parseInt(req.query.limit) || 100;
    res.json(leaderboard.slice(0, limit));
});

// Get top players
app.get('/api/leaderboard/top/:count', (req, res) => {
    const count = parseInt(req.params.count) || 10;
    const leaderboard = getLeaderboard();
    res.json(leaderboard.slice(0, count));
});

// Submit score
app.post('/api/score', (req, res) => {
    const { name, money, time, kills, cars, wanted } = req.body;
    
    // Validation
    if (!name || typeof money !== 'number' || typeof time !== 'number') {
        return res.status(400).json({ 
            error: 'Invalid data. Required: name (string), money (number), time (number)' 
        });
    }
    
    // Create score entry
    const score = {
        name: name.substring(0, 50), // Limit name length
        money,
        time,
        kills: kills || 0,
        cars: cars || 0,
        wanted: wanted || 0,
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random()
    };
    
    // Add to leaderboard
    const leaderboard = getLeaderboard();
    leaderboard.push(score);
    
    // Sort by money (descending)
    leaderboard.sort((a, b) => b.money - a.money);
    
    // Keep only top 1000
    const updatedLeaderboard = leaderboard.slice(0, 1000);
    
    // Save
    if (saveLeaderboard(updatedLeaderboard)) {
        // Find player's rank
        const rank = updatedLeaderboard.findIndex(s => s.id === score.id) + 1;
        res.json({ 
            success: true, 
            rank,
            message: `Posizione: #${rank}`,
            score 
        });
    } else {
        res.status(500).json({ error: 'Failed to save score' });
    }
});

// Get player stats
app.get('/api/stats', (req, res) => {
    const leaderboard = getLeaderboard();
    
    const stats = {
        totalPlayers: leaderboard.length,
        totalMoney: leaderboard.reduce((sum, s) => sum + s.money, 0),
        totalKills: leaderboard.reduce((sum, s) => sum + (s.kills || 0), 0),
        totalCars: leaderboard.reduce((sum, s) => sum + (s.cars || 0), 0),
        averageMoney: Math.floor(leaderboard.reduce((sum, s) => sum + s.money, 0) / leaderboard.length) || 0,
        highestScore: leaderboard[0] || null,
        longestTime: leaderboard.reduce((max, s) => s.time > max.time ? s : max, { time: 0 })
    };
    
    res.json(stats);
});

// Delete old scores (cleanup endpoint)
app.delete('/api/leaderboard/cleanup', (req, res) => {
    const leaderboard = getLeaderboard();
    const daysOld = parseInt(req.query.days) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const filtered = leaderboard.filter(score => {
        const scoreDate = new Date(score.timestamp);
        return scoreDate >= cutoffDate;
    });
    
    if (saveLeaderboard(filtered)) {
        res.json({ 
            success: true, 
            removed: leaderboard.length - filtered.length,
            remaining: filtered.length
        });
    } else {
        res.status(500).json({ error: 'Failed to cleanup leaderboard' });
    }
});

// Search player scores
app.get('/api/player/:name', (req, res) => {
    const leaderboard = getLeaderboard();
    const playerName = req.params.name.toLowerCase();
    const playerScores = leaderboard.filter(s => 
        s.name.toLowerCase().includes(playerName)
    );
    
    res.json(playerScores);
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Serve game files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'gta-style-game.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎮 Street Chaos Server running on port ${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET  /api/leaderboard - Get full leaderboard`);
    console.log(`   GET  /api/leaderboard/top/:count - Get top N players`);
    console.log(`   POST /api/score - Submit a score`);
    console.log(`   GET  /api/stats - Get game statistics`);
    console.log(`   GET  /api/player/:name - Search player scores`);
    console.log(`   GET  /api/health - Health check`);
});

module.exports = app;
