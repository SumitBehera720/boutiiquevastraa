# Boutiique Vastraa — Laravel Backend + Deployment Plan

## Overview

Replace the JSON file-based backend with a proper Laravel REST API, deploy both frontend and backend to Hostinger VPS, and verify everything works.

**Workflow:** Code Local → Deploy → Test

---

## Hostinger Environment

| Detail | Value |
|---|---|
| Website | `darkslategrey-chough-173926.hostingersite.com` |
| MySQL DB | `u892283443_Buttik1` |
| MySQL User | `u92283443_Buttik1` |
| MySQL Password | `Buttik1@1234` |
| MySQL Host | `localhost` (same server) |
| SSH IP | `145.79.58.122` |
| SSH Port | `65002` |
| SSH User | `u892283443` |
| SSH Password | `Jrs@45@jrs` |

---

## Architecture

```
D:\BOUTIIQUE VASTRAA\
├── app/                  (Next.js frontend — stays as-is)
├── backend/              (NEW — Laravel 11 REST API)
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Enums/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php
│   └── config/
├── data/                 (existing JSON — used by seeders)
├── deploy.py             (NEW — Python deployment script)
└── PLAN.md               (this file)
```

**Stack:** Laravel 11 + Sanctum + MySQL (Hostinger) + Eloquent ORM

---

## Phase 1: Project Setup

### 1.1 Create Laravel Project
```bash
composer create-project laravel/laravel backend
```

### 1.2 Configure Environment
```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=u892283443_Buttik1
DB_USERNAME=u892283443_Buttik1
DB_PASSWORD=Buttik1@1234

SANCTUM_STATEFUL_DOMAINS=darkslategrey-chough-173926.hostingersite.com,localhost:3000
SESSION_DRIVER=cookie
SESSION_DOMAIN=.hostingersite.com
FRONTEND_URL=http://localhost:3000
```

### 1.3 Install Dependencies
```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

---

## Phase 2: Database Migrations (9 tables)

### 2.1 `products`
| Column | Type | Notes |
|---|---|---|
| id | bigIncrements | PK |
| title | string | required |
| handle | string | unique, slug |
| description | text | required |
| descriptionHtml | text | nullable |
| availableForSale | boolean | default: true |
| price | decimal(12,2) | required |
| compareAtPrice | decimal(12,2) | nullable |
| inventory | integer | default: 10 |
| tags | json | nullable |
| options | json | nullable |
| variants | json | nullable |
| images | json | nullable |
| timestamps | | |

### 2.2 `collections`
| Column | Type | Notes |
|---|---|---|
| id | bigIncrements | PK |
| title | string | required |
| handle | string | unique, slug |
| description | text | required |
| image | json | nullable |
| timestamps | | |

### 2.3 `collection_product` (pivot)
| Column | Type | Notes |
|---|---|---|
| collection_id | foreignId | FK → collections |
| product_id | foreignId | FK → products |

### 2.4 `customers`
| Column | Type | Notes |
|---|---|---|
| id | bigIncrements | PK |
| firstName | string | required |
| lastName | string | required |
| email | string | unique |
| password | string | bcrypt |
| phone | string | nullable |
| defaultAddress | json | nullable |
| timestamps | | |

### 2.5 `carts`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| lines | json | nullable |
| timestamps | | |

### 2.6 `orders`
| Column | Type | Notes |
|---|---|---|
| id | bigIncrements | PK |
| orderNumber | integer | unique, auto-increment start 1001 |
| customerId | foreignId | nullable, FK → customers |
| customerName | string | required |
| email | string | required |
| phone | string | required |
| financialStatus | enum | PAID, PENDING, REFUNDED |
| fulfillmentStatus | enum | UNFULFILLED, FULFILLED, SHIPPED, DELIVERED, CANCELLED |
| totalPrice | decimal(12,2) | required |
| discountAmount | decimal(12,2) | default: 0 |
| promoCode | string | nullable |
| shippingAddress | json | required |
| lineItems | json | required |
| timestamps | | |

### 2.7 `coupons`
| Column | Type | Notes |
|---|---|---|
| id | bigIncrements | PK |
| code | string | unique |
| type | enum | PERCENTAGE, FIXED_AMOUNT |
| value | decimal(12,2) | required |
| active | boolean | default: true |
| minPurchaseAmount | decimal(12,2) | default: 0 |
| timestamps | | |

### 2.8 `reviews`
| Column | Type | Notes |
|---|---|---|
| id | bigIncrements | PK |
| productHandle | string | required |
| author | string | required |
| rating | tinyInteger | 1-5 |
| comment | text | required |
| approved | boolean | default: false |
| timestamps | | |

### 2.9 `settings`
| Column | Type | Notes |
|---|---|---|
| id | bigIncrements | PK |
| seo | json | nullable |
| banners | json | nullable |
| homepage | json | nullable |
| footer | json | nullable |
| header | json | nullable |
| timestamps | | |

---

## Phase 3: Eloquent Models (8)

### Relationships
```
Collection (1) ──── (many) Product
    via pivot: collection_product

