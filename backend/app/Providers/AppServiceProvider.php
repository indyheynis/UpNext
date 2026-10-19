<?php

namespace App\Providers;

use App\Services\Background\BackgroundRemover;
use App\Services\Background\RemoveBgRemover;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(BackgroundRemover::class, RemoveBgRemover::class);
    }

    public function boot(): void
    {
        RateLimiter::for('cutouts', fn (Request $request) => [
            Limit::perMinute(5)->by('ip:'.$request->ip()),
            Limit::perDay(config('playerhype.daily_cutout_limit'))->by('global-cutout-budget'),
        ]);
    }
}
