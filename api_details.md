# Boutiique Vastraa - Production API Details

This file contains the production API endpoints and domain details for Postman and integration testing.

---

## Production Domain
- **Domain Name**: `boutiquevastra.com`
- **Base API URL**: `https://boutiquevastra.com/api`

---

## Postman API Endpoints

### 1. Products API
- **URL**: `https://boutiquevastra.com/api/products`
- **Method**: `GET`
- **Parameters**: 
  - `per_page` (optional, default `50`): Limits the number of products returned.

### 2. Collections API
- **URL**: `https://boutiquevastra.com/api/collections`
- **Method**: `GET`
- **Parameters**:
  - `first` (optional, default `20`): Limits the number of collections returned.

### 3. Products by Collection API
- **URL**: `https://boutiquevastra.com/api/collections/{collection_handle}`
- **Method**: `GET`
- **Handles**:
  - `all`: Returns all products.
  - `saree`: Returns saree products.
  - `kurti`: Returns kurti products.
  - `lehenga`: Returns lehenga products.
  - `jewellery`: Returns jewellery products.
- **Parameters**:
  - `first` (optional, default `24`): Limits the number of products returned.

### 4. Search API
- **URL**: `https://boutiquevastra.com/api/products/search`
- **Method**: `GET`
- **Parameters**:
  - `q` (required): Search query string.

---

## Authentication
- **Customer Endpoints**: Use `Authorization: Bearer <token>` in headers (token returned upon registration/login).
- **Admin Endpoints**: Use `Authorization: Bearer admin-token` in headers.
- **Admin Login Email**: `admin@boutiquevastra.com`
- **Admin Password**: `admin123`

---

## Shipping Integration
- **Shiprocket Company ID**: `N/A`
- *Note*: No Shiprocket integration is configured in the current storefront database. If the client requires shipping automation, a custom web hook/connector must be built.

---

## Postman Collection File
A complete, pre-configured Postman collection is available in the root folder:
- **File**: `boutiique-vastraa-api.postman_collection.json`
- **Path**: `d:/boutiique deploy/boutiique-vastraa-api.postman_collection.json`
- **How to use**: Open Postman -> click **Import** -> select this file. The `baseUrl` variable is already set to `https://boutiquevastra.com`.
