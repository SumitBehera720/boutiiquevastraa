<?php

namespace Database\Seeders;

use App\Models\Review;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $path = dirname(__DIR__, 2) . '/../data/reviews.json';
        if (!file_exists($path)) return;

        $reviews = json_decode(file_get_contents($path), true);
        if (!$reviews) return;

        foreach ($reviews as $r) {
            Review::create([
                'productHandle' => $r['productHandle'],
                'author' => $r['author'],
                'rating' => $r['rating'],
                'comment' => $r['comment'],
                'approved' => $r['approved'] ?? false,
            ]);
        }
    }
}
