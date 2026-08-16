<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

class AdminReviewController extends Controller
{
    public function index()
    {
        return response()->json(
            Review::orderBy('created_at', 'desc')->get()
        );
    }

    public function toggleApproval(string $id)
    {
        $review = Review::find($id);
        if (!$review) {
            return response()->json(['error' => 'Review not found.'], 404);
        }
        $review->approved = !$review->approved;
        $review->save();
        return response()->json(['success' => true, 'approved' => $review->approved]);
    }

    public function destroy(string $id)
    {
        $review = Review::find($id);
        if (!$review) {
            return response()->json(['error' => 'Review not found.'], 404);
        }
        $review->delete();
        return response()->json(['success' => true]);
    }
}
