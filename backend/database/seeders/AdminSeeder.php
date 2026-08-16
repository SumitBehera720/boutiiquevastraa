<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        Customer::firstOrCreate(
            ['email' => 'admin@boutiiquevastraa.com'],
            [
                'firstName' => 'Boutiique',
                'lastName' => 'Admin',
                'password' => Hash::make('admin123'),
            ]
        );
    }
}
