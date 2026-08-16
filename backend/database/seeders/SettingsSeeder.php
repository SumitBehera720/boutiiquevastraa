<?php

namespace Database\Seeders;

use App\Models\Settings;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settingsPath = dirname(__DIR__, 2) . '/../data/settings.json';
        if (!file_exists($settingsPath)) {
            Settings::getInstance();
            return;
        }

        $data = json_decode(file_get_contents($settingsPath), true);
        if (!$data) {
            Settings::getInstance();
            return;
        }

        $settings = Settings::getInstance();
        $settings->seo = $data['seo'] ?? ['titleTemplate' => '%s | Boutiique Vastraa', 'defaultDescription' => '', 'keywords' => ''];
        $settings->banners = $data['banners'] ?? [];
        $settings->homepage = $data['homepage'] ?? [];
        $settings->footer = $data['footer'] ?? [];
        $settings->header = $data['header'] ?? [];
        $settings->save();
    }
}
