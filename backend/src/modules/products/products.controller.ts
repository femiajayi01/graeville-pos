import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { MANAGER_ROLES } from '../../common/enums/role.enum';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsExcelService } from './products-excel.service';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly excelService: ProductsExcelService,
  ) {}

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('search')
  @ApiQuery({ name: 'q', required: true })
  search(@Query('q') q = '') {
    return this.productsService.search(q);
  }

  @Get('lookup')
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'Barcode or exact product name',
  })
  lookup(@Query('code') code = '') {
    if (!code.trim()) throw new BadRequestException('code is required');
    return this.productsService.lookup(code);
  }

  @Get('export')
  @Roles(...MANAGER_ROLES)
  async export(@Res() res: Response) {
    const buffer = await this.excelService.export();
    res
      .set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="productList.xlsx"',
      })
      .send(buffer);
  }

  @Post('import')
  @Roles(...MANAGER_ROLES)
  @HttpCode(200)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  import(@UploadedFile() file?: Express.Multer.File) {
    if (!file)
      throw new BadRequestException('Upload an .xlsx file in the "file" field');
    return this.excelService.import(file.buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...MANAGER_ROLES)
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
