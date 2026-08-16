<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCollectionController extends Controller
{
    public function index()
    {
        return response()->json(Collection::all()->map(fn($c) => [
            'id' => 'gid://shopify/Collection/' . $c->id,
            'title' => $c->title,
            'handle' => $c->handle,
            'description' => $c->description,
            'image' => $c->image,
        ]));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'handle' => 'nullable|string|max:255|unique:collections,handle',
            'description' => 'required|string',
            'imageUrl' => 'nullable|string',
        ]);

        $handle = $data['handle'] ?? Str::slug($data['title']);
        if (Collection::where('handle', $handle)->exists()) {
            $base = $handle;
            $counter = 1;
            while (Collection::where('handle', $handle)->exists()) {
                $handle = $base . '-' . $counter++;
            }
        }

        $collection = Collection::create([
            'title' => $data['title'],
            'handle' => $handle,
            'description' => $data['description'],
            'image' => $data['imageUrl'] ? ['url' => $data['imageUrl'], 'altText' => $data['title']] : null,
        ]);

        return response()->json([
            'success' => true,
            'id' => 'gid://shopify/Collection/' . $collection->id,
            'handle' => $collection->handle,
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $collection = Collection::find($id);
        if (!$collection) {
            return response()->json(['error' => 'Collection not found.'], 404);
        }

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'handle' => 'nullable|string|max:255|unique:collections,handle,' . $id,
            'description' => 'sometimes|string',
            'imageUrl' => 'nullable|string',
        ]);

        if (isset($data['title'])) $collection->title = $data['title'];
        if (isset($data['handle'])) $collection->handle = $data['handle'];
        if (isset($data['description'])) $collection->description = $data['description'];
        if (isset($data['imageUrl'])) {
            $collection->image = ['url' => $data['imageUrl'], 'altText' => $collection->title];
        }

        $collection->save();

        return response()->json([
            'success' => true,
            'id' => 'gid://shopify/Collection/' . $collection->id,
            'handle' => $collection->handle,
        ]);
    }

    public function destroy(string $id)
    {
        $collection = Collection::find($id);
        if (!$collection) {
            return response()->json(['error' => 'Collection not found.'], 404);
        }
        $collection->products()->detach();
        $collection->delete();
        return response()->json(['success' => true]);
    }
}
