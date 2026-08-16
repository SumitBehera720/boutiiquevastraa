<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $path = dirname(__DIR__, 2) . '/../data/users.json';
        if (!file_exists($path)) return;

        $users = json_decode(file_get_contents($path), true);
        if (!$users) return;

        foreach ($users as $u) {
            Customer::firstOrCreate(
                ['email' => $u['email']],
                [
                    'firstName' => $u['firstName'],
                    'lastName' => $u['lastName'],
                    'password' => Hash::make('password'), // Default since SHA-256 can't be reversed
                    'phone' => $u['phone'] ?? null,
                    'defaultAddress' => $u['defaultAddress'] ?? null,
                ]
            );
        }
    }
}
