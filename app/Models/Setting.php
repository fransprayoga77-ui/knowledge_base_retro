<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;
use Throwable;

/** Pengaturan sederhana key-value (dengan opsi nilai terenkripsi untuk API key). */
class Setting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    /** @return array<string, ?string> */
    public static function all_cached(): array
    {
        return Cache::rememberForever('kb.settings', function () {
            try {
                return Schema::hasTable('settings') ? static::query()->pluck('value', 'key')->all() : [];
            } catch (Throwable) {
                return [];
            }
        });
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        $value = static::all_cached()[$key] ?? null;

        return $value === null || $value === '' ? $default : $value;
    }

    public static function getSecret(string $key): ?string
    {
        $value = static::get($key);
        if (! $value) {
            return null;
        }
        try {
            return Crypt::decryptString($value);
        } catch (Throwable) {
            return null;
        }
    }

    public static function put(string $key, ?string $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget('kb.settings');
    }

    public static function putSecret(string $key, ?string $value): void
    {
        static::put($key, $value === null || $value === '' ? null : Crypt::encryptString($value));
    }
}
