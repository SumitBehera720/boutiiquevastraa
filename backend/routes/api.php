<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CollectionController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SettingsController;

// ── Public ──────────────────────────────────────────────────
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
});

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/search', [ProductController::class, 'search']);
Route::get('/products/{handle}', [ProductController::class, 'show']);
Route::get('/products/{id}/recommendations', [ProductController::class, 'recommendations']);

Route::get('/collections', [CollectionController::class, 'index']);
Route::get('/collections/{handle}', [CollectionController::class, 'show']);

Route::post('/cart', [CartController::class, 'store']);
Route::post('/cart/checkout-direct', [CartController::class, 'checkoutDirect']);
Route::post('/cart/{cart}/lines', [CartController::class, 'addLines']);
Route::put('/cart/{cart}/lines', [CartController::class, 'updateLines']);
Route::delete('/cart/{cart}/lines', [CartController::class, 'removeLines']);
Route::get('/cart/{cart}', [CartController::class, 'show']);

Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/track', [OrderController::class, 'track']);
Route::get('/orders/{order}', [OrderController::class, 'show']);

Route::post('/coupons/validate', [CouponController::class, 'validate']);

Route::post('/reviews', [ReviewController::class, 'store']);
Route::get('/reviews/product/{handle}', [ReviewController::class, 'byProduct']);
Route::get('/reviews/global', [ReviewController::class, 'global']);

Route::get('/settings', [SettingsController::class, 'show']);

// ── Admin ───────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', [App\Http\Controllers\Api\Admin\DashboardController::class, 'show']);

    Route::get('/products', [App\Http\Controllers\Api\Admin\AdminProductController::class, 'index']);
    Route::get('/products/{product}', [App\Http\Controllers\Api\Admin\AdminProductController::class, 'show']);
    Route::post('/products', [App\Http\Controllers\Api\Admin\AdminProductController::class, 'store']);
    Route::put('/products/{product}', [App\Http\Controllers\Api\Admin\AdminProductController::class, 'update']);
    Route::delete('/products/{product}', [App\Http\Controllers\Api\Admin\AdminProductController::class, 'destroy']);

    Route::get('/collections', [App\Http\Controllers\Api\Admin\AdminCollectionController::class, 'index']);
    Route::post('/collections', [App\Http\Controllers\Api\Admin\AdminCollectionController::class, 'store']);
    Route::put('/collections/{collection}', [App\Http\Controllers\Api\Admin\AdminCollectionController::class, 'update']);
    Route::delete('/collections/{collection}', [App\Http\Controllers\Api\Admin\AdminCollectionController::class, 'destroy']);

    Route::get('/orders', [App\Http\Controllers\Api\Admin\AdminOrderController::class, 'index']);
    Route::get('/orders/{order}', [App\Http\Controllers\Api\Admin\AdminOrderController::class, 'show']);
    Route::patch('/orders/{order}/status', [App\Http\Controllers\Api\Admin\AdminOrderController::class, 'updateStatus']);

    Route::get('/customers', [App\Http\Controllers\Api\Admin\AdminCustomerController::class, 'index']);

    Route::get('/coupons', [App\Http\Controllers\Api\Admin\AdminCouponController::class, 'index']);
    Route::post('/coupons', [App\Http\Controllers\Api\Admin\AdminCouponController::class, 'store']);
    Route::patch('/coupons/{coupon}/toggle', [App\Http\Controllers\Api\Admin\AdminCouponController::class, 'toggle']);
    Route::delete('/coupons/{coupon}', [App\Http\Controllers\Api\Admin\AdminCouponController::class, 'destroy']);

    Route::get('/reviews', [App\Http\Controllers\Api\Admin\AdminReviewController::class, 'index']);
    Route::patch('/reviews/{review}/toggle-approval', [App\Http\Controllers\Api\Admin\AdminReviewController::class, 'toggleApproval']);
    Route::delete('/reviews/{review}', [App\Http\Controllers\Api\Admin\AdminReviewController::class, 'destroy']);

    Route::get('/settings', [App\Http\Controllers\Api\Admin\SettingsController::class, 'show']);
    Route::post('/settings/seo', [App\Http\Controllers\Api\Admin\SettingsController::class, 'saveSeo']);
    Route::post('/settings/banners', [App\Http\Controllers\Api\Admin\SettingsController::class, 'saveBanners']);
    Route::post('/settings/homepage', [App\Http\Controllers\Api\Admin\SettingsController::class, 'saveHomepage']);
    Route::post('/settings/footer', [App\Http\Controllers\Api\Admin\SettingsController::class, 'saveFooter']);
    Route::post('/settings/header', [App\Http\Controllers\Api\Admin\SettingsController::class, 'saveHeader']);

    Route::post('/upload/image', [App\Http\Controllers\Api\Admin\UploadController::class, 'image']);
    Route::post('/upload/file', [App\Http\Controllers\Api\Admin\UploadController::class, 'file']);
});
