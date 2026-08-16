<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Collection;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $path = dirname(__DIR__, 2) . '/../data/products.json';
        if (!file_exists($path)) return;

        $products = json_decode(file_get_contents($path), true);
        if (!$products) return;

        foreach ($products as $p) {
            $price = $p['priceRange']['minVariantPrice']['amount'] ?? '0';
            $compareAt = $p['compareAtPriceRange']['minVariantPrice']['amount'] ?? null;
            $inventory = $p['inventory'] ?? 10;

            $product = Product::firstOrCreate(
                ['handle' => $p['handle']],
                [
                    'title' => $p['title'],
                    'description' => $p['description'] ?? '',
                    'descriptionHtml' => $p['descriptionHtml'] ?? ($p['description'] ?? ''),
                    'availableForSale' => $p['availableForSale'] ?? true,
                    'price' => $price,
                    'compareAtPrice' => $compareAt,
                    'inventory' => $inventory,
                    'tags' => $p['tags'] ?? [],
                    'options' => $p['options'] ?? [['name' => 'Title', 'values' => ['Default Title']]],
                    'variants' => $p['variants'] ?? ['edges' => []],
                    'images' => $p['images'] ?? ['edges' => []],
                ]
            );

            // Attach collections
            $handles = $p['collectionHandles'] ?? [];
            if (!empty($handles)) {
                $collectionIds = Collection::whereIn('handle', $handles)->pluck('id')->toArray();
                $product->collections()->sync($collectionIds);
            }
        }
    }
}
