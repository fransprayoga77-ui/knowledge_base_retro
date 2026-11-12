<?php

return [
    'ai' => [
        'api_key' => env('ANTHROPIC_API_KEY'),
        'model' => env('KB_AI_MODEL', 'claude-opus-5-5'),
        'effort' => env('KB_AI_EFFORT', 'low'),
        'max_tokens' => (int) env('KB_AI_MAX_TOKENS', 4000),
        'context_articles' => (int) env('KB_AI_CONTEXT_ARTICLES', 5),
    ],
    'admin' => [
        'email' => env('KB_ADMIN_EMAIL', 'admin@example.com'),
        'password' => env('KB_ADMIN_PASSWORD', 'password'),
    ],
];
