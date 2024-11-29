import { ProductsService } from './products.service';
import { Body, Controller, Get, Param, Patch, Post, Delete } from "@nestjs/common";

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}


  @Post()

  addProduct(
   @Body('title') prodTitle: string,
   @Body('description') prodDesc: string,
   @Body('price') prodPrice: number,
  ): any {
      const generatedId = this.productsService.insertProduct(prodTitle, prodDesc, prodPrice);
      return {id: generatedId}
  }

  @Get()
  getAllProducts() {
    return this.productsService.getProducts();
  }

  @Get(':id')
  getProduct(@Param('id') prodId: string) {
    return this.productsService.getSingleProduct(prodId);
  }

  @Patch(':id')
  updateProduct(
   @Param('id') prodId: string,
   @Body('title') prodTitle: string,
   @Body('description') prodDesc: string,
   @Body('price') prodPrice: number,
  ) {
    this.productsService.updateProduct(prodId, prodTitle, prodDesc, prodPrice);
    return null;
  }

  @Delete(':id')
  removeProduct(@Param('id') prodId: string) {
    this.productsService.deleteProduct(prodId);
    return null;
  }
}