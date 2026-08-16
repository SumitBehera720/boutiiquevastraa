<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Cart extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'lines'];

    protected $casts = [
        'lines' => 'array',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($cart) {
            if (empty($cart->id)) {
                $cart->id = 'cart_' . time() . '_' . Str::random(9);
            }
        });
    }
}
