import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ILike } from 'typeorm';
import { sixDigitCode } from '../../common/utils/random.util';
import { Brand } from '../../modules/brands/brand.entity';
import { Category } from '../../modules/categories/category.entity';
import { Product } from '../../modules/products/product.entity';
import dataSource from '../data-source';

/**
 * TEST DATA ONLY — fictional-barcode demo catalogue for trying the system locally.
 * Run with: npm run seed:demo
 *
 * Safe to run more than once: brands/categories are matched by name and products by barcode,
 * so a re-run resets prices/stock to these values instead of creating duplicates.
 * Barcodes are valid EAN-13 numbers in a made-up 615000… range, so they won't clash with real items.
 */

export const DEMO_BRANDS = [
  'Nivea',
  'Dove',
  'Vaseline',
  'Close Up',
  'Peak',
  'Indomie',
  'Dettol',
  'Golden Penny',
];

export const DEMO_CATEGORIES = [
  'Skin Care',
  'Toiletries',
  'Oral Care',
  'Beverages',
  'Food & Groceries',
  'Household',
];

/** [name, barcode, brand, category, costPrice, sellingPrice, stock] */
export const DEMO_PRODUCTS: [
  string,
  string,
  string,
  string,
  number,
  number,
  number,
][] = [
  // Skin care
  [
    'Nivea Body Lotion 400ml',
    '6150000000013',
    'Nivea',
    'Skin Care',
    3800,
    4500,
    24,
  ],
  [
    'Nivea Men Roll-On 50ml',
    '6150000000020',
    'Nivea',
    'Skin Care',
    1900,
    2350,
    30,
  ],
  [
    'Nivea Soft Cream 200ml',
    '6150000000037',
    'Nivea',
    'Skin Care',
    3200,
    3900,
    2,
  ], // low stock
  [
    'Vaseline Petroleum Jelly 250ml',
    '6150000000044',
    'Vaseline',
    'Skin Care',
    1500,
    1850,
    40,
  ],
  [
    'Vaseline Cocoa Glow Lotion 400ml',
    '6150000000051',
    'Vaseline',
    'Skin Care',
    3500,
    4200,
    15,
  ],
  [
    'Dove Beauty Cream Bar 100g',
    '6150000000068',
    'Dove',
    'Skin Care',
    950,
    1200,
    0,
  ], // out of stock
  // Toiletries
  ['Dove Shampoo 400ml', '6150000000075', 'Dove', 'Toiletries', 4200, 5000, 12],
  [
    'Dove Body Wash 500ml',
    '6150000000082',
    'Dove',
    'Toiletries',
    4500,
    5400,
    8,
  ],
  [
    'Dettol Antiseptic Soap 175g',
    '6150000000099',
    'Dettol',
    'Toiletries',
    650,
    850,
    60,
  ],
  [
    'Dettol Hand Wash 200ml',
    '6150000000105',
    'Dettol',
    'Toiletries',
    1400,
    1750,
    25,
  ],
  [
    'Dettol Antiseptic Liquid 500ml',
    '6150000000112',
    'Dettol',
    'Household',
    3600,
    4300,
    3,
  ], // low stock
  // Oral care
  [
    'Close Up Toothpaste 140g',
    '6150000000129',
    'Close Up',
    'Oral Care',
    900,
    1150,
    50,
  ],
  [
    'Close Up Toothpaste 70g',
    '6150000000136',
    'Close Up',
    'Oral Care',
    500,
    650,
    45,
  ],
  [
    'Close Up Toothbrush Medium',
    '6150000000143',
    'Close Up',
    'Oral Care',
    350,
    500,
    0,
  ], // out of stock
  // Beverages
  [
    'Peak Evaporated Milk 160g',
    '6150000000150',
    'Peak',
    'Beverages',
    650,
    800,
    96,
  ],
  [
    'Peak Full Cream Milk Powder 400g',
    '6150000000167',
    'Peak',
    'Beverages',
    4100,
    4800,
    20,
  ],
  [
    'Peak Milk Sachet 14g (Pack of 10)',
    '6150000000174',
    'Peak',
    'Beverages',
    1600,
    1950,
    35,
  ],
  [
    'Peak 456 Milk Powder Refill 800g',
    '6150000000181',
    'Peak',
    'Beverages',
    8200,
    9500,
    1,
  ], // low stock
  // Food & groceries
  [
    'Indomie Chicken Noodles 70g',
    '6150000000198',
    'Indomie',
    'Food & Groceries',
    280,
    350,
    200,
  ],
  [
    'Indomie Onion Chicken 120g (Hungry Man)',
    '6150000000204',
    'Indomie',
    'Food & Groceries',
    450,
    550,
    120,
  ],
  [
    'Indomie Carton (40 x 70g)',
    '6150000000211',
    'Indomie',
    'Food & Groceries',
    10500,
    12000,
    10,
  ],
  [
    'Golden Penny Spaghetti 500g',
    '6150000000228',
    'Golden Penny',
    'Food & Groceries',
    950,
    1150,
    70,
  ],
  [
    'Golden Penny Semovita 1kg',
    '6150000000235',
    'Golden Penny',
    'Food & Groceries',
    1700,
    2000,
    30,
  ],
  [
    'Golden Penny Sugar 500g',
    '6150000000242',
    'Golden Penny',
    'Food & Groceries',
    900,
    1100,
    0,
  ], // out of stock
  [
    'Golden Penny Table Margarine 250g',
    '6150000000259',
    'Golden Penny',
    'Food & Groceries',
    1100,
    1350,
    18,
  ],
  // Household / unbranded
  ['Hypo Bleach 500ml', '6150000000266', '', 'Household', 650, 800, 22],
  ['Viva Detergent 450g', '6150000000273', '', 'Household', 900, 1100, 40],
  ['Nylon Shopping Bag (Large)', '6150000000280', '', 'Household', 30, 50, 500],
  [
    'Tissue Paper Roll (Pack of 4)',
    '6150000000297',
    '',
    'Household',
    1200,
    1500,
    28,
  ],
  ['Gift Wrapping Paper', '6150000000303', '', 'Household', 150, 250, 60],
];

