import { Controller, Get, Param } from '@nestjs/common';
import { MangasService } from './mangas.service';

@Controller('mangas')
export class MangasController {
  constructor(private readonly mangasService: MangasService) {}

  @Get()
  async getAllMangas() {
    return this.mangasService.getMangas();
  }

  @Get(':id/chapters')
async getMangaChapters(@Param('id') mangaId: string) {
  return await this.mangasService.getChaptersByMangaId(mangaId);
}
}