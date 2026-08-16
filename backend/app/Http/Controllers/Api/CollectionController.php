<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\Product;
use Illuminate\Http\Request;

class CollectionController extends Controller
{
    public function index(Request $request)
    {
        $first = min((int) $request->query('first', 50), 100);
        $collections = Collection::limit($first)->get();

        return response()->json(
            $collections->filter(fn($c) => $c->handle !== 'frontpage')->values()->map(fn($c) => [
                'id' => 'gid://shopify/Collection/' . $c->id,
                'title' => $c->title,
                'handle' => $c->handle,
                'description' => $c->description,
                'image' => $c->image,
            ])
        );
    }

    public function show(Request $request, string $handle)
    {
        $first = min((int) $request->query('first', 24), 250);
        $after = $request->query('after');
        $sortKey = $request->query('sort', 'COLLECTION_DEFAULT');
        $reverse = $request->query('reverse', 'false') === 'true';
        $filters = $request->query('filter', []);

        if (!is_array($filters)) {
            $filters = json_decode($filters, true) ?? [];
        }

        if ($handle === 'all') {
            $collection = [
                'id' => 'gid://shopify/Collection/all',
                'title' => 'All Products',
                'handle' => 'all',
                'description' => 'Browse our complete collection of handcrafted sarees and ethnic apparel.',
                'image' => [
                    'url' => 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop&q=80',
                    'altText' => 'All Products',
                ],
            ];
            $productsQuery = Product::with('collections');
        } else {
            $col = Collection::with('products')->where('handle', $handle)->first();
            if (!$col) {
                return response()->json(['error' => 'Collection not found.'], 404);
            }
            $collection = [
                'id' => 'gid://shopify/Collection/' . $col->id,
                'title' => $col->title,
                'handle' => $col->handle,
                'description' => $col->description,
                'image' => $col->image,
            ];
            $productsQuery = $col->products();
        }

        $products = $productsQuery->get();

        // Apply filters
        foreach ($filters as $filter) {
            if (isset($filter['tag'])) {
                $products = $products->filter(fn($p) => in_array($filter['tag'], $p->tags ?? []));
            }
            if (isset($filter['variantOption'])) {
                $name = $filter['variantOption']['name'];
                $value = $filter['variantOption']['value'];
                $products = $products->filter(function ($p) use ($name, $value) {
                    $variants = $p->variants['edges'] ?? [];
                    foreach ($variants as $v) {
                        foreach ($v['node']['selectedOptions'] ?? [] as $opt) {
                            if (strtolower($opt['name']) === strtolower($name) && strtolower($opt['value']) === strtolower($value)) {
                                return true;
                            }
                        }
                    }
                    return false;
                });
            }
            if (isset($filter['price'])) {
                $min = $filter['price']['min'] ?? 0;
                $max = $filter['price']['max'] ?? PHP_FLOAT_MAX;
                $products = $products->filter(fn($p) => $p->price >= $min && $p->price <= $max);
            }
        }

        // Sort
        $sorted = match ($sortKey) {
            'PRICE' => $reverse ? $products->sortByDesc('price') : $products->sortBy('price'),
            'CREATED_AT' => $reverse ? $products->sortBy('id') : $products->sortByDesc('id'),
            'BEST_SELLING' => $products->sortByDesc(fn($p) => in_array('Bestseller', $p->tags ?? []) ? 1 : 0),
            default => $products->sortBy('title'),
        };
        $products = $sorted->values();

        // Paginate
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

        // Generate filters
        $generatedFilters = $this->generateFilters($productsQuery->get());

        return response()->json([
            ...$collection,
            'products' => [
                'edges' => $products->map(fn($p) => ['node' => $p->toShopifyFormat()]),
                'pageInfo' => [
                    'hasNextPage' => $hasNextPage,
                    'endCursor' => $endCursor,
                ],
                'filters' => $generatedFilters,
            ],
        ]);
    }

    private function generateFilters($products): array
    {
        $tagsMap = [];
        $optionsMap = [];

        foreach ($products as $product) {
            foreach ($product->tags ?? [] as $tag) {
                $tagsMap[$tag] = ($tagsMap[$tag] ?? 0) + 1;
            }
            foreach ($product->options ?? [] as $opt) {
                if (!isset($optionsMap[$opt['name']])) {
                    $optionsMap[$opt['name']] = [];
                }
                foreach ($opt['values'] ?? [] as $val) {
                    $hasVariant = false;
                    foreach ($product->variants['edges'] ?? [] as $v) {
                        foreach ($v['node']['selectedOptions'] ?? [] as $so) {
                            if ($so['name'] === $opt['name'] && $so['value'] === $val) {
                                $hasVariant = true;
                                break;
                            }
                        }
                        if ($hasVariant) break;
                    }
                    if ($hasVariant) {
                        $optionsMap[$opt['name']][$val] = ($optionsMap[$opt['name']][$val] ?? 0) + 1;
                    }
                }
            }
        }

        $filters = [];

        if (!empty($tagsMap)) {
            $filters[] = [
                'id' => 'filter.p.tag',
                'label' => 'Tag',
                'type' => 'LIST',
                'values' => array_map(fn($tag, $count) => [
                    'id' => 'tag-' . $tag,
                    'label' => $tag,
                    'count' => $count,
                    'input' => json_encode(['tag' => $tag]),
                ], array_keys($tagsMap), $tagsMap),
            ];
        }

        foreach ($optionsMap as $name => $values) {
            $filters[] = [
                'id' => 'filter.p.m.custom.' . strtolower(str_replace(' ', '_', $name)),
                'label' => $name,
                'type' => 'LIST',
                'values' => array_map(fn($val, $count) => [
                    'id' => 'opt-' . $name . '-' . $val,
                    'label' => $val,
                    'count' => $count,
                    'input' => json_encode(['variantOption' => ['name' => $name, 'value' => $val]]),
                ], array_keys($values), $values),
            ];
        }

        return $filters;
    }
}
