<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code', 'type', 'value', 'active', 'minPurchaseAmount',
    ];

    protected $casts = [
        'type' => 'string',
        'value' => 'decimal:2',
        'active' => 'boolean',
        'minPurchaseAmount' => 'decimal:2',
    ];
}
