<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function index()
    {
        $orders = Order::orderBy('created_at', 'desc')->get();
        return response()->json($orders->map(fn($o) => [
            'id' => (string) $o->id,
            'orderNumber' => $o->orderNumber,
            'customerName' => $o->customerName,
            'email' => $o->email,
            'phone' => $o->phone,
            'processedAt' => $o->created_at->toIso8601String(),
            'financialStatus' => $o->financialStatus,
            'fulfillmentStatus' => $o->fulfillmentStatus,
            'totalPrice' => [
                'amount' => number_format($o->totalPrice, 2, '.', ''),
                'currencyCode' => 'INR',
            ],
            'discountAmount' => number_format($o->discountAmount, 2, '.', ''),
            'promoCode' => $o->promoCode,
            'shippingAddress' => $o->shippingAddress,
            'lineItems' => $o->lineItems,
        ]));
    }

    public function show(string $id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['error' => 'Order not found.'], 404);
        }
        return response()->json([
            'id' => (string) $order->id,
            'orderNumber' => $order->orderNumber,
            'customerName' => $order->customerName,
            'email' => $order->email,
            'phone' => $order->phone,
            'processedAt' => $order->created_at->toIso8601String(),
            'financialStatus' => $order->financialStatus,
            'fulfillmentStatus' => $order->fulfillmentStatus,
            'totalPrice' => [
                'amount' => number_format($order->totalPrice, 2, '.', ''),
                'currencyCode' => 'INR',
            ],
            'discountAmount' => number_format($order->discountAmount, 2, '.', ''),
            'promoCode' => $order->promoCode,
            'shippingAddress' => $order->shippingAddress,
            'lineItems' => $order->lineItems,
        ]);
    }

    public function updateStatus(Request $request, string $id)
    {
        $data = $request->validate([
            'status' => 'required|in:UNFULFILLED,FULFILLED,SHIPPED,DELIVERED,CANCELLED',
        ]);

        $order = Order::find($id);
        if (!$order) {
            return response()->json(['error' => 'Order not found.'], 404);
        }

        $order->fulfillmentStatus = $data['status'];
        if ($data['status'] === 'DELIVERED') {
            $order->financialStatus = 'PAID';
        }
        $order->save();

        return response()->json([
            'success' => true,
            'order' => $this->formatOrder($order),
        ]);
    }

    private function formatOrder($order): array
    {
        return [
            'id' => (string) $order->id,
            'orderNumber' => $order->orderNumber,
            'customerName' => $order->customerName,
            'email' => $order->email,
            'phone' => $order->phone,
            'processedAt' => $order->created_at->toIso8601String(),
            'financialStatus' => $order->financialStatus,
            'fulfillmentStatus' => $order->fulfillmentStatus,
            'totalPrice' => ['amount' => number_format($order->totalPrice, 2, '.', ''), 'currencyCode' => 'INR'],
            'discountAmount' => number_format($order->discountAmount, 2, '.', ''),
            'promoCode' => $order->promoCode,
            'shippingAddress' => $order->shippingAddress,
            'lineItems' => $order->lineItems,
        ];
    }
}
