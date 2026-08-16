<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    protected $fillable = [
        'title', 'handle', 'description', 'descriptionHtml',
        'availableForSale', 'price', 'compareAtPrice', 'inventory',
        'tags', 'options', 'variants', 'images',
    ];

    protected $casts = [
        'availableForSale' => 'boolean',
        'price' => 'decimal:2',
        'compareAtPrice' => 'decimal:2',
        'tags' => 'array',
        'options' => 'array',
        'variants' => 'array',
        'images' => 'array',
    ];

    public function collections(): BelongsToMany
    {
        return $this->belongsToMany(Collection::class);
    }

    public function toShopifyFormat(): array
    {
        $images = $this->images ?: [
            'edges' => [
                ['node' => ['url' => 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80', 'altText' => $this->title]]
            ]
        ];
        $variants = $this->variants ?: [
            'edges' => [
                [
                    'node' => [
                        'id' => $this->id . '-variant-0',
                        'title' => 'Default Title',
                        'availableForSale' => $this->availableForSale,
                        'price' => ['amount' => number_format($this->price, 2, '.', ''), 'currencyCode' => 'INR'],
                        'compareAtPrice' => $this->compareAtPrice ? ['amount' => number_format($this->compareAtPrice, 2, '.', ''), 'currencyCode' => 'INR'] : null,
                        'selectedOptions' => [['name' => 'Title', 'value' => 'Default Title']],
                        'image' => null,
                    ]
                ]
            ]
        ];
        $options = $this->options ?: [['name' => 'Title', 'values' => ['Default Title']]];

        return [
            'id' => 'gid://shopify/Product/' . $this->id,
            'title' => $this->title,
            'handle' => $this->handle,
            'description' => $this->description,
            'descriptionHtml' => $this->descriptionHtml ?? $this->description,
            'availableForSale' => $this->availableForSale,
            'priceRange' => [
                'minVariantPrice' => ['amount' => number_format($this->price, 2, '.', ''), 'currencyCode' => 'INR'],
            ],
            'compareAtPriceRange' => [
                'minVariantPrice' => $this->compareAtPrice
                    ? ['amount' => number_format($this->compareAtPrice, 2, '.', ''), 'currencyCode' => 'INR']
                    : ['amount' => number_format($this->price, 2, '.', ''), 'currencyCode' => 'INR'],
            ],
            'images' => $images,
            'options' => $options,
            'variants' => $variants,
            'tags' => $this->tags ?? [],
            'collectionHandles' => $this->collections->pluck('handle')->toArray(),
            'inventory' => $this->inventory ?? 10,
        ];
    }
}
