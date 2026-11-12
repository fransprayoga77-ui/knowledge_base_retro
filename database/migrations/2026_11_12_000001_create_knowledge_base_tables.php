<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('password');
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('tagline')->nullable();
            $table->text('description')->nullable();
            // Daftar peran/pembaca, mis. [{"key":"customer","label":"Pelanggan","public":true}]
            $table->json('audiences');
            $table->text('support_contact')->nullable();
            $table->string('color_preset')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        // Akses member (non-admin) ke peran yang tidak publik pada project tertentu.
        Schema::create('project_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->json('audiences');
            $table->timestamps();
            $table->unique(['project_id', 'user_id']);
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('audience', 40);
            $table->string('name');
            $table->string('slug');
            $table->integer('position')->default(0);
            $table->timestamps();
            $table->unique(['project_id', 'audience', 'slug']);
        });

        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('audience', 40);
            $table->string('title');
            $table->string('slug');
            $table->text('excerpt')->nullable();
            $table->longText('body');
            $table->json('tags')->nullable();
            $table->string('platform', 20)->default('all');
            $table->string('status', 20)->default('draft'); // draft | published
            $table->string('verification', 20)->default('verified'); // verified | needs_review
            $table->text('review_note')->nullable();
            $table->integer('position')->default(0);
            $table->unsignedInteger('views')->default(0);
            $table->unsignedInteger('helpful_yes')->default(0);
            $table->unsignedInteger('helpful_no')->default(0);
            $table->timestamps();
            $table->unique(['project_id', 'slug']);
            $table->index(['project_id', 'audience', 'status']);
        });

        if (DB::getDriverName() === 'pgsql') {
            // Full-text search: judul & tag berbobot lebih tinggi dari isi.
            DB::statement(<<<'SQL'
                ALTER TABLE articles ADD COLUMN search tsvector GENERATED ALWAYS AS (
                    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
                    setweight(to_tsvector('simple', coalesce(tags::text, '')), 'A') ||
                    setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B') ||
                    setweight(to_tsvector('simple', coalesce(body, '')), 'C')
                ) STORED
            SQL);
            DB::statement('CREATE INDEX articles_search_idx ON articles USING GIN (search)');
        }

        Schema::create('chat_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('audience', 40)->nullable();
            $table->text('question');
            $table->longText('answer')->nullable();
            $table->json('sources')->nullable();
            $table->boolean('answered')->default(true);
            $table->string('feedback', 10)->nullable(); // up | down
            $table->string('error')->nullable();
            $table->timestamps();
            $table->index(['project_id', 'answered']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_logs');
        Schema::dropIfExists('articles');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('project_user');
        Schema::dropIfExists('projects');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('is_admin'));
    }
};
