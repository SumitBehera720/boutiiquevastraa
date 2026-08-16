<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        $path = dirname(__DIR__, 2) . '/../data/coupons.json';
        if (!file_exists($path)) return;

        $coupons = json_decode(file_get_contents($path), true);
        if (!$coupons) return;

        foreach ($coupons as $c) {
            Coupon::firstOrCreate(
                ['code' => $c['code']],
                [
                    'type' => $c['type'],
                    'value' => $c['value'],
                    'active' => $c['active'] ?? true,
                    'minPurchaseAmount' => $c['minPurchaseAmount'] ?? 0,
                ]
            );
        }
    }
}
