<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Settings extends Model
{
    protected $fillable = [
        'seo', 'banners', 'homepage', 'footer', 'header',
    ];

    protected $casts = [
        'seo' => 'array',
        'banners' => 'array',
        'homepage' => 'array',
        'footer' => 'array',
        'header' => 'array',
    ];

    public static function getInstance(): self
    {
        return self::firstOrCreate(['id' => 1]);
    }
}
