<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SettingsSeeder::class,
            AdminSeeder::class,
            CollectionSeeder::class,
            ProductSeeder::class,
            CouponSeeder::class,
            ReviewSeeder::class,
            CustomerSeeder::class,
            OrderSeeder::class,
        ]);
    }
}
