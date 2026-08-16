<?php

namespace Database\Seeders;

use App\Models\Order;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $path = dirname(__DIR__, 2) . '/../data/orders.json';
        if (!file_exists($path)) return;

        $orders = json_decode(file_get_contents($path), true);
        if (!$orders) return;

        foreach ($orders as $o) {
            Order::firstOrCreate(
                ['orderNumber' => $o['orderNumber']],
                [
                    'customerId' => $o['customerId'] ?? null,
                    'customerName' => $o['customerName'],
                    'email' => $o['email'],
                    'phone' => $o['phone'],
                    'financialStatus' => $o['financialStatus'],
                    'fulfillmentStatus' => $o['fulfillmentStatus'],
                    'totalPrice' => $o['totalPrice']['amount'],
                    'discountAmount' => $o['discountAmount'] ?? 0,
                    'promoCode' => $o['promoCode'] ?? null,
                    'shippingAddress' => $o['shippingAddress'],
                    'lineItems' => $o['lineItems'],
                    'created_at' => Carbon::parse($o['processedAt'] ?? 'now'),
                ]
            );
        }
    }
}
