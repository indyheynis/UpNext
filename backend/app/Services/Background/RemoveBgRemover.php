<?php

namespace App\Services\Background;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Throwable;

final class RemoveBgRemover implements BackgroundRemover
{
    public function remove(UploadedFile $photo): ?string
    {
        if (! config('playerhype.cutouts_enabled') || ! config('playerhype.remove_bg_key')) {
            return null;
        }
        $stream = fopen($photo->getRealPath(), 'rb');
        try {
            $response = Http::connectTimeout(5)->timeout(25)
                ->withHeaders(['X-Api-Key' => config('playerhype.remove_bg_key')])
                ->attach('image_file', $stream, 'athlete.'.$photo->extension())
                ->post('https://api.remove.bg/v1.0/removebg', ['size' => 'auto', 'format' => 'png']);
            if (! $response->successful()) {
                return null;
            }
            $png = $response->body();
            if (strlen($png) > 12 * 1024 * 1024 || ! str_starts_with($png, "\x89PNG\r\n\x1a\n")) {
                return null;
            }
            $dimensions = @getimagesizefromstring($png);
            if (! $dimensions || $dimensions[0] > 6000 || $dimensions[1] > 6000) {
                return null;
            }

            return $png;
        } catch (Throwable) {
            // Do not log request bodies, credentials, or upstream responses containing user data.
            return null;
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }
    }
}
