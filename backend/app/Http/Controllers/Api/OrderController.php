<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService)
    {
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'cartId' => 'required|string',
            'firstName' => 'required|string|max:255',
            'lastName' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string',
            'address1' => 'required|string',
            'address2' => 'nullable|string',
            'city' => 'required|string',
            'province' => 'required|string',
            'zip' => 'required|string',
            'country' => 'required|string',
            'paymentMethod' => 'required|in:COD,CARD',
            'cardNumber' => 'nullable|string',
            'cardExpiry' => 'nullable|string',
            'cardCvv' => 'nullable|string',
            'promoCode' => 'nullable|string',
        ]);

        $data['customerId'] = $request->user()?->id;

        $result = $this->orderService->placeOrder($data);
        return response()->json($result, $result['success'] ? 201 : 400);
    }

    public function show(string $order)
    {
        $order = Order::find($order);
        if (!$order) {
            return response()->json(['error' => 'Order not found.'], 404);
        }
        return response()->json($this->formatOrder($order));
    }

    public function track(Request $request)
    {
        $data = $request->validate([
            'orderNumber' => 'required|string',
            'email' => 'required|email',
        ]);

        $order = Order::where('orderNumber', (int) $data['orderNumber'])
            ->where('email', $data['email'])
            ->first();

        if (!$order) {
            return response()->json(['success' => false, 'error' => 'Order not found. Check your order number and email.'], 404);
        }

        return response()->json(['success' => true, 'order' => $this->formatOrder($order)]);
    }

    private function formatOrder(Order $order): array
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
            'totalPrice' => [
                'amount' => number_format($order->totalPrice, 2, '.', ''),
                'currencyCode' => 'INR',
            ],
            'discountAmount' => number_format($order->discountAmount, 2, '.', ''),
            'promoCode' => $order->promoCode,
            'shippingAddress' => $order->shippingAddress,
            'lineItems' => $order->lineItems,
        ];
    }
}
