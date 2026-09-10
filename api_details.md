# Boutiique Vastraa - Production API Details

This file contains the production API endpoints and domain details for Postman, Shiprocket, and integration testing.

---

## Production Domain
- **Domain Name**: `boutiiquevastraa.com`
- **Base API URL**: `https://boutiiquevastraa.com/api`

---

## Postman & Shiprocket Integration API Endpoints

### 1. Products API
- **URL**: `https://boutiiquevastraa.com/api/products?per_page=10000`
- **Method**: `GET`
- **Parameters**: 
  - `per_page` (optional, default `10000`): Limits the number of products returned. Set to a high value to fetch all products.
- **Response Format**: Returns `{ "data": { "total": <count>, "products": [...] } }` matching standard Shiprocket JSON structure.

### 2. Collections API
- **URL**: `https://boutiiquevastraa.com/api/collections`
- **Method**: `GET`
- **Parameters**:
  - `first` (optional, default `100`): Limits the number of collections returned.

### 3. Products by Collection API
- **Primary URL (Query Parameter)**: `https://boutiiquevastraa.com/api/products?collection_id={collection_id}&per_page=10000`
- **Alternative URL (Path Parameter)**: `https://boutiiquevastraa.com/api/collections/{collection_handle}?first=10000`
- **Method**: `GET`
- **Query Parameters**:
  - `collection_id` (required): Collection ID or handle string (e.g., `saree`, `kurti`, `lehenga`, `jewellery`, `3-piece`, `party-wear`, or `all`).
  - `per_page` (optional, default `10000`): Limits the number of products returned within the collection. Set high to fetch all.
- **Collection IDs / Handles**:
  - `all`: Returns all products.
  - `saree`: Returns saree products.
  - `kurti`: Returns kurti products.
  - `lehenga`: Returns lehenga products.
  - `jewellery`: Returns jewellery products.
  - `3-piece`: Returns 3-piece suit products.
  - `party-wear`: Returns party wear products.

### 4. Search API
- **URL**: `https://boutiiquevastraa.com/api/products/search`
- **Method**: `GET`
- **Parameters**:
  - `q` (required): Search query string.

---

## Authentication
- **Customer Endpoints**: Use `Authorization: Bearer <token>` in headers (token returned upon registration/login).
- **Admin Endpoints**: Use `Authorization: Bearer admin-token` in headers.
- **Admin Login Email**: `admin@boutiiquevastraa.com`
- **Admin Password**: `admin123`

---

## Shipping Integration
- **Shiprocket Status**: Active custom JSON endpoints matching Shiprocket schema format.
- **Shiprocket Registered Email**: `prasantabiswas88828@gmail.com`
- **Pickup Location**: `Home`

---

## Postman Collection File
A complete, pre-configured Postman collection is available in the root folder:
- **File**: `boutiique-vastraa-api.postman_collection.json`
- **Path**: `d:/boutiique deploy/boutiique-vastraa-api.postman_collection.json`
- **How to use**: Open Postman -> click **Import** -> select this file. The `baseUrl` variable is set to `https://boutiiquevastraa.com`.

