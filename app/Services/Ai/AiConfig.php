<?php

namespace App\Services\Ai;

use App\Models\Setting;

/**
 * Konfigurasi AI yang aktif. Prioritas: Pengaturan AI di panel admin,
 * lalu nilai di .env (KB_AI_PROVIDER, KB_AI_MODEL, KB_AI_API_KEY / ANTHROPIC_API_KEY, KB_AI_BASE_URL).
 */
final class AiConfig
{
    public function __construct(
        public readonly string $provider,
        public readonly string $driver,
        public readonly string $model,
        public readonly ?string $apiKey,
        public readonly ?string $baseUrl,
        public readonly string $effort,
        public readonly int $maxTokens,
    ) {}

    public static function current(): self
    {
        $provider = Setting::get('ai.provider', config('kb.ai.provider'));
        $preset = Providers::get($provider) ?? Providers::get('anthropic');
        $provider = Providers::get($provider) ? $provider : 'anthropic';

        $envKey = config('kb.ai.api_key') ?: ($provider === 'anthropic' ? config('kb.ai.anthropic_key') : null);

        return new self(
            provider: $provider,
            driver: $preset['driver'],
            model: Setting::get('ai.model', config('kb.ai.model') ?: $preset['model']) ?? '',
            apiKey: Setting::getSecret('ai.api_key') ?? $envKey,
            baseUrl: rtrim((string) (Setting::get('ai.base_url', config('kb.ai.base_url') ?: $preset['base_url'])), '/') ?: null,
            effort: Setting::get('ai.effort', config('kb.ai.effort')) ?? 'low',
            maxTokens: (int) config('kb.ai.max_tokens'),
        );
    }

    public function enabled(): bool
    {
        if ($this->model === '') {
            return false;
        }
        if ($this->driver === 'anthropic') {
            return filled($this->apiKey);
        }

        // Server lokal (mis. Ollama) boleh tanpa key.
        return filled($this->baseUrl) && (filled($this->apiKey) || $this->provider === 'custom');
    }

    public function label(): string
    {
        return (Providers::get($this->provider)['label'] ?? $this->provider).' · '.$this->model;
    }
}
