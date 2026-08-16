<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;

class AdminCouponController extends Controller
{
    public function index()
    {
        return response()->json(Coupon::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:255|unique:coupons,code',
            'type' => 'required|in:PERCENTAGE,FIXED_AMOUNT',
            'value' => 'required|numeric|min:0',
            'active' => 'boolean',
            'minPurchaseAmount' => 'nullable|numeric|min:0',
        ]);

        $coupon = Coupon::create([
            'code' => strtoupper(trim($data['code'])),
            'type' => $data['type'],
            'value' => $data['value'],
            'active' => $data['active'] ?? true,
            'minPurchaseAmount' => $data['minPurchaseAmount'] ?? 0,
        ]);

        return response()->json(['success' => true, 'coupon' => $coupon], 201);
    }

    public function toggle(string $id)
    {
        $coupon = Coupon::find($id);
        if (!$coupon) {
            return response()->json(['error' => 'Coupon not found.'], 404);
        }
        $coupon->active = !$coupon->active;
        $coupon->save();
        return response()->json(['success' => true, 'active' => $coupon->active]);
    }

    public function destroy(string $id)
    {
        $coupon = Coupon::find($id);
        if (!$coupon) {
            return response()->json(['error' => 'Coupon not found.'], 404);
        }
        $coupon->delete();
        return response()->json(['success' => true]);
    }
}
