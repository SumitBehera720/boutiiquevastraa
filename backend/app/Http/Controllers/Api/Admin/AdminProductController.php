<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminProductController extends Controller
{
    public function index()
    {
        $products = Product::with('collections')->get();
        return response()->json(
            $products->map(fn($p) => $p->toShopifyFormat())
        );
    }

    public function show(string $id)
    {
        $product = Product::with('collections')->find($id);
        if (!$product) {
            return response()->json(['error' => 'Product not found.'], 404);
        }
        return response()->json($product->toShopifyFormat());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'handle' => 'nullable|string|max:255|unique:products,handle',
            'description' => 'required|string',
            'descriptionHtml' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'compareAtPrice' => 'nullable|numeric|min:0',
            'inventory' => 'required|integer|min:0',
            'tags' => 'nullable|array',
            'tags.*' => 'string',
            'options' => 'nullable|array',
            'variants' => 'nullable|array',
            'images' => 'nullable|array',
            'collectionHandles' => 'nullable|array',
            'collectionHandles.*' => 'string',
        ]);

        $handle = $this->generateHandle($data['title'], $data['handle'] ?? null);

        $variants = $data['variants'] ?? [];
        if (empty($variants)) {
            $variants = [
                [
                    'title' => 'Default Title',
                    'price' => ['amount' => number_format($data['price'], 2, '.', ''), 'currencyCode' => 'INR'],
                    'compareAtPrice' => $data['compareAtPrice'] ? ['amount' => number_format($data['compareAtPrice'], 2, '.', ''), 'currencyCode' => 'INR'] : null,
                    'selectedOptions' => [['name' => 'Title', 'value' => 'Default Title']],
                ],
            ];
        }

        $product = Product::create([
            'title' => $data['title'],
            'handle' => $handle,
            'description' => $data['description'],
            'descriptionHtml' => $data['descriptionHtml'] ?? $data['description'],
            'price' => $data['price'],
            'compareAtPrice' => $data['compareAtPrice'] ?? null,
            'inventory' => $data['inventory'],
            'tags' => $data['tags'] ?? [],
            'options' => $data['options'] ?? [['name' => 'Title', 'values' => ['Default Title']]],
            'variants' => ['edges' => array_map(fn($v, $i) => [
                'node' => [
                    'id' => 'variant_' . time() . '_' . $i,
                    'title' => $v['title'] ?? 'Default Title',
                    'availableForSale' => true,
                    'price' => $v['price'] ?? ['amount' => number_format($data['price'], 2, '.', ''), 'currencyCode' => 'INR'],
                    'compareAtPrice' => $v['compareAtPrice'] ?? null,
                    'selectedOptions' => $v['selectedOptions'] ?? [],
                ],
            ], $variants, array_keys($variants))],
            'images' => ['edges' => array_map(fn($img) => ['node' => ['url' => $img, 'altText' => $data['title']]], $data['images'] ?? [])],
        ]);

        // Attach collections
        if (!empty($data['collectionHandles'])) {
            $collectionIds = Collection::whereIn('handle', $data['collectionHandles'])->pluck('id');
            $product->collections()->sync($collectionIds);
        }

        return response()->json([
            'success' => true,
            'id' => (string) $product->id,
            'handle' => $product->handle,
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['error' => 'Product not found.'], 404);
        }

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'handle' => 'nullable|string|max:255|unique:products,handle,' . $id,
            'description' => 'sometimes|string',
            'descriptionHtml' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'compareAtPrice' => 'nullable|numeric|min:0',
            'inventory' => 'sometimes|integer|min:0',
            'tags' => 'nullable|array',
            'options' => 'nullable|array',
            'variants' => 'nullable|array',
            'images' => 'nullable|array',
            'collectionHandles' => 'nullable|array',
        ]);

        if (isset($data['title'])) {
            $product->title = $data['title'];
            $product->handle = $this->generateHandle($data['title'], $data['handle'] ?? $product->handle);
        }
        if (isset($data['handle'])) {
            $product->handle = $data['handle'];
        }
        if (isset($data['description'])) $product->description = $data['description'];
        if (isset($data['descriptionHtml'])) $product->descriptionHtml = $data['descriptionHtml'];
        if (isset($data['price'])) $product->price = $data['price'];
        if (isset($data['compareAtPrice'])) $product->compareAtPrice = $data['compareAtPrice'];
        if (isset($data['inventory'])) $product->inventory = $data['inventory'];
        if (isset($data['tags'])) $product->tags = $data['tags'];
        if (isset($data['options'])) $product->options = $data['options'];
        if (isset($data['variants'])) {
            $product->variants = ['edges' => array_map(fn($v, $i) => [
                'node' => [
                    'id' => 'variant_' . time() . '_' . $i,
                    'title' => $v['title'] ?? 'Default Title',
                    'availableForSale' => true,
                    'price' => $v['price'] ?? ['amount' => number_format($data['price'] ?? $product->price, 2, '.', ''), 'currencyCode' => 'INR'],
                    'compareAtPrice' => $v['compareAtPrice'] ?? null,
                    'selectedOptions' => $v['selectedOptions'] ?? [],
                ],
            ], $data['variants'], array_keys($data['variants']))];
        }
        if (isset($data['images'])) {
            $product->images = ['edges' => array_map(fn($img) => ['node' => ['url' => $img, 'altText' => $product->title]], $data['images'])];
        }

        $product->save();

        if (!empty($data['collectionHandles'])) {
            $collectionIds = Collection::whereIn('handle', $data['collectionHandles'])->pluck('id');
            $product->collections()->sync($collectionIds);
        }

        return response()->json([
            'success' => true,
            'id' => (string) $product->id,
            'handle' => $product->handle,
        ]);
    }

    public function destroy(string $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['error' => 'Product not found.'], 404);
        }
        $product->collections()->detach();
        $product->delete();
        return response()->json(['success' => true]);
    }

    private function generateHandle(string $title, ?string $override = null): string
    {
        if ($override) return $override;
        $handle = Str::slug($title);
        $base = $handle;
        $counter = 1;
        while (Product::where('handle', $handle)->exists()) {
            $handle = $base . '-' . $counter++;
        }
        return $handle;
    }
}
