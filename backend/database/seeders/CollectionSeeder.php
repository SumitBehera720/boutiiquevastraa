<?php

namespace Database\Seeders;

use App\Models\Collection;
use Illuminate\Database\Seeder;

class CollectionSeeder extends Seeder
{
    public function run(): void
    {
        $path = dirname(__DIR__, 2) . '/../data/collections.json';
        if (!file_exists($path)) return;

        $collections = json_decode(file_get_contents($path), true);
        if (!$collections) return;

        foreach ($collections as $c) {
            Collection::firstOrCreate(
                ['handle' => $c['handle']],
                [
                    'title' => $c['title'],
                    'description' => $c['description'] ?? '',
                    'image' => isset($c['image']) ? $c['image'] : null,
                ]
            );
        }
    }
}
