<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Model implements AuthenticatableContract
{
    use Authenticatable, HasApiTokens;

    protected $fillable = [
        'firstName', 'lastName', 'email', 'password', 'phone', 'defaultAddress',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'defaultAddress' => 'array',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'customerId');
    }
}
