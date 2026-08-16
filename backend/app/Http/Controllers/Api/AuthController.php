<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'firstName' => 'required|string|max:255',
            'lastName' => 'required|string|max:255',
            'email' => 'required|email|unique:customers,email',
            'password' => 'required|string|min:6',
        ]);

        $customer = Customer::create([
            'firstName' => $data['firstName'],
            'lastName' => $data['lastName'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $token = $customer->createToken('customer-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'customer' => $this->formatCustomer($customer),
        ]);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $customer = Customer::where('email', $data['email'])->first();

        if (!$customer || !Hash::check($data['password'], $customer->password)) {
            throw ValidationException::withMessages([
                'email' => ['Unidentified customer, check email and password.'],
            ]);
        }

        $token = $customer->createToken('customer-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'customer' => $this->formatCustomer($customer),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true]);
    }

    public function me(Request $request)
    {
        $customer = $request->user();
        return response()->json($this->formatCustomerWithOrders($customer));
    }

    private function formatCustomer(Customer $customer): array
    {
        return [
            'id' => (string) $customer->id,
            'firstName' => $customer->firstName,
            'lastName' => $customer->lastName,
            'email' => $customer->email,
            'phone' => $customer->phone ?? '',
            'defaultAddress' => $customer->defaultAddress,
        ];
    }

    private function formatCustomerWithOrders(Customer $customer): array
    {
        $orders = Order::where('customerId', $customer->id)
            ->orWhere('email', $customer->email)
            ->orderBy('created_at', 'desc')
            ->get();

        return [
            'id' => (string) $customer->id,
            'firstName' => $customer->firstName,
            'lastName' => $customer->lastName,
            'email' => $customer->email,
            'phone' => $customer->phone ?? '',
            'defaultAddress' => $customer->defaultAddress,
            'orders' => [
                'edges' => $orders->map(fn($o) => [
                    'node' => [
                        'id' => (string) $o->id,
                        'orderNumber' => $o->orderNumber,
                        'processedAt' => $o->created_at->toIso8601String(),
                        'financialStatus' => $o->financialStatus,
                        'fulfillmentStatus' => $o->fulfillmentStatus,
                        'totalPrice' => [
                            'amount' => number_format($o->totalPrice, 2, '.', ''),
                            'currencyCode' => 'INR',
                        ],
                        'lineItems' => [
                            'edges' => collect($o->lineItems)->map(fn($item) => [
                                'node' => [
                                    'title' => $item['title'],
                                    'quantity' => $item['quantity'],
                                    'variant' => [
                                        'image' => isset($item['image']) ? ['url' => $item['image']] : null,
                                    ],
                                ],
                            ])->toArray(),
                        ],
                    ],
                ])->toArray(),
            ],
        ];
    }
}
