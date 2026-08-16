<?php

namespace App\Enums;

enum FulfillmentStatus: string
{
    case UNFULFILLED = 'UNFULFILLED';
    case FULFILLED = 'FULFILLED';
    case SHIPPED = 'SHIPPED';
    case DELIVERED = 'DELIVERED';
    case CANCELLED = 'CANCELLED';
}
