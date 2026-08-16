<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Product;
use Illuminate\Support\Str;

class CartService
{
    private function lookupProduct(string $merchandiseId): ?Product
    {
        // Try direct find first
        $product = Product::find($merchandiseId);
        if ($product) return $product;

        // Try by handle
        $product = Product::where('handle', $merchandiseId)->first();
        if ($product) return $product;

        // Parse Shopify GID format: gid://shopify/{Type}/{id}
        if (preg_match('/gid:\/\/shopify\/(\w+)\/(.+)/', $merchandiseId, $m)) {
            $type = $m[1];
            $id = $m[2];

            // For Product type, try by numeric ID
            if ($type === 'Product') {
                if (preg_match('/^\d+/', $id, $num)) {
                    $product = Product::find($num[0]);
                    if ($product) return $product;
                }
            }

            // Search products whose variants JSON contains this merchandise ID
            $products = Product::all();
            foreach ($products as $p) {
                $variants = $p->variants;
                if ($variants && isset($variants['edges'])) {
                    foreach ($variants['edges'] as $edge) {
                        if (isset($edge['node']['id']) && $edge['node']['id'] === $merchandiseId) {
                            return $p;
                        }
                    }
                }
            }
        }

        return null;
    }

    public function getCart(string $cartId): ?Cart
    {
        return Cart::find($cartId);
    }

    public function createCart(array $lines = []): Cart
    {
        $normalized = [];
        foreach ($lines as $line) {
            $normalized[] = [
                'id' => 'line_' . time() . '_' . Str::random(5),
                'quantity' => $line['quantity'],
                'merchandiseId' => $line['merchandiseId'],
            ];
        }
        return Cart::create(['lines' => $normalized]);
    }

    public function addLines(Cart $cart, array $newLines): Cart
    {
        $lines = $cart->lines ?? [];
        foreach ($newLines as $nl) {
            $found = false;
            foreach ($lines as &$line) {
                if ($line['merchandiseId'] === $nl['merchandiseId']) {
                    $line['quantity'] += $nl['quantity'];
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $lines[] = [
                    'id' => 'line_' . time() . '_' . Str::random(5),
                    'quantity' => $nl['quantity'],
                    'merchandiseId' => $nl['merchandiseId'],
                ];
            }
        }
        $cart->lines = $lines;
        $cart->save();
        return $cart;
    }

    public function updateLines(Cart $cart, array $lineUpdates): Cart
    {
        $lines = $cart->lines ?? [];
        foreach ($lines as &$line) {
            foreach ($lineUpdates as $lu) {
                if ($line['id'] === $lu['id']) {
                    $line['quantity'] = $lu['quantity'];
                }
            }
        }
        $lines = array_filter($lines, fn($l) => $l['quantity'] > 0);
        $cart->lines = array_values($lines);
        $cart->save();
        return $cart;
    }

    public function removeLines(Cart $cart, array $lineIds): Cart
    {
        $lines = $cart->lines ?? [];
        $lines = array_filter($lines, fn($l) => !in_array($l['id'], $lineIds));
        $cart->lines = array_values($lines);
        $cart->save();
        return $cart;
    }

    public function formatForCheckout(Cart $cart): array
    {
        $totalQty = 0;
        $subtotal = 0;
        $formattedLines = [];

        foreach (($cart->lines ?? []) as $line) {
            $product = $this->lookupProduct($line['merchandiseId']);
            if (!$product) continue;

            $price = $product->price;
            $totalQty += $line['quantity'];
            $subtotal += $price * $line['quantity'];

            $formattedLines[] = [
                'id' => $line['id'],
                'quantity' => $line['quantity'],
                'merchandiseId' => $line['merchandiseId'],
                'title' => $product->title,
                'variantTitle' => 'Default Title',
                'handle' => $product->handle,
                'price' => number_format($price, 2, '.', ''),
                'currencyCode' => 'INR',
                'image' => $this->getFirstImage($product),
            ];
        }

        return [
            'id' => $cart->id,
            'totalQuantity' => $totalQty,
            'subtotal' => number_format($subtotal, 2, '.', ''),
            'lines' => $formattedLines,
        ];
    }

    public function formatShopify(Cart $cart): array
    {
        $totalQty = 0;
        $subtotal = 0;
        $edges = [];

        foreach (($cart->lines ?? []) as $line) {
            $product = $this->lookupProduct($line['merchandiseId']);
            if (!$product) continue;

            $totalQty += $line['quantity'];
            $subtotal += $product->price * $line['quantity'];

            $edges[] = [
                'node' => [
                    'id' => $line['id'],
                    'quantity' => $line['quantity'],
                    'merchandise' => [
                        'id' => $line['merchandiseId'],
                        'title' => 'Default Title',
                        'product' => [
                            'title' => $product->title,
                            'handle' => $product->handle,
                        ],
                        'price' => [
                            'amount' => number_format($product->price, 2, '.', ''),
                            'currencyCode' => 'INR',
                        ],
                        'image' => [
                            'url' => $this->getFirstImage($product),
                            'altText' => $product->title,
                        ],
                    ],
                ],
            ];
        }

        return [
            'id' => $cart->id,
            'checkoutUrl' => '/checkout?cartId=' . $cart->id,
            'totalQuantity' => $totalQty,
            'cost' => [
                'subtotalAmount' => [
                    'amount' => number_format($subtotal, 2, '.', ''),
                    'currencyCode' => 'INR',
                ],
            ],
            'lines' => ['edges' => $edges],
        ];
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
