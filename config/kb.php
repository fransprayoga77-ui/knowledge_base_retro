<?php

return [
    'ai' => [
        // Nilai bawaan dari .env. Bila diisi di menu Admin → Pengaturan AI, nilai di sana yang dipakai.
        'provider' => env('KB_AI_PROVIDER', 'anthropic'),
        'model' => env('KB_AI_MODEL'),
        'api_key' => env('KB_AI_API_KEY'),
        'anthropic_key' => env('ANTHROPIC_API_KEY'),
        'base_url' => env('KB_AI_BASE_URL'),
        'effort' => env('KB_AI_EFFORT', 'low'),
        'max_tokens' => (int) env('KB_AI_MAX_TOKENS', 4000),
        'context_articles' => (int) env('KB_AI_CONTEXT_ARTICLES', 5),
    ],
    'admin' => [
        'email' => env('KB_ADMIN_EMAIL', 'admin@example.com'),
        'password' => env('KB_ADMIN_PASSWORD', 'password'),
    ],
];
