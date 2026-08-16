<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'orderNumber', 'customerId', 'customerName', 'email', 'phone',
        'financialStatus', 'fulfillmentStatus', 'totalPrice',
        'discountAmount', 'promoCode', 'shippingAddress', 'lineItems',
    ];

    protected $casts = [
        'financialStatus' => 'string',
        'fulfillmentStatus' => 'string',
        'totalPrice' => 'decimal:2',
        'discountAmount' => 'decimal:2',
        'shippingAddress' => 'array',
        'lineItems' => 'array',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customerId');
    }
}
