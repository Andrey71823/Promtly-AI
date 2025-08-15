#!/bin/bash

# Digital Ocean Deployment Script for Bolt.diy
# This script deploys the application to Digital Ocean Droplet

set -e

echo "🚀 Starting Digital Ocean deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DROPLET_IP="${DROPLET_IP:-your-droplet-ip}"
DROPLET_USER="${DROPLET_USER:-root}"
APP_NAME="bolt-ai"
DOMAIN="${DOMAIN:-}"

# Check if required variables are set
if [ "$DROPLET_IP" = "your-droplet-ip" ]; then
    echo -e "${RED}❌ Please set DROPLET_IP environment variable${NC}"
    echo "Example: export DROPLET_IP=your.server.ip.address"
    exit 1
fi

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "  Server: $DROPLET_USER@$DROPLET_IP"
echo "  App: $APP_NAME"
echo "  Domain: ${DOMAIN:-Not set}"

# Create .env file for production
echo -e "${YELLOW}📝 Creating production environment file...${NC}"
cat > .env.production << EOF
# Production Environment Variables
NODE_ENV=production
GROQ_API_KEY=${GROQ_API_KEY:-}
OPENAI_API_KEY=${OPENAI_API_KEY:-}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
OPEN_ROUTER_API_KEY=${OPEN_ROUTER_API_KEY:-}
GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY:-}
OLLAMA_API_BASE_URL=${OLLAMA_API_BASE_URL:-}
XAI_API_KEY=${XAI_API_KEY:-}
TOGETHER_API_KEY=${TOGETHER_API_KEY:-}
TOGETHER_API_BASE_URL=${TOGETHER_API_BASE_URL:-}
AWS_BEDROCK_CONFIG=${AWS_BEDROCK_CONFIG:-}
VITE_LOG_LEVEL=info
DEFAULT_NUM_CTX=${DEFAULT_NUM_CTX:-4096}
EOF

# Build and push to server
echo -e "${YELLOW}📦 Building and deploying to server...${NC}"

# Create deployment directory on server
ssh $DROPLET_USER@$DROPLET_IP "mkdir -p /opt/$APP_NAME"

# Copy files to server
echo -e "${YELLOW}📤 Uploading files...${NC}"
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
    ./ $DROPLET_USER@$DROPLET_IP:/opt/$APP_NAME/

# Copy environment file
scp .env.production $DROPLET_USER@$DROPLET_IP:/opt/$APP_NAME/.env

# Deploy on server
ssh $DROPLET_USER@$DROPLET_IP << EOF
    set -e
    cd /opt/$APP_NAME
    
    echo "🐳 Installing Docker and Docker Compose if needed..."
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl start docker
        systemctl enable docker
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    echo "🛑 Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down || true
    
    echo "🏗️ Building and starting new containers..."
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo "🔍 Checking container status..."
    docker-compose -f docker-compose.prod.yml ps
    
    echo "📋 Container logs (last 20 lines):"
    docker-compose -f docker-compose.prod.yml logs --tail=20
EOF

# Setup Nginx reverse proxy if domain is provided
if [ ! -z "$DOMAIN" ]; then
    echo -e "${YELLOW}🌐 Setting up Nginx reverse proxy for $DOMAIN...${NC}"
    ssh $DROPLET_USER@$DROPLET_IP << EOF
        # Install Nginx
        apt update
        apt install -y nginx certbot python3-certbot-nginx
        
        # Create Nginx config
        cat > /etc/nginx/sites-available/$APP_NAME << 'NGINX_EOF'
server {
    listen 80;
    server_name $DOMAIN;
    
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
NGINX_EOF
        
        # Enable site
        ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        
        # Test and reload Nginx
        nginx -t && systemctl reload nginx
        
        # Get SSL certificate
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
EOF
fi

# Cleanup
rm -f .env.production

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application is now running at:${NC}"
if [ ! -z "$DOMAIN" ]; then
    echo -e "${GREEN}   https://$DOMAIN${NC}"
else
    echo -e "${GREEN}   http://$DROPLET_IP${NC}"
fi

echo -e "${YELLOW}📋 Useful commands:${NC}"
echo "  View logs: ssh $DROPLET_USER@$DROPLET_IP 'cd /opt/$APP_NAME && docker-compose -f docker-compose.prod.yml logs -f'"
echo "  Restart: ssh $DROPLET_USER@$DROPLET_IP 'cd /opt/$APP_NAME && docker-compose -f docker-compose.prod.yml restart'"
echo "  Update: ./deploy-digitalocean.sh"