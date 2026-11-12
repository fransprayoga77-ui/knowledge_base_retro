<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\User;
use App\Services\ArticleImporter;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(ArticleImporter $importer): void
    {
        User::updateOrCreate(
            ['email' => config('kb.admin.email')],
            ['name' => 'Administrator', 'password' => config('kb.admin.password'), 'is_admin' => true],
        );

        $adacar = Project::updateOrCreate(['slug' => 'adacar'], [
            'name' => 'Adacar',
            'tagline' => 'Pusat bantuan sewa mobil dengan driver',
            'description' => 'Panduan untuk pelanggan, mitra vendor, driver, dan admin Adacar.id.',
            'audiences' => [
                ['key' => 'customer', 'label' => 'Pelanggan', 'public' => true],
                ['key' => 'vendor', 'label' => 'Vendor / Mitra', 'public' => false],
                ['key' => 'driver', 'label' => 'Driver', 'public' => false],
                ['key' => 'admin', 'label' => 'Admin', 'public' => false],
            ],
            'support_contact' => null,
            'is_published' => true,
        ]);
        $importer->importDirectory($adacar, base_path('content/adacar'));

        $pricing = Project::updateOrCreate(['slug' => 'artha-pricing'], [
            'name' => 'Artha Pricing Intelligence',
            'tagline' => 'Pricelist, kompetitor, dan kalkulator HPP rental mobil',
            'description' => 'Panduan internal aplikasi pricing CV Artha Mandiri.',
            'audiences' => [
                ['key' => 'internal', 'label' => 'Tim Internal', 'public' => true],
            ],
            'is_published' => true,
        ]);
        $importer->importDirectory($pricing, base_path('content/artha-pricing'));
    }
}