Product (1) ──── (many) Order (embedded in lineItems)

Customer (1) ──── (many) Order
    via Order.customerId

Review ──── Product (via productHandle string, not FK)

Settings ──── Singleton (firstOrCreate)
```

### Model Notes
- `Product`: `belongsToMany(Collection::class)` + accessors for formatted response
- `Customer`: `hidden: ['password']` — never expose hash
- `Cart`: UUID primary key, no auto-increment
- `Settings`: Singleton — always use `Settings::firstOrCreate(['id' => 1])`
- `Order`: `belongsTo(Customer::class)` — nullable for guest checkout

---

## Phase 4: Authentication

### 4.1 Mechanism
- **Sanctum SPA mode** — cookie-based tokens
- Cookie name: `boutiique_vastraa_customer_token`
- httpOnly: true, secure: true (production), sameSite: lax, path: /
- Expiry: 30 days

### 4.2 Roles
| Role | How Determined | Access |
|---|---|---|
| Guest | No cookie | Public storefront |
| Customer | Valid cookie, non-admin email | Storefront + Account + Checkout |
| Admin | Valid cookie, `email === "admin@boutiquevastra.com"` | Admin panel + all admin actions |

### 4.3 Middleware
- `auth:sanctum` — customer-protected routes
- `admin` — custom middleware checks email is admin email

### 4.4 Default Admin
- Email: `admin@boutiquevastra.com`
- Password: `admin123` (bcrypt hashed in seeder)

---

## Phase 5: API Endpoints (54 total)

### 5.1 Public Endpoints (no auth)

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | `/api/auth/register` | Register customer |
| 2 | POST | `/api/auth/login` | Login, set cookie |
| 3 | GET | `/api/products` | List products |
| 4 | GET | `/api/products/{handle}` | Get product by handle |
| 5 | GET | `/api/products/{id}/recommendations` | Related products |
| 6 | GET | `/api/products/search` | Search products |
| 7 | GET | `/api/collections` | List collections |
| 8 | GET | `/api/collections/{handle}` | Collection with filters/sort/pagination |
| 9 | POST | `/api/cart` | Create cart |
| 10 | POST | `/api/cart/{cartId}/lines` | Add to cart |
| 11 | PUT | `/api/cart/{cartId}/lines` | Update cart line |
| 12 | DELETE | `/api/cart/{cartId}/lines` | Remove from cart |
| 13 | GET | `/api/cart/{cartId}` | Get cart for checkout |
| 14 | POST | `/api/cart/checkout-direct` | Buy now (single item) |
| 15 | POST | `/api/orders` | Place order |
| 16 | GET | `/api/orders/{orderId}` | Get order (success page) |
| 17 | GET | `/api/orders/track` | Track order by number + email |
| 18 | POST | `/api/coupons/validate` | Validate promo code |
| 19 | POST | `/api/reviews` | Submit review |
| 20 | GET | `/api/reviews/product/{handle}` | Product reviews |
| 21 | GET | `/api/reviews/global` | Global testimonials |
| 22 | GET | `/api/settings` | Site settings |

### 5.2 Customer Auth Endpoints

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 23 | POST | `/api/auth/logout` | Logout |
| 24 | GET | `/api/auth/me` | Current customer + orders |

### 5.3 Admin Endpoints

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 25 | GET | `/api/admin/dashboard` | Dashboard stats |
| 26 | GET | `/api/admin/products` | List all products |
| 27 | GET | `/api/admin/products/{id}` | Get product for editing |
| 28 | POST | `/api/admin/products` | Create product |
| 29 | PUT | `/api/admin/products/{id}` | Update product |
| 30 | DELETE | `/api/admin/products/{id}` | Delete product |
| 31 | GET | `/api/admin/collections` | List all collections |
| 32 | POST | `/api/admin/collections` | Create collection |
| 33 | PUT | `/api/admin/collections/{id}` | Update collection |
| 34 | DELETE | `/api/admin/collections/{id}` | Delete collection |
| 35 | GET | `/api/admin/orders` | List all orders |
| 36 | GET | `/api/admin/orders/{id}` | Get order detail |
| 37 | PATCH | `/api/admin/orders/{orderId}/status` | Update fulfillment status |
| 38 | GET | `/api/admin/customers` | List all customers |
| 39 | GET | `/api/admin/coupons` | List all coupons |
| 40 | POST | `/api/admin/coupons` | Create/update coupon |
| 41 | PATCH | `/api/admin/coupons/{id}/toggle` | Toggle coupon active |
| 42 | DELETE | `/api/admin/coupons/{id}` | Delete coupon |
| 43 | GET | `/api/admin/reviews` | List all reviews |
| 44 | PATCH | `/api/admin/reviews/{id}/toggle-approval` | Toggle approval |
| 45 | DELETE | `/api/admin/reviews/{id}` | Delete review |
| 46 | GET | `/api/admin/settings` | Get settings for admin |
| 47 | POST | `/api/admin/settings/seo` | Save SEO settings |
| 48 | POST | `/api/admin/settings/banners` | Save banners |
| 49 | POST | `/api/admin/settings/homepage` | Save homepage config |
| 50 | POST | `/api/admin/settings/footer` | Save footer config |
| 51 | POST | `/api/admin/settings/header` | Save header config |
| 52 | POST | `/api/admin/upload/image` | Upload product image |
| 53 | POST | `/api/admin/upload/file` | Upload general file |
| 54 | POST | `/api/admin/logout` | Admin logout |

---

## Phase 6: Business Logic Services

### 6.1 OrderService
Handles the complex checkout flow in a single DB transaction:

1. Validate cart exists and is non-empty
2. For each line item:
   - Find product by variant ID
   - Check inventory >= requested quantity
   - Decrement inventory
   - If inventory hits 0, set `availableForSale = false`
3. Resolve customer from cookie (if logged in)
4. Save address to customer (if first order)
5. Validate and apply coupon discount (if promoCode provided)
6. Create order with lineItems snapshot
7. Delete cart
8. Return order ID + orderNumber

### 6.2 CartService
Builds formatted responses matching the Shopify-like shape the frontend expects:

```json
{
  "id": "cart_xxx",
  "checkoutUrl": "/checkout?cartId=cart_xxx",
  "totalQuantity": 3,
  "cost": { "subtotalAmount": { "amount": "5400.00", "currencyCode": "INR" } },
  "lines": {
    "edges": [{
      "node": {
        "id": "line_xxx",
        "quantity": 1,
        "merchandise": {
          "id": "variant_id",
          "title": "Default Title",
          "product": { "title": "...", "handle": "..." },
          "price": { "amount": "1800.00", "currencyCode": "INR" },
          "image": { "url": "...", "altText": "..." }
        }
      }
    }]
  }
}
```

### 6.3 CouponService
- Validates code exists and is active
- Checks subtotal meets `minPurchaseAmount`
- Calculates discount:
  - PERCENTAGE: `(subtotal * value) / 100`
  - FIXED_AMOUNT: subtract `value` directly
- Discount capped at subtotal (can't go negative)

---

## Phase 7: Seeders (JSON → MySQL)

### 7.1 Data Sources
| Seeder | Source File | Size |
|---|---|---|
| `SettingsSeeder` | `data/settings.json` | 7KB |
| `CollectionSeeder` | `data/collections.json` | 4KB |
| `ProductSeeder` | `data/products.json` | 44.8KB |
| `CustomerSeeder` | `data/users.json` | 0.5KB |
| `OrderSeeder` | `data/orders.json` | 0KB (empty) |
| `CouponSeeder` | `data/coupons.json` | 0.8KB |
| `ReviewSeeder` | `data/reviews.json` | 0.5KB |
| `AdminSeeder` | hardcoded | 1 record |

### 7.2 Seeder Logic
- Read JSON files from `D:\BOUTIIQUE VASTRAA\data\`
- Parse and transform to match database schema
- Handle nested Shopify format (edges → nodes)
- Re-hash passwords with bcrypt (replacing SHA-256)
- Create collection-product pivot relationships
- Settings: single row with JSON columns

---

## Phase 8: API Response Formatting

All endpoints return consistent JSON matching the frontend's expected shapes:

### Product Format
```json
{
  "id": "gid://shopify/Product/1",
  "title": "Royal Crimson Banarasi",
  "handle": "royal-crimson-banarasi",
  "description": "...",
  "descriptionHtml": "<p>...</p>",
  "availableForSale": true,
  "priceRange": { "minVariantPrice": { "amount": "18500.00", "currencyCode": "INR" } },
  "compareAtPriceRange": { "minVariantPrice": { "amount": "24500.00", "currencyCode": "INR" } },
  "images": { "edges": [{ "node": { "url": "...", "altText": "..." } }] },
  "options": [{ "name": "Size", "values": ["S", "M", "L"] }],
  "variants": { "edges": [{ "node": { "id": "...", "title": "S", "price": {...} } }] },
  "tags": ["Silk", "Banarasi"],
  "collectionHandles": ["banarasi-silks"],
  "inventory": 8
}
```

### Collection with Products Format
```json
{
  "id": "...",
  "title": "Banarasi Silks",
  "handle": "banarasi-silks",
  "description": "...",
  "image": { "url": "...", "altText": "..." },
  "products": {
    "edges": [{ "node": { ...product } }],
    "pageInfo": { "hasNextPage": true, "endCursor": "product_id" },
    "filters": [{ "id": "...", "label": "...", "type": "LIST", "values": [...] }]
  }
}
```

### Key Formatting Rules
- Price fields are strings with 2 decimals: `"1499.00"`
- Currency is always `"INR"`
- Variant IDs use format `{productId}-variant-{index}`
- Product IDs use Shopify GID format: `gid://shopify/Product/{timestamp}`
- Collections use edges/nodes format for product lists

