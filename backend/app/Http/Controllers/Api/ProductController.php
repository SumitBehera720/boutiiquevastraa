<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $first = min((int) $request->query('first', 50), 250);
        $products = Product::with('collections')->limit($first)->get();

        return response()->json(
            $products->map(fn($p) => $p->toShopifyFormat())
        );
    }

    public function show(string $handle)
    {
        $product = Product::with('collections')->where('handle', $handle)->first();
        if (!$product) {
            return response()->json(['error' => 'Product not found.'], 404);
        }
        return response()->json($product->toShopifyFormat());
    }

    public function recommendations(string $id)
    {
        $product = Product::with('collections')->find($id);
        if (!$product) {
            return response()->json([], 200);
        }

        $handleIds = $product->collections->pluck('id')->toArray();
        $tags = $product->tags ?? [];

        $recommendations = Product::with('collections')
            ->where('id', '!=', $product->id)
            ->where(function ($q) use ($handleIds, $tags) {
                if (!empty($handleIds)) {
                    $q->whereHas('collections', fn($cq) => $cq->whereIn('collections.id', $handleIds));
                }
                if (!empty($tags)) {
                    foreach ($tags as $tag) {
                        $q->orWhereJsonContains('tags', $tag);
                    }
                }
            })
            ->limit(4)
            ->get();

        return response()->json(
            $recommendations->map(fn($p) => $p->toShopifyFormat())
        );
    }

    public function search(Request $request)
    {
        $query = $request->query('q', '');
        $first = min((int) $request->query('first', 24), 250);
        $after = $request->query('after');

        $products = Product::with('collections')
            ->where(function ($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%")
                  ->orWhereJsonContains('tags', $query);
            })
            ->get();

        $hasNextPage = false;
        $endCursor = '';

        if ($after) {
            $index = $products->search(fn($p) => (string) $p->id === $after);
            if ($index !== false) {
                $products = $products->slice($index + 1)->values();
            }
        }

        if ($products->count() > $first) {
            $hasNextPage = true;
            $endCursor = (string) $products[$first - 1]->id;
            $products = $products->take($first);
        }

        return response()->json([
            'edges' => $products->map(fn($p) => ['node' => $p->toShopifyFormat()]),
            'pageInfo' => [
                'hasNextPage' => $hasNextPage,
                'endCursor' => $endCursor,
            ],
        ]);
    }
}
