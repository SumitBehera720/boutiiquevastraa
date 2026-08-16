<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'productHandle' => 'required|string',
            'author' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string',
        ]);

        $review = Review::create([
            'productHandle' => $data['productHandle'],
            'author' => $data['author'],
            'rating' => $data['rating'],
            'comment' => $data['comment'],
            'approved' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully. It will appear after moderation.',
            'reviewId' => (string) $review->id,
        ], 201);
    }

    public function byProduct(string $handle)
    {
        $reviews = Review::where('productHandle', $handle)
            ->where('approved', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }

    public function global()
    {
        $reviews = Review::where('productHandle', 'global')
            ->where('approved', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }
}
