<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Collection;
use App\Models\Order;
use App\Models\Customer;

class DashboardController extends Controller
{
    public function show()
    {
        $products = Product::all();
        $collections = Collection::all();
        $orders = Order::all();
        $customers = Customer::all();

        $nonCancelled = $orders->filter(fn($o) => $o->fulfillmentStatus !== 'CANCELLED');
        $totalRevenue = $nonCancelled->sum(fn($o) => (float) $o->totalPrice);

        $lowStock = $products->filter(fn($p) => ($p->inventory ?? 10) <= 5)->take(5);

        $recentOrders = $orders->sortByDesc('created_at')->take(5);

        $statusCounts = $orders->groupBy('fulfillmentStatus')->map->count();

        return response()->json([
            'totalRevenue' => $totalRevenue,
            'totalOrders' => $orders->count(),
            'totalProducts' => $products->count(),
            'totalCustomers' => $customers->count(),
            'recentOrders' => $recentOrders->map(fn($o) => [
                'id' => (string) $o->id,
                'orderNumber' => $o->orderNumber,
                'customerName' => $o->customerName,
                'processedAt' => $o->created_at->toIso8601String(),
                'totalPrice' => ['amount' => number_format($o->totalPrice, 2, '.', ''), 'currencyCode' => 'INR'],
                'fulfillmentStatus' => $o->fulfillmentStatus,
            ])->values(),
            'lowStockProducts' => $lowStock->map(fn($p) => [
                'id' => 'gid://shopify/Product/' . $p->id,
                'title' => $p->title,
                'inventory' => $p->inventory ?? 0,
            ])->values(),
            'statusCounts' => $statusCounts,
        ]);
    }
}