---

## Phase 9: File Uploads

### 9.1 Configuration
- Storage disk: `public` (symlinked to `storage/app/public`)
- Product images: `uploads/` directory
- General files: `images/uploads/` directory

### 9.2 Validation
- MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Max size: 5MB
- Filename: `{timestamp}_{random9chars}.{ext}`

### 9.3 Endpoints
- `POST /api/admin/upload/image` → returns `{ success: true, url: "/uploads/filename.webp" }`
- `POST /api/admin/upload/file` → returns `{ success: true, url: "/images/uploads/filename.ext" }`

---

## Phase 10: CORS Configuration

```php
// config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000',
        'https://darkslategrey-chough-173926.hostingersite.com',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true, // Required for Sanctum cookies
];
```

---

## Phase 11: Next.js Frontend Updates

### 11.1 Changes Required
Replace `jsonDb` calls with `fetch()` calls to Laravel API:

| Current (jsonDb) | New (Laravel API) |
|---|---|
| `jsonDb.getProducts()` | `fetch('/api/products')` |
| `jsonDb.getProductByHandle(h)` | `fetch('/api/products/' + h)` |
| `jsonDb.getCollections()` | `fetch('/api/collections')` |
| `jsonDb.getCollectionByHandle(h)` | `fetch('/api/collections/' + h)` |
| `jsonDb.getSettings()` | `fetch('/api/settings')` |
| `jsonDb.getOrders()` | `fetch('/api/admin/orders')` |
| Server actions in `app/actions/` | `fetch()` to Laravel API endpoints |