async function run() {
  const logger = new Logger('DemoSeed');
  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      const brandRepo = manager.getRepository(Brand);
      const categoryRepo = manager.getRepository(Category);
      const productRepo = manager.getRepository(Product);

      const brandIds = new Map<string, number>();
      for (const name of DEMO_BRANDS) {
        const brand =
          (await brandRepo.findOneBy({ name: ILike(name) })) ??
          (await brandRepo.save(
            brandRepo.create({ name, brandNo: sixDigitCode(), synced: false }),
          ));
        brandIds.set(name, brand.id);
      }

      const categoryIds = new Map<string, number>();
      for (const name of DEMO_CATEGORIES) {
        const category =
          (await categoryRepo.findOneBy({ name: ILike(name) })) ??
          (await categoryRepo.save(
            categoryRepo.create({
              name,
              categoryNo: sixDigitCode(),
              synced: false,
            }),
          ));
        categoryIds.set(name, category.id);
      }

      let created = 0;
      let updated = 0;
      for (const [
        name,
        barcode,
        brand,
        category,
        costPrice,
        sellingPrice,
        quantity,
      ] of DEMO_PRODUCTS) {
        const existing = await productRepo.findOneBy({ barcode });
        const values = {
          name,
          barcode,
          costPrice,
          sellingPrice,
          quantity,
          description: null,
          brandId: brand ? (brandIds.get(brand) ?? null) : null,
          categoryId: categoryIds.get(category) ?? null,
          synced: false,
        };
        if (existing) {
          await productRepo.save(Object.assign(existing, values));
          updated++;
        } else {
          await productRepo.save(productRepo.create(values));
          created++;
        }
      }

      logger.log(
        `Demo data ready: ${DEMO_BRANDS.length} brands, ${DEMO_CATEGORIES.length} categories, ` +
          `${created} products created, ${updated} updated.`,
      );
    });
  } finally {
    await dataSource.destroy();
  }
}

// Only run when executed directly (the data arrays are also reused to build the Excel sample).
if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
