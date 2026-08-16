<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->integer('orderNumber')->unique();
            $table->foreignId('customerId')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('customerName');
            $table->string('email');
            $table->string('phone');
            $table->string('financialStatus');
            $table->string('fulfillmentStatus');
            $table->decimal('totalPrice', 12, 2);
            $table->decimal('discountAmount', 12, 2)->default(0);
            $table->string('promoCode')->nullable();
            $table->json('shippingAddress');
            $table->json('lineItems');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