### 11.2 Files to Update
- `lib/shopify/queries.ts` — rewrite to call Laravel API
- `lib/shopify/mutations.ts` — rewrite to call Laravel API
- `app/actions/auth.ts` — call Laravel auth endpoints
- `app/actions/cart.ts` — call Laravel cart endpoints
- `app/actions/checkout.ts` — call Laravel order endpoints
- `app/actions/admin*.ts` — call Laravel admin endpoints
- `app/page.tsx` — fetch from Laravel API instead of jsonDb
- `app/layout.tsx` — fetch settings from Laravel API
- All admin pages — fetch from Laravel admin API

### 11.3 Environment Variable
Add to `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Phase 12: Python Deployment Script

### 12.1 File: `deploy.py`
Location: `D:\BOUTIIQUE VASTRAA\deploy.py`

### 12.2 Dependencies
```
paramiko
scp
requests
```

### 12.3 Script Structure
```python
# deploy.py

class HostingerDeployer:
    def __init__(self):
        self.ssh_host = "145.79.58.122"
        self.ssh_port = 65002
        self.ssh_user = "u892283443"
        self.ssh_pass = "Jrs@45@jrs"
        self.site_url = "darkslategrey-chough-173926.hostingersite.com"
    
    def connect(self):
        """Establish SSH connection"""
    
    def deploy_backend(self):
        """Phase A: Deploy Laravel backend"""
        # 1. Upload backend/ directory via SCP
        # 2. Install PHP dependencies
        # 3. Configure .env
        # 4. Run migrations
        # 5. Run seeders
        # 6. Set up storage link
        # 7. Cache config and routes
        # 8. Start Laravel server
    
    def deploy_frontend(self):
        """Phase B: Deploy Next.js frontend"""
        # 1. Upload Next.js files (exclude node_modules, .next)
        # 2. Install npm dependencies
        # 3. Build production
        # 4. Start with PM2
    
    def verify(self):
        """Phase C: Verify deployments"""
        # Test Laravel API endpoints
        # Test Next.js frontend loads
        # Print pass/fail results
    
    def run(self):
        """Execute full deployment"""
        self.connect()
        self.deploy_backend()
        self.deploy_frontend()
        self.verify()
