<?php

return [
    'cutouts_enabled' => env('CUTOUTS_ENABLED', false),
    'remove_bg_key' => env('REMOVE_BG_API_KEY'),
    'daily_cutout_limit' => (int) env('CUTOUTS_DAILY_LIMIT', 100),
];
