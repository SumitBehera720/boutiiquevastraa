<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Services\CartService;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private CartService $cartService)
    {
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'lines' => 'nullable|array',
            'lines.*.merchandiseId' => 'required|string',
            'lines.*.quantity' => 'required|integer|min:1',
        ]);
        $cart = $this->cartService->createCart($data['lines'] ?? []);
        return response()->json($this->cartService->formatShopify($cart));
    }

    public function show(string $cart)
    {
        $cart = $this->cartService->getCart($cart);
        if (!$cart) {
            return response()->json(['error' => 'Cart not found.'], 404);
        }
        return response()->json($this->cartService->formatForCheckout($cart));
    }

    public function addLines(Request $request, string $cart)
    {
        $cart = $this->cartService->getCart($cart);
        if (!$cart) {
            return response()->json(['error' => 'Cart not found.'], 404);
        }

        $data = $request->validate([
            'lines' => 'required|array',
            'lines.*.merchandiseId' => 'required|string',
            'lines.*.quantity' => 'required|integer|min:1',
        ]);

        $cart = $this->cartService->addLines($cart, $data['lines']);
        return response()->json($this->cartService->formatShopify($cart));
    }

    public function updateLines(Request $request, string $cart)
    {
        $cart = $this->cartService->getCart($cart);
        if (!$cart) {
            return response()->json(['error' => 'Cart not found.'], 404);
        }

        $data = $request->validate([
            'lines' => 'required|array',
            'lines.*.id' => 'required|string',
            'lines.*.quantity' => 'required|integer|min:0',
        ]);

        $cart = $this->cartService->updateLines($cart, $data['lines']);
        return response()->json($this->cartService->formatShopify($cart));
    }

    public function removeLines(Request $request, string $cart)
    {
        $cart = $this->cartService->getCart($cart);
        if (!$cart) {
            return response()->json(['error' => 'Cart not found.'], 404);
        }

        $data = $request->validate([
            'lineIds' => 'required|array',
            'lineIds.*' => 'required|string',
        ]);

        $cart = $this->cartService->removeLines($cart, $data['lineIds']);
        return response()->json($this->cartService->formatShopify($cart));
    }

    public function checkoutDirect(Request $request)
    {
        $data = $request->validate([
            'merchandiseId' => 'required|string',
            'quantity' => 'required|integer|min:1',
        ]);

        $cart = $this->cartService->createCart([
            [
                'merchandiseId' => $data['merchandiseId'],
                'quantity' => $data['quantity'],
            ],
        ]);

        return response()->json([
            'success' => true,
            'checkoutUrl' => '/checkout?cartId=' . $cart->id,
        ]);
    }
}