```

### 12.4 Deployment Commands (Backend)
```bash
# On Hostinger VPS
sudo apt update
sudo apt install php php-cli php-mysql php-mbstring php-xml php-curl php-zip php-bcmath

# Upload files
scp -P 65002 -r backend/ u892283443@145.79.58.122:/var/www/boutiique-api/

# SSH and setup
cd /var/www/boutiique-api
composer install --no-dev --optimize-autoloader
cp .env.example .env
# Edit .env with DB credentials
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache

# Start Laravel
php artisan serve --host=0.0.0.0 --port=8000
# Or use Supervisor for production
```

### 12.5 Deployment Commands (Frontend)
```bash
# On Hostinger VPS
cd /var/www/boutiique-vastraa

# Upload files
scp -P 65002 -r app/ components/ data/ lib/ public/ scripts/ store/ package*.json next.config.ts server.js tsconfig.json u892283443@145.79.58.122:/var/www/boutiique-vastraa/

# Install and build
npm install
npm run build

# Start with PM2
pm2 start server.js --name "boutiique-vastraa"
pm2 save
pm2 startup
```

### 12.6 Nginx Configuration
```nginx
server {
    listen 80;
    server_name darkslategrey-chough-173926.hostingersite.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (Laravel)
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Phase 13: Verification Script

### 13.1 API Endpoint Tests
```python
def verify_laravel_api():
    base = "http://darkslategrey-chough-173926.hostingersite.com/api"
    
    tests = [
        ("GET", "/settings", "Settings load"),
        ("GET", "/products", "Products list"),
        ("GET", "/collections", "Collections list"),
        ("POST", "/auth/login", "Auth login", {"email": "admin@boutiquevastra.com", "password": "admin123"}),
    ]
    
    for test in tests:
        # Run test, print pass/fail
```

### 13.2 Frontend Tests
```python
def verify_frontend():
    tests = [
        ("GET", "/", "Homepage loads"),
        ("GET", "/collections", "Collections page"),
        ("GET", "/products", "Products page"),
        ("GET", "/account/login", "Login page"),
        ("GET", "/admin", "Admin page (redirects to login)"),
    ]
```

---

## Implementation Order

| Step | Phase | What | Est. Time |
|---|---|---|---|
| 1 | 1 | Laravel scaffolding + DB config | 15 min |
| 2 | 2 | Migrations (9 tables) | 30 min |
| 3 | 3 | Models + Relationships (8 models) | 30 min |
| 4 | 4 | Auth (register/login/logout/me + middleware) | 45 min |
| 5 | 5-6 | Public APIs + Business logic services | 2 hours |
| 6 | 5-6 | Admin APIs (all CRUD controllers) | 2 hours |
| 7 | 7 | Seeders + JSON data migration | 1 hour |
| 8 | 8-9 | API response formatting + file uploads | 45 min |
| 9 | 10 | CORS + Sanctum config | 15 min |
| 10 | 11 | Next.js frontend updates (swap jsonDb → API) | 2 hours |
| 11 | 12 | Python deploy script | 1 hour |
| 12 | 13 | Test locally (Laravel + Next.js) | 30 min |
| 13 | 12 | Deploy to Hostinger | 1 hour |
| 14 | 13 | Verify deployment | 30 min |

**Total estimated time: ~12 hours**

---

## Security Improvements Over Current Demo

| Issue | Current (Demo) | New (Laravel) |
|---|---|---|
| Password hashing | SHA-256 (unsalted) | bcrypt |
| Auth token | Customer ID as token | Sanctum tokens |
| Admin check | Email comparison | Middleware + role |
| CSRF | None | Sanctum CSRF |
| Rate limiting | None | Laravel throttle |
| File uploads | No validation | MIME + size check |
| SQL injection | N/A (JSON files) | Eloquent ORM (parameterized) |
| Input validation | Minimal | Laravel Form Requests |

---

## Notes

1. **Currency:** Always INR. Price strings always 2 decimals.
2. **Product IDs:** Maintain Shopify GID format for frontend compatibility.
3. **Variant IDs:** Format `{productId}-variant-{index}`.
4. **Cart is anonymous:** No customer binding until checkout.
5. **Reviews are moderated:** Default `approved: false`.
6. **Settings singleton:** Always single row in database.
7. **Wishlist:** Stays client-side (localStorage). No backend needed.
8. **Existing `proxy.ts`:** Dead code. Will be replaced by Nginx config.
