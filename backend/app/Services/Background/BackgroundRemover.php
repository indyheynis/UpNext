<?php

namespace App\Services\Background;

use Illuminate\Http\UploadedFile;

interface BackgroundRemover
{
    /** Returns a verified PNG, or null when unavailable. Never persists the upload. */
    public function remove(UploadedFile $photo): ?string;
}
