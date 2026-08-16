<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Settings;

class SettingsController extends Controller
{
    public function show()
    {
        $settings = Settings::getInstance();
        return response()->json([
            'seo' => $settings->seo ?? [
                'titleTemplate' => '%s | Boutiique Vastraa',
                'defaultDescription' => '',
                'keywords' => '',
            ],
            'banners' => $settings->banners ?? [],
            'homepage' => $settings->homepage ?? [],
            'footer' => $settings->footer ?? [],
            'header' => $settings->header ?? [],
        ]);
    }
}
