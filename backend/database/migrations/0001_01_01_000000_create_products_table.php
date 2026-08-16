<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('handle')->unique();
            $table->text('description');
            $table->text('descriptionHtml')->nullable();
            $table->boolean('availableForSale')->default(true);
            $table->decimal('price', 12, 2);
            $table->decimal('compareAtPrice', 12, 2)->nullable();
            $table->integer('inventory')->default(10);
            $table->json('tags')->nullable();
            $table->json('options')->nullable();
            $table->json('variants')->nullable();
            $table->json('images')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
