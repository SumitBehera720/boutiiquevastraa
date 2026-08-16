<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function image(Request $request)
    {
        $data = $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp,gif|max:5120',
        ]);

        $file = $request->file('image');
        $ext = $file->extension();
        $name = time() . '_' . Str::random(9) . '.' . $ext;
        $path = $file->storeAs('uploads', $name, 'public');

        return response()->json([
            'success' => true,
            'url' => '/storage/' . $path,
        ]);
    }

    public function file(Request $request)
    {
        $data = $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        $original = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $ext = $file->extension();
        $name = time() . '-' . Str::slug($original) . '.' . $ext;
        $path = $file->storeAs('images/uploads', $name, 'public');

        return response()->json([
            'success' => true,
            'url' => '/storage/' . $path,
        ]);
    }
}
