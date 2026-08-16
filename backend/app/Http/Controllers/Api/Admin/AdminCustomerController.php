<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;

class AdminCustomerController extends Controller
{
    public function index()
    {
        $customers = Customer::all()->map(fn($c) => [
            'id' => (string) $c->id,
            'firstName' => $c->firstName,
            'lastName' => $c->lastName,
            'email' => $c->email,
            'phone' => $c->phone ?? '',
            'defaultAddress' => $c->defaultAddress,
            'createdAt' => $c->created_at->toIso8601String(),
        ]);

        return response()->json($customers);
    }
}
