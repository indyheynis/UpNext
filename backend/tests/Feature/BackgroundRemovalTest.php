<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BackgroundRemovalTest extends TestCase
{
    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6XcAAAAASUVORK5CYII=';

    private function photo(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('athlete.png', base64_decode(self::PNG));
    }

    public function test_health(): void
    {
        $this->getJson('/api/health')->assertOk()->assertJsonPath('status', 'ok');
    }

    public function test_requires_an_actual_image(): void
    {
        $this->postJson('/api/background/remove')->assertUnprocessable()->assertJsonValidationErrors('photo');
        $this->postJson('/api/background/remove', ['photo' => UploadedFile::fake()->createWithContent('bad.png', 'not an image')])->assertUnprocessable();
    }

    public function test_no_key_returns_safe_fallback_without_network_and_deletes_upload(): void
    {
        Http::preventStrayRequests();
        config(['playerhype.cutouts_enabled' => false]);
        $photo = $this->photo();
        $path = $photo->getRealPath();
        $this->postJson('/api/background/remove', ['photo' => $photo])->assertOk()->assertJsonPath('status', 'fallback')->assertHeader('Cache-Control', 'no-store, private');
        Http::assertNothingSent();
        $this->assertFileDoesNotExist($path);
    }

    public function test_provider_success_returns_png_without_public_storage(): void
    {
        config(['playerhype.cutouts_enabled' => true, 'playerhype.remove_bg_key' => 'test-only']);
        Http::fake(['api.remove.bg/*' => Http::response(base64_decode(self::PNG), 200, ['Content-Type' => 'image/png'])]);
        $this->postJson('/api/background/remove', ['photo' => $this->photo()])->assertOk()->assertJsonPath('status', 'processed')->assertJsonPath('image', 'data:image/png;base64,'.self::PNG);
        Http::assertSent(fn ($r) => $r->url() === 'https://api.remove.bg/v1.0/removebg' && $r->hasHeader('X-Api-Key', 'test-only'));
    }

    public function test_provider_failure_falls_back(): void
    {
        config(['playerhype.cutouts_enabled' => true, 'playerhype.remove_bg_key' => 'test-only']);
        Http::fake(['api.remove.bg/*' => Http::response('unavailable', 503)]);
        $this->postJson('/api/background/remove', ['photo' => $this->photo()])->assertOk()->assertJsonPath('status', 'fallback');
    }

    public function test_invalid_provider_output_is_never_returned(): void
    {
        config(['playerhype.cutouts_enabled' => true, 'playerhype.remove_bg_key' => 'test-only']);
        Http::fake(['api.remove.bg/*' => Http::response('<html>not PNG</html>', 200)]);
        $this->postJson('/api/background/remove', ['photo' => $this->photo()])->assertOk()->assertJsonPath('status', 'fallback');
    }

    public function test_requests_are_rate_limited(): void
    {
        config(['playerhype.cutouts_enabled' => false]);
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/background/remove', ['photo' => $this->photo()])->assertOk();
        }
        $this->postJson('/api/background/remove', ['photo' => $this->photo()])->assertTooManyRequests();
    }
}
