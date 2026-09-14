# Boutiique Vastraa - Production API Details

This file contains the production API endpoints and domain details for Postman, Shiprocket, and integration testing.

---

## Production Domain
- **Domain Name**: `boutiiquevastraa.com`
- **Base API URL**: `https://boutiiquevastraa.com/api`

---

## Postman & Shiprocket Integration API Endpoints

### 1. Products API (Fetch Products)
- **URL**: `https://boutiiquevastraa.com/api/products?page=1&limit=100`
- **Method**: `GET`
- **Parameters**: 
  - `page` (optional, default `1`): Page number (1-indexed).
  - `limit` (optional, default `100`): Number of products per page (also supports `per_page` or `first`).
- **Response Format**: Returns `{ "data": { "total": <count>, "products": [...] } }` strictly following official Shiprocket JSON specification.

### 2. Collections API (Fetch Collections)
- **URL**: `https://boutiiquevastraa.com/api/collections?page=1&limit=100`
- **Method**: `GET`
- **Parameters**:
  - `page` (optional, default `1`): Page number (1-indexed).
  - `limit` (optional, default `100`): Number of collections per page.
- **Response Format**: Returns `{ "data": { "total": <count>, "collections": [...] } }` strictly following official Shiprocket JSON specification.

### 3. Products by Collection API (Fetch Products by Collection)
- **URL**: `https://boutiiquevastraa.com/api/products?collection_id={collection_id}&page=1&limit=100`
- **Method**: `GET`
- **Query Parameters**:
  - `collection_id` (required): Collection ID or handle (e.g. `saree`, `kurti`, `lehenga`, `jewellery`, `3-piece`, `party-wear`, or `all`).
  - `page` (optional, default `1`): Page number (1-indexed).
  - `limit` (optional, default `100`): Number of products per page.
- **Response Format**: Returns `{ "data": { "total": <count>, "products": [...] } }` strictly following official Shiprocket JSON specification.

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

