<?php

namespace App\Services;

use App\Models\Coupon;

class CouponService
{
    public function validate(string $code, float $subtotal): array
    {
        $coupon = Coupon::where('code', strtoupper(trim($code)))
            ->where('active', true)
            ->first();

        if (!$coupon) {
            return ['success' => false, 'error' => 'Invalid or expired promo code.'];
        }

        if ($subtotal < $coupon->minPurchaseAmount) {
            return [
                'success' => false,
                'error' => 'Minimum purchase amount of ₹' . number_format($coupon->minPurchaseAmount, 0) . ' required.',
            ];
        }

        $discount = match ($coupon->type) {
            'PERCENTAGE' => min(($subtotal * $coupon->value) / 100, $subtotal),
            'FIXED_AMOUNT' => min($coupon->value, $subtotal),
            default => 0,
        };

        return [
            'success' => true,
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => (float) $coupon->value,
            'discountAmount' => round($discount, 2),
        ];
    }
}
