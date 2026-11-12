<?php

namespace App\Services\Ai;

/**
 * Daftar provider AI yang bisa dipilih di Pengaturan AI.
 * driver "anthropic" memakai SDK resmi Anthropic; selebihnya memakai endpoint
 * Chat Completions yang kompatibel dengan OpenAI ({base_url}/chat/completions).
 *
 * Nama model bawaan hanya titik awal — nama model berganti cepat, jadi cek halaman
 * dokumentasi provider dan ubah di Pengaturan AI bila perlu.
 */
class Providers
{
    public const LIST = [
        'anthropic' => [
            'label' => 'Claude (Anthropic)',
            'driver' => 'anthropic',
            'base_url' => null,
            'model' => 'claude-opus-5-5',
            'models' => ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'],
            'key_url' => 'https://console.anthropic.com/settings/keys',
            'note' => 'Haiku paling hemat, Sonnet seimbang, Opus paling teliti.',
        ],
        'gemini' => [
            'label' => 'Google Gemini',
            'driver' => 'openai',
            'base_url' => 'https://generativelanguage.googleapis.com/v1beta/openai',
            'model' => 'gemini-3.8-flash',
            'models' => [],
            'key_url' => 'https://aistudio.google.com/apikey',
            'note' => 'Ada kuota gratis dari Google AI Studio.',
        ],
        'openai' => [
            'label' => 'ChatGPT (OpenAI)',
            'driver' => 'openai',
            'base_url' => 'https://api.openai.com/v1',
            'model' => 'gpt-5-mini',
            'models' => [],
            'key_url' => 'https://platform.openai.com/api-keys',
            'note' => 'Model "mini"/"nano" lebih murah.',
        ],
        'deepseek' => [
            'label' => 'DeepSeek',
            'driver' => 'openai',
            'base_url' => 'https://api.deepseek.com',
            'model' => 'deepseek-chat',
            'models' => [],
            'key_url' => 'https://platform.deepseek.com/api_keys',
            'note' => 'Sangat terjangkau.',
        ],
        'glm' => [
            'label' => 'GLM (Zhipu / Z.ai)',
            'driver' => 'openai',
            'base_url' => 'https://api.z.ai/api/paas/v4',
            'model' => '',
            'models' => [],
            'key_url' => 'https://z.ai/manage-apikey/apikey-list',
            'note' => 'Untuk akun Tiongkok (bigmodel.cn) ganti base URL ke https://open.bigmodel.cn/api/paas/v4. Isi nama model sesuai dokumentasi GLM.',
        ],
        'openrouter' => [
            'label' => 'OpenRouter (ratusan model)',
            'driver' => 'openai',
            'base_url' => 'https://openrouter.ai/api/v1',
            'model' => '',
            'models' => [],
            'key_url' => 'https://openrouter.ai/keys',
            'note' => 'Satu key untuk banyak model (Qwen, Llama, Mistral, Kimi, dll). Isi model seperti "vendor/nama-model".',
        ],
        'groq' => [
            'label' => 'Groq',
            'driver' => 'openai',
            'base_url' => 'https://api.groq.com/openai/v1',
            'model' => '',
            'models' => [],
            'key_url' => 'https://console.groq.com/keys',
            'note' => 'Sangat cepat, ada kuota gratis. Isi nama model dari daftar model Groq.',
        ],
        'custom' => [
            'label' => 'Lainnya (OpenAI-compatible)',
            'driver' => 'openai',
            'base_url' => '',
            'model' => '',
            'models' => [],
            'key_url' => null,
            'note' => 'Untuk Qwen/DashScope, Kimi, Mistral, Ollama lokal (http://localhost:11434/v1), dll. API key boleh kosong bila server tidak memintanya.',
        ],
    ];

    /** @return array<string, mixed>|null */
    public static function get(string $key): ?array
    {
        return self::LIST[$key] ?? null;
    }
}
