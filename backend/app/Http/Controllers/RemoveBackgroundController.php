<?php

namespace App\Http\Controllers;

use App\Services\Background\BackgroundRemover;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class RemoveBackgroundController extends Controller
{
    public function __invoke(Request $request, BackgroundRemover $remover): JsonResponse
    {
        $request->validate(['photo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png', 'max:10240', 'dimensions:max_width=6000,max_height=6000']]);
        // PHP owns this temporary upload. Delete it even if a provider fails.
        $photo = $request->file('photo');
        try {
            $png = $remover->remove($photo);

            return response()->json($png === null
                ? ['status' => 'fallback', 'message' => 'Keep the original photo in studio framing.']
                : ['status' => 'processed', 'image' => 'data:image/png;base64,'.base64_encode($png)]
            )->header('Cache-Control', 'no-store, private');
        } finally {
            if (is_file($photo->getRealPath())) {
                @unlink($photo->getRealPath());
            }
        }
    }
}
