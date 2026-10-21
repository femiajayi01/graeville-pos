import { randomInt } from 'crypto';

/** Six-digit code used for brand_no / category_no (Laravel: rand(100000, 999999)). */
export const sixDigitCode = (): string => String(randomInt(100000, 1000000));
