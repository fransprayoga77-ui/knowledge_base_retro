---
title: "Menghitung HPP dengan kalkulator TCO"
slug: kalkulator-hpp
audience: internal
category: "Pricing Builder"
category_order: 3
order: 1
platform: web
tags: ["HPP", "TCO", "biaya", "markup", "harga pokok"]
excerpt: "Cara kerja Kalkulator HPP: biaya kepemilikan, biaya harian, operasional, overhead, dan markup."
verification: verified
review_note: ""
---

Kalkulator HPP ada di **Pricing Builder** → tab **Kalkulator HPP**.

## Cara perhitungan

1. **Biaya kepemilikan per bulan** = (DP + cicilan × tenor + admin − harga jual kembali) ÷ masa pembebanan + bunga modal DP.
2. **Biaya unit per hari** = (kepemilikan + asuransi + STNK + maintenance + lain-lain) ÷ hari sewa per bulan (default 22).
3. **Operasional**: dalam kota menghitung sopir, BBM, dan tol per hari. Luar kota menghitung BBM dari jarak (km ÷ km/liter × harga BBM), tol per trip, serta sopir dan makan/inap per hari.
4. **Overhead** default 5% dari biaya langsung.
5. **Harga V1–V3** = HPP × (1 + markup × (1 + fee marketing)). PKP menambah PPN.

## Setelah menghitung

Simpan perhitungan, lalu pilih **terapkan ke produk** (biaya saja atau sekaligus harga V1–V3), atau **buat produk baru**.
