# 🚀 Guida al Deployment - Street Chaos

## Opzioni di Deployment

### 1. Deploy Locale (Sviluppo)
```bash
npm install
npm start
# Apri http://localhost:3000
```

### 2. Deploy su Heroku

#### Setup
```bash
# Installa Heroku CLI
# Vai su https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Crea app
heroku create street-chaos-game

# Deploy
git push heroku main

# Apri app
heroku open
```

#### Procfile (già incluso)
```
web: node server.js
```

### 3. Deploy su Vercel

#### Setup
```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy produzione
vercel --prod
```

#### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "*.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

### 4. Deploy su AWS (EC2)

#### Setup EC2
```bash
# Connetti via SSH
ssh -i your-key.pem ubuntu@your-ec2-ip

# Installa Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installa PM2
sudo npm install -g pm2

# Clona repository
git clone https://github.com/pieroci/devopsncode.git
cd devopsncode

# Installa dipendenze
npm install

# Avvia con PM2
pm2 start server.js --name street-chaos

# Configura auto-start
pm2 startup
pm2 save

# Nginx reverse proxy (opzionale)
sudo apt install nginx
```

#### Nginx Config
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Deploy con Docker

#### Build & Run
```bash
# Build image
docker build -t street-chaos .

# Run container
docker run -d -p 3000:3000 --name street-chaos-app street-chaos

# Con docker-compose
docker-compose up -d

# Logs
docker logs -f street-chaos-app

# Stop
docker stop street-chaos-app
```

#### Docker Hub (Opzionale)
```bash
# Tag image
docker tag street-chaos yourusername/street-chaos:latest

# Push to Docker Hub
docker push yourusername/street-chaos:latest

# Pull & Run su altro server
docker pull yourusername/street-chaos:latest
docker run -d -p 3000:3000 yourusername/street-chaos:latest
```

### 6. Deploy su Google Cloud Platform

#### Cloud Run
```bash
# Installa gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Build & Deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/street-chaos
gcloud run deploy street-chaos \
  --image gcr.io/YOUR_PROJECT_ID/street-chaos \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### 7. Deploy su Azure

#### Azure App Service
```bash
# Installa Azure CLI
# https://docs.microsoft.com/cli/azure/install-azure-cli

# Login
az login

# Crea resource group
az group create --name StreetChaosRG --location eastus

# Crea app service plan
az appservice plan create --name StreetChaosPlan \
  --resource-group StreetChaosRG --sku B1 --is-linux

# Crea web app
az webapp create --resource-group StreetChaosRG \
  --plan StreetChaosPlan --name street-chaos-game \
  --runtime "NODE|18-lts"

# Deploy da Git
az webapp deployment source config --name street-chaos-game \
  --resource-group StreetChaosRG --repo-url https://github.com/pieroci/devopsncode \
  --branch main --manual-integration
```

### 8. Deploy su DigitalOcean

#### Droplet Setup
```bash
# Crea droplet (via web UI)
# Scegli: Ubuntu 22.04, Node.js one-click app

# SSH nel droplet
ssh root@your-droplet-ip

# Clona repo
git clone https://github.com/pieroci/devopsncode.git
cd devopsncode

# Installa dipendenze
npm install

# Configura firewall
ufw allow 3000
ufw allow 80
ufw allow 443
ufw enable

# Avvia con PM2
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

## Configurazione Domini

### DNS Settings
```
Type    Name    Value           TTL
A       @       YOUR_SERVER_IP  3600
A       www     YOUR_SERVER_IP  3600
CNAME   api     yourdomain.com  3600
```

### SSL/HTTPS con Let's Encrypt
```bash
# Installa certbot
sudo apt install certbot python3-certbot-nginx

# Ottieni certificato
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Variabili d'Ambiente

### .env File
```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com
MAX_LEADERBOARD_SIZE=1000
RATE_LIMIT=100
```

### Configurazione Server
```javascript
// server.js
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
```

## Monitoring & Logging

### PM2 Monitoring
```bash
# Status
pm2 status

# Logs
pm2 logs street-chaos

# Monitor
pm2 monit

# Restart
pm2 restart street-chaos

# Stop
pm2 stop street-chaos
```

### Log Files
```bash
# Crea log directory
mkdir logs

# Configura PM2 per logging
pm2 start server.js --name street-chaos \
  --log logs/app.log \
  --error logs/error.log
```

## Database (Opzionale per Produzione)

### MongoDB Atlas
```bash
npm install mongoose

# Connection string
mongodb+srv://username:password@cluster.mongodb.net/streetchaos
```

### PostgreSQL
```bash
npm install pg

# Connection
postgresql://user:password@host:5432/database
```

## Backup

### Leaderboard Backup
```bash
# Backup automatico ogni giorno
0 0 * * * cp /app/leaderboard.json /backups/leaderboard-$(date +\%Y\%m\%d).json

# Restore
cp /backups/leaderboard-20231201.json /app/leaderboard.json
```

## Performance Optimization

### Node.js
```bash
# Usa clustering
npm install pm2
pm2 start server.js -i max  # Max CPUs

# Abilita compression
npm install compression
```

### CDN per Assets
- Cloudflare (gratis)
- AWS CloudFront
- Azure CDN

## Security

### Rate Limiting
```bash
npm install express-rate-limit

# server.js
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

### Helmet (Security Headers)
```bash
npm install helmet

// server.js
const helmet = require('helmet');
app.use(helmet());
```

## CI/CD (GitHub Actions)

### .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "street-chaos-game"
          heroku_email: "your@email.com"
```

## Troubleshooting

### Port già in uso
```bash
# Trova processo
lsof -i :3000

# Termina processo
kill -9 PID
```

### Out of Memory
```bash
# Aumenta memoria Node.js
node --max-old-space-size=4096 server.js
```

### Permessi
```bash
# Cambia owner
chown -R $USER:$USER /app

# Permissions
chmod -R 755 /app
```

## Checklist Pre-Deploy

- [ ] Test locali passati
- [ ] Variabili d'ambiente configurate
- [ ] Database configurato (se usato)
- [ ] SSL certificato installato
- [ ] Firewall configurato
- [ ] Backup system attivo
- [ ] Monitoring configurato
- [ ] DNS puntano al server
- [ ] Rate limiting abilitato
- [ ] Logs configurati
- [ ] PM2 auto-start configurato
- [ ] Health checks funzionanti

## Costi Stimati

### Hosting
- **Heroku**: $7/mese (Hobby tier)
- **Vercel**: Gratis (Hobby tier)
- **AWS EC2**: $5-50/mese (t2.micro - t2.large)
- **DigitalOcean**: $6-40/mese (Basic - Pro droplets)
- **Google Cloud Run**: Pay-per-use (~$5-20/mese)

### Altri Costi
- **Dominio**: $10-15/anno
- **SSL**: Gratis (Let's Encrypt)
- **CDN**: Gratis (Cloudflare base)
- **Backup Storage**: $1-5/mese

## Support

Per problemi o domande:
- GitHub Issues
- Email: support@devopsncode.com
- Discord: [link]

## Risorse Utili

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Documentation](https://docs.docker.com/)

Buon deployment! 🚀
