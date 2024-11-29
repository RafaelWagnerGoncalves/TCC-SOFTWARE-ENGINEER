import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {

  constructor(
    @Inject('PG_POOL') private readonly pool: Pool,
    ) {
  }

  async userExists(username: string, email: string): Promise<boolean> {
    const query = `
      SELECT 1
      FROM users
      WHERE username = $1 OR email = $2
      LIMIT 1;
    `;
    const result = await this.pool.query(query, [username, email]);
    return result.rows.length > 0;
  }

  async createUser(username: string, email: string, password: string) {
    const salt = await bcrypt.genSalt(10);
    console.log('Password before:', password);
    const hashedPassword = (await bcrypt.hash(password, salt)).trim();
    console.log('Password after:', hashedPassword);

    const query = `
    INSERT INTO users (username, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, username, email;
  `;
    const values = [username, email, hashedPassword];
  
    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      // Checa o Erro do Postgres *necessário pois chegou a bugar uma vez.
      if (error.code === '23505') {
        console.error('User already exists with this username or email:', error);
        throw new Error('User with this username or email already exists.');
      }
      console.error('Error inserting user:', error);
      throw new Error('Failed to create user.');
    }
  }

  async findUserByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    return result.rows[0];
  }

  async setMangaProgress(userId: string, mangaId: string, chapter: string): Promise<void> {
    try {
      const userQuery = `
        SELECT mangas, manga_progress
        FROM users
        WHERE id = $1
      `;
      const result = await this.pool.query(userQuery, [userId]);
      const currentMangas = result.rows[0]?.mangas || [];
      const currentProgress = result.rows[0]?.manga_progress || [];
  
      console.log('Current mangas:', currentMangas);
      console.log('Current manga_progress:', currentProgress);
  
      const mangaQuery = `
        SELECT name
        FROM mangas
        WHERE id = $1
      `;
      const mangaResult = await this.pool.query(mangaQuery, [mangaId]);
      const mangaName = mangaResult.rows[0]?.name;
  
      if (!mangaName) {
        throw new Error(`Manga with ID ${mangaId} not found`);
      }
  
      console.log('Manga name:', mangaName);
  
      const updatedMangas = [...new Set([...currentMangas, mangaName])];
  
      console.log('Updated mangas:', updatedMangas);
  
      let found = false;
      const updatedProgress = currentProgress.map((item: any) => {
        if (item.manga_id === mangaId) {
          found = true;
          console.log(`Updating progress for manga_id ${mangaId}`);
          return { ...item, chapter };
        }
        return item;
      });
  
      if (!found) {
        console.log(`Adding new progress for manga_id ${mangaId}`);
        updatedProgress.push({ manga_id: mangaId, chapter });
      }
  
      console.log('Updated manga_progress:', updatedProgress);
  
      const updateQuery = `
        UPDATE users
        SET mangas = $1::text[],
            manga_progress = $2::jsonb
        WHERE id = $3
      `;
      await this.pool.query(updateQuery, [updatedMangas, JSON.stringify(updatedProgress), userId]);
  
      console.log('Database updated successfully');
    } catch (error) {
      console.error('Error updating manga progress:', error);
      throw new Error('Failed to update manga progress');
    }
  }

  
  async getUserMangas(userId: string): Promise<any[]> {
    const query = `
      SELECT 
          m.id,
          m.name,
          m.description,
          m.image AS cover_image,
          COALESCE(progress ->> 'chapter', null) AS current_chapter
      FROM 
          mangas m
      LEFT JOIN 
          (SELECT 
               jsonb_array_elements(manga_progress) AS progress
           FROM users
           WHERE id = $1) u
      ON 
          m.id = (progress ->> 'manga_id')::uuid
      WHERE 
          m.name = ANY(
            SELECT UNNEST(mangas) 
            FROM users 
            WHERE id = $1
          );
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async removeManga(userId: string, mangaName: string): Promise<void> {
    try {

      const mangaIdQuery = `SELECT id FROM mangas WHERE name = $1`;
      const mangaResult = await this.pool.query(mangaIdQuery, [mangaName]);
      const mangaId = mangaResult.rows[0]?.id;
  
      if (!mangaId) {
        throw new Error(`Manga "${mangaName}" not found in the database`);
      }
  
      const updateQuery = `
        WITH updated_progress AS (
          SELECT jsonb_agg(progress_element) AS new_progress
          FROM (
            SELECT progress_element
            FROM jsonb_array_elements((SELECT manga_progress FROM users WHERE id = $1)) AS progress_element
            WHERE (progress_element->>'manga_id')::uuid != $2
          ) filtered_elements
        )
        UPDATE users
        SET 
          mangas = array_remove(mangas, $3), -- Remove the manga name from the array
          manga_progress = COALESCE((SELECT new_progress FROM updated_progress), '[]'::jsonb) -- Update manga_progress
        WHERE id = $1;
      `;
  
      const result = await this.pool.query(updateQuery, [userId, mangaId, mangaName]);
  
      if (result.rowCount === 0) {
        throw new Error(`User with ID ${userId} not found or manga "${mangaName}" not in the list`);
      }
  
      console.log(`Manga "${mangaName}" and its progress removed for user ${userId}`);
    } catch (error) {
      console.error('Error removing manga and progress:', error.message);
      throw new Error('Failed to remove manga and progress');
    }
  }

  async addMangaToUser(userId: string, mangaId: string, mangaName: string): Promise<void> {
    try {
      const userQuery = `
        SELECT mangas
        FROM users
        WHERE id = $1
      `;
      const result = await this.pool.query(userQuery, [userId]);
      const currentMangas = result.rows[0]?.mangas || [];
  
      if (currentMangas.includes(mangaName)) {
        throw new Error(`Manga "${mangaName}" is already in the user's list`);
      }
  
      const updatedMangas = [...currentMangas, mangaName];
  
      const updateQuery = `
        UPDATE users
        SET mangas = $1::text[]
        WHERE id = $2
      `;
      await this.pool.query(updateQuery, [updatedMangas, userId]);
  
      console.log(`Manga "${mangaName}" added to user ${userId}`);
    } catch (error) {
      console.error('Error adding manga to user:', error.message);
      throw new Error('Failed to add manga to user list');
    }
  }
}