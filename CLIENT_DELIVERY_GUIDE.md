# Boutiique Vastraa - Next.js E-Commerce
## Client Delivery & Hostinger Deployment Guide

This document outlines the final project architecture, local JSON database features, and complete instructions for deploying the Boutiique Vastraa application to **Hostinger** production servers.

---

### 1. Backend Architecture
The application has been completely disconnected from Shopify. It runs on a custom, high-performance in-memory database built directly in Next.js.

- **Data Directory (`/data/`):** Contains flat JSON databases (`products.json`, `collections.json`, `users.json`, `orders.json`, `settings.json`, `coupons.json`, `reviews.json`).
- **RAM Acceleration (`dbCache`):** The data client in [jsonDb.ts](file:///d:/BOUTIIQUE%2520VASTRAA/lib/db/jsonDb.ts) caches reads in RAM. Operations take `< 0.05ms`.
- **Self-Contained Storage:** Updates from checkout and the admin panel write directly to these local files, keeping the application entirely self-contained without needing external database servers.

---

### 2. Administrator Login Credentials
To manage settings, products, collections, coupons, reviews, and customers, sign in via the storefront customer login page `/account/login`:
- **Email:** `admin@boutiquevastra.com`
- **Password:** `admin123`

The application automatically detects the admin role and redirects you to the Admin Panel.

---

### 3. Deploying on Hostinger (Option A: VPS Hosting - Recommended)
A Virtual Private Server (VPS) is the best way to host a Next.js SSR application.

#### Step 1: Prepare Node.js Environment
1. Log in to your Hostinger VPS via SSH.
2. Install Node.js (v18 or v20) and npm:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

#### Step 2: Upload Files & Install Packages
1. Clone your repository or upload the project folder to `/var/www/boutiique-vastraa`.
2. Install packages:
   ```bash
   npm install --production=false
   ```
3. Run the production build to compile static resources:
   ```bash
   npm run build
   ```

#### Step 3: Run with PM2 (Continuous Process Manager)
Install PM2 globally to ensure the application restarts if the server reboots or crashes:
```bash
sudo npm install -g pm2
pm2 start server.js --name "boutiique-vastraa"
pm2 save
pm2 startup
```

#### Step 4: Configure Reverse Proxy (Nginx)
Configure Nginx to map your domain (`boutiquevastra.com`) to the running application port (default `3000`):
1. Install Nginx: `sudo apt install nginx`
2. Edit configuration: `sudo nano /etc/nginx/sites-available/default`
3. Replace content:
   ```nginx
   server {
       listen 80;
       server_name boutiquevastra.com www.boutiquevastra.com;

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
4. Restart Nginx: `sudo systemctl restart nginx`

---

### 4. Deploying on Hostinger (Option B: Shared Node.js Web Hosting)
If your Hostinger plan includes Node.js application management directly in hPanel:

1. **Upload Files:** Connect via FTP or Hostinger File Manager, and upload all files (excluding `node_modules` and `.next`) to your domain directory.
2. **Setup Node.js App:**
   - In Hostinger hPanel, search for **Node.js**.
   - Create a new Node.js application.
   - Set **Application URL** to your domain name.
   - Set **Source directory** to the root folder.
   - Set **Entry File** to `server.js` (we created this file at the root to handle boot configurations).
3. **Install Dependencies:** Click the **NPM Install** button in hPanel to automatically fetch dependencies.
4. **Build the Application:** Run `npm run build` using the Hostinger Web Console / SSH terminal.
5. **Start Application:** Click **Start** to run the app.

---

### 5. Essential Maintenance Notes
- **Permissions:** Ensure the Node.js user has write permissions to the `/data/` directory so order states, setting changes, reviews, and coupon additions save successfully.
- **Images:** Homepage slide banner URLs and product images can be local paths (e.g. starting with `/images/`) or direct URLs from unsplash/external sources. Keep local assets in the `/public/images/` directory.
