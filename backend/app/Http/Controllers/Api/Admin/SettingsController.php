<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Settings;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show()
    {
        $settings = Settings::getInstance();
        return response()->json($settings);
    }

    public function saveSeo(Request $request)
    {
        $data = $request->validate([
            'titleTemplate' => 'required|string',
            'defaultDescription' => 'required|string',
            'keywords' => 'nullable|string',
        ]);

        $settings = Settings::getInstance();
        $seo = $settings->seo ?? [];
        $settings->seo = array_merge($seo, $data);
        $settings->save();

        return response()->json(['success' => true]);
    }

    public function saveBanners(Request $request)
    {
        $data = $request->validate([
            'banners' => 'required|array',
            'banners.*.id' => 'nullable|string',
            'banners.*.imageUrl' => 'required|string',
            'banners.*.title' => 'required|string',
            'banners.*.subtitle' => 'required|string',
            'banners.*.buttonText' => 'required|string',
            'banners.*.link' => 'required|string',
        ]);

        $settings = Settings::getInstance();
        $settings->banners = $data['banners'];
        $settings->save();

        return response()->json(['success' => true]);
    }

    public function saveHomepage(Request $request)
    {
        $settings = Settings::getInstance();
        $settings->homepage = $request->all();
        $settings->save();

        return response()->json(['success' => true]);
    }

    public function saveFooter(Request $request)
    {
        $settings = Settings::getInstance();
        $settings->footer = $request->all();
        $settings->save();

        return response()->json(['success' => true]);
    }

    public function saveHeader(Request $request)
    {
        $settings = Settings::getInstance();
        $settings->header = $request->all();
        $settings->save();

        return response()->json(['success' => true]);
    }
}
