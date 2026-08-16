<?php

namespace App\Enums;

enum FinancialStatus: string
{
    case PAID = 'PAID';
    case PENDING = 'PENDING';
    case REFUNDED = 'REFUNDED';
}
