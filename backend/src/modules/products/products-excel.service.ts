import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import { BrandsService } from '../brands/brands.service';
import { CategoriesService } from '../categories/categories.service';
import { Product } from './product.entity';

type Field =
  | 'name'
  | 'barcode'
  | 'category'
  | 'brand'
  | 'costPrice'
  | 'sellingPrice'
  | 'quantity'
  | 'description';

/** Header aliases (lower-cased, spaces/underscores removed) → product field. */
const HEADER_ALIASES: Record<string, Field> = {
  name: 'name',
  productname: 'name',
  product: 'name',
  barcode: 'barcode',
  code: 'barcode',
  category: 'category',
  categories: 'category',
  brand: 'brand',
  costprice: 'costPrice',
  cost: 'costPrice',
  sellingprice: 'sellingPrice',
  price: 'sellingPrice',
  quantity: 'quantity',
  qty: 'quantity',
  stock: 'quantity',
  description: 'description',
};

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

/**
 * Excel import/export of products (Laravel: maatwebsite/excel ProductImport / ProductExport).
 * Import upserts by barcode, so re-importing a sheet updates prices/stock instead of duplicating rows.
 * Accepts the old Laravel sheet layout (sync, name, categories, cost_price, selling_price, quantity, barcode).
 */
@Injectable()
export class ProductsExcelService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly brandsService: BrandsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async export(): Promise<Buffer> {
    const products = await this.productRepository.find({
      relations: { brand: true, category: true },
      order: { name: 'ASC' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Products');
    sheet.columns = [
      { header: 'Product Name', key: 'name', width: 40 },
      { header: 'Barcode', key: 'barcode', width: 20 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Brand', key: 'brand', width: 20 },
      { header: 'Cost Price', key: 'costPrice', width: 14 },
      { header: 'Selling Price', key: 'sellingPrice', width: 14 },
      { header: 'Stock', key: 'quantity', width: 10 },
    ];
    sheet.getRow(1).font = { bold: true };
    products.forEach((p) =>
      sheet.addRow({
        name: p.name,
        barcode: p.barcode,
        category: p.category?.name ?? '',
        brand: p.brand?.name ?? '',
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        quantity: p.quantity,
      }),
    );
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async import(file: Buffer): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(file as unknown as ArrayBuffer);
    } catch {
      throw new BadRequestException('The file is not a valid .xlsx workbook');
    }
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2)
      throw new BadRequestException('The sheet has no data rows');

    const columns = this.mapHeader(sheet.getRow(1));
    if (columns.name === undefined || columns.barcode === undefined) {
      throw new BadRequestException(
        'The first row must contain at least "Name" and "Barcode" columns',
      );
    }

    const result: ImportResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };
    const brandCache = new Map<string, number>();
    const categoryCache = new Map<string, number>();

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const read = (field: Field) =>
        columns[field] === undefined
          ? ''
          : this.cellText(row.getCell(columns[field]));

      const name = read('name');
      const barcode = read('barcode');
      if (!name && !barcode) {
        result.skipped++;
        continue;
      }
      if (!name || !barcode) {
        result.errors.push({
          row: rowNumber,
          message: 'Name and barcode are required',
        });
        continue;
      }

      try {
        const categoryName = read('category');
        const brandName = read('brand');
        const values: Partial<Product> = {
          name,
          barcode,
          costPrice: this.toNumber(read('costPrice')),
          sellingPrice: this.toNumber(read('sellingPrice')),
          quantity: Math.max(0, Math.trunc(this.toNumber(read('quantity')))),
          description: read('description') || null,
          categoryId: categoryName
            ? await this.resolveId(categoryName, categoryCache, 'category')
            : null,
          brandId: brandName
            ? await this.resolveId(brandName, brandCache, 'brand')
            : null,
          synced: false,
        };

        const existing = await this.productRepository.findOneBy({ barcode });
        if (existing) {
          await this.productRepository.save(Object.assign(existing, values));
          result.updated++;
        } else {
          await this.productRepository.save(
            this.productRepository.create(values),
          );
          result.created++;
        }
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          message: (error as Error).message,
        });
      }
    }
    return result;
  }

  private mapHeader(row: ExcelJS.Row): Partial<Record<Field, number>> {
    const columns: Partial<Record<Field, number>> = {};
    row.eachCell((cell, col) => {
      const key = this.cellText(cell)
        .toLowerCase()
        .replace(/[\s_]+/g, '');
      const field = HEADER_ALIASES[key];
      if (field && columns[field] === undefined) columns[field] = col;
    });
    return columns;
  }

  private cellText(cell: ExcelJS.Cell): string {
    const value: ExcelJS.CellValue = cell.value;
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === 'object') {
      if ('richText' in value)
        return value.richText
          .map((r) => r.text)
          .join('')
          .trim();
      if ('text' in value) return String(value.text).trim();
      if ('result' in value && value.result !== undefined) {
        const result = value.result;
        if (result instanceof Date) return result.toISOString().slice(0, 10);
        return typeof result === 'string' ||
          typeof result === 'number' ||
          typeof result === 'boolean'
          ? String(result).trim()
          : '';
      }
      return '';
    }
    return String(value).trim();
  }

  private toNumber(value: string): number {
    const n = parseFloat(value.replace(/[₦,\s]/g, ''));
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }

  private async resolveId(
    name: string,
    cache: Map<string, number>,
    kind: 'brand' | 'category',
  ): Promise<number> {
    const key = name.toLowerCase();
    const cached = cache.get(key);
    if (cached) return cached;
    const entity =
      kind === 'brand'
        ? await this.brandsService.findOrCreateByName(name)
        : await this.categoriesService.findOrCreateByName(name);
    cache.set(key, entity.id);
    return entity.id;
  }
}
