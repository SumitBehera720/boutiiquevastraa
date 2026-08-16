<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CouponService;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function __construct(private CouponService $couponService)
    {
    }

    public function validate(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $result = $this->couponService->validate($data['code'], (float) $data['subtotal']);

        if (!$result['success']) {
            return response()->json($result);
        }

        return response()->json($result);
    }
}
