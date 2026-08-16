<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function placeOrder(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $cart = Cart::find($data['cartId']);
            if (!$cart || empty($cart->lines)) {
                return ['success' => false, 'error' => 'Cart is empty or not found.'];
            }

            $lineItems = [];
            foreach ($cart->lines as $line) {
                $product = Product::find($line['merchandiseId']);
                if (!$product) {
                    $product = Product::where('handle', $line['merchandiseId'])->first();
                }
                if (!$product) {
                    return ['success' => false, 'error' => 'Product not found: ' . $line['merchandiseId']];
                }
                if ($product->inventory < $line['quantity']) {
                    return [
                        'success' => false,
                        'error' => "Insufficient stock for {$product->title}. Only {$product->inventory} left.",
                    ];
                }

                $product->inventory -= $line['quantity'];
                if ($product->inventory <= 0) {
                    $product->availableForSale = false;
                }
                $product->save();

                $lineItems[] = [
                    'title' => $product->title,
                    'quantity' => $line['quantity'],
                    'variantId' => $line['merchandiseId'],
                    'variantTitle' => 'Default Title',
                    'price' => number_format($product->price, 2, '.', ''),
                    'image' => $this->getFirstImage($product),
                ];
            }

            $totalPrice = array_reduce($lineItems, fn($sum, $item) => $sum + ($item['quantity'] * (float)$item['price']), 0);
            $discountAmount = 0;

            // Apply coupon
            if (!empty($data['promoCode'])) {
                $couponService = new CouponService();
                $result = $couponService->validate($data['promoCode'], $totalPrice);
                if ($result['success']) {
                    $discountAmount = $result['discountAmount'];
                }
            }

            // Resolve customer
            $customerId = null;
            if (!empty($data['customerId'])) {
                $customer = Customer::find($data['customerId']);
                if ($customer) {
                    $customerId = $customer->id;
                    if (empty($customer->defaultAddress) && !empty($data['address1'])) {
                        $customer->defaultAddress = [
                            'address1' => $data['address1'],
                            'address2' => $data['address2'] ?? '',
                            'city' => $data['city'],
                            'province' => $data['province'],
                            'country' => $data['country'],
                            'zip' => $data['zip'],
                        ];
                        $customer->save();
                    }
                }
            }

            $nextOrderNumber = (Order::max('orderNumber') ?? 1000) + 1;

            $order = Order::create([
                'orderNumber' => $nextOrderNumber,
                'customerId' => $customerId,
                'customerName' => $data['firstName'] . ' ' . $data['lastName'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'financialStatus' => $data['paymentMethod'] === 'COD' ? 'PENDING' : 'PAID',
                'fulfillmentStatus' => 'UNFULFILLED',
                'totalPrice' => max($totalPrice - $discountAmount, 0),
                'discountAmount' => $discountAmount,
                'promoCode' => $data['promoCode'] ?? null,
                'shippingAddress' => [
                    'address1' => $data['address1'],
                    'address2' => $data['address2'] ?? '',
                    'city' => $data['city'],
                    'province' => $data['province'],
                    'country' => $data['country'],
                    'zip' => $data['zip'],
                ],
                'lineItems' => $lineItems,
            ]);

            $cart->delete();

            return [
                'success' => true,
                'orderId' => (string) $order->id,
                'orderNumber' => $order->orderNumber,
            ];
        });
    }

    private function getFirstImage(Product $product): string
    {
        $images = $product->images;
        if ($images && isset($images['edges'][0]['node']['url'])) {
            return $images['edges'][0]['node']['url'];
        }
        return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80';
    }
}
