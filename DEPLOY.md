# 🚀 Quick Deploy to Digital Ocean

## Option 1: Manual Deploy (5 minutes)

### Prerequisites
1. Digital Ocean Droplet (Ubuntu 20.04+, 2GB RAM minimum)
2. Domain name (optional, but recommended)

### Steps

1. **Create Digital Ocean Droplet**
   - Go to Digital Ocean dashboard
   - Create new Droplet (Ubuntu 20.04, 2GB RAM)
   - Add your SSH key
   - Note the IP address

2. **Set environment variables**
   ```bash
   export DROPLET_IP=your.server.ip.address
   export DROPLET_USER=root
   export DOMAIN=yourdomain.com  # optional
   
   # API Keys (add the ones you have)
   export OPENAI_API_KEY=your_openai_key
   export ANTHROPIC_API_KEY=your_anthropic_key
   export GROQ_API_KEY=your_groq_key
   # ... add other API keys as needed
   ```

3. **Deploy**
   ```bash
   chmod +x deploy-digitalocean.sh
   ./deploy-digitalocean.sh
   ```

4. **Done!** 
   - Your app will be available at `http://your-droplet-ip` or `https://yourdomain.com`
   - Full preview functionality works
   - WebContainer support included

## Option 2: Auto Deploy via GitHub Actions

### Setup (one time)
1. Go to your GitHub repository → Settings → Secrets
2. Add these secrets:
   - `DIGITALOCEAN_SSH_KEY` - Your private SSH key
   - `DROPLET_IP` - Your droplet IP address
   - `DROPLET_USER` - Usually `root`
   - `DOMAIN` - Your domain (optional)
   - API keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.

### Deploy
- Push to `master` branch → Auto deploys
- Or go to Actions tab → Run "Deploy to Digital Ocean" manually

## What gets deployed:
✅ Full bolt.diy with all features
✅ WebContainer support (preview works!)
✅ All AI providers supported
✅ Docker containerized
✅ Nginx reverse proxy (if domain provided)
✅ SSL certificate (if domain provided)
✅ Auto-restart on server reboot

## Useful commands after deploy:
```bash
# View logs
ssh root@your-droplet-ip 'cd /opt/bolt-ai && docker-compose -f docker-compose.prod.yml logs -f'

# Restart application
ssh root@your-droplet-ip 'cd /opt/bolt-ai && docker-compose -f docker-compose.prod.yml restart'

# Update application
./deploy-digitalocean.sh
```

## Cost estimate:
- Digital Ocean Droplet (2GB): ~$12/month
- Domain: ~$10-15/year
- **Total: ~$12-15/month for full production setup**

## Why Digital Ocean?
- ✅ Full WebContainer support (preview works)
- ✅ No serverless limitations
- ✅ Full Docker support
- ✅ Persistent storage
- ✅ Custom domains with SSL
- ✅ Full control over environment