# Boutiique Vastraa - API Documentation

This document provides a simple, consolidated reference for the production API endpoints and domain details of the Boutiique Vastraa platform.

---

## 🌐 Domain and Base URL

* **Domain Name:** `boutiquevastra.com`
* **Base API URL:** `https://boutiquevastra.com/api`

---

## 🔑 Authentication

* **Customer / Public Endpoints:** Use `Authorization: Bearer <token>` in the headers (token is retrieved upon registration or login).
* **Admin Endpoints:** Use `Authorization: Bearer admin-token` in headers.
  * **Admin Email:** `admin@boutiquevastra.com`
  * **Admin Password:** `admin123`

---

## 📦 API Endpoints Reference

### 1. Products API
Retrieves a list of all products in the store.

* **Endpoint:** `GET /api/products`
* **Full URL:** `https://boutiquevastra.com/api/products`
* **Parameters (Query):**
  * `per_page` (Optional, Default: `50`): Limits the number of products returned.

---

### 2. Collections API
Retrieves all available collections (e.g., categories like Sarees, Kurtis, etc.).

* **Endpoint:** `GET /api/collections`
* **Full URL:** `https://boutiquevastra.com/api/collections`
* **Parameters (Query):**
  * `first` (Optional, Default: `20`): Limits the number of collections returned.

---

### 3. Products by Collection API
Retrieves all products within a specific collection.

* **Endpoint:** `GET /api/collections/{collection_handle}`
* **Full URL:** `https://boutiquevastra.com/api/collections/{collection_handle}`
* **Route Parameter:**
  * `collection_handle` (Required): The handle of the collection to fetch. 
    * **Valid handles:**
      * `all` (Returns all products)
      * `saree` (Returns saree products)
      * `kurti` (Returns kurti products)
      * `lehenga` (Returns lehenga products)
      * `jewellery` (Returns jewellery products)
* **Parameters (Query):**
  * `first` (Optional, Default: `24`): Limits the number of products returned.

---

### 4. Search API
Allows searching for products by query string.

* **Endpoint:** `GET /api/products/search`
* **Full URL:** `https://boutiquevastra.com/api/products/search`
* **Parameters (Query):**
  * `q` (Required): The search query string.

---

## 📬 Postman Integration
A pre-configured Postman Collection is available in the project root directory:
* **File:** `boutiique-vastraa-api.postman_collection.json`
* **Path:** `d:/boutiique deploy/boutiique-vastraa-api.postman_collection.json`
* **How to Import:** Open Postman, click **Import**, select this JSON file. The environment variable `baseUrl` is pre-configured to `https://boutiquevastra.com`.
