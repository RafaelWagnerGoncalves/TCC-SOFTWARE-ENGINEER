import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class MangasService {

  constructor(@Inject('PG_POOL') private readonly pool: Pool) {
  }

  async getMangas() {
    const query = `
      SELECT id, name, image, description, tags
      FROM mangas
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  async getChaptersByMangaId(mangaId: string) {
    const query = `
      SELECT chapter
      FROM episodes
      WHERE manga_id = $1
      ORDER BY chapter::float DESC;
    `;
    const result = await this.pool.query(query, [mangaId]);
    return result.rows;
  }
}