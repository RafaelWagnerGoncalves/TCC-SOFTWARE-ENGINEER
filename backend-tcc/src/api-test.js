const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Manga',
  password: '123456',
  port: 5432
});

// Arquivo para popular o Banco de Dados, o ideal é rodar isso com script todo dia

API_URL = ''

const mangaArray = [
  'Murim RPG Simulation',
  'Overgeared',
  'Dragon Ball Super',
  'Dungeon Odyssey',
  'Absolute Sword Sense',
  'Return of the Blossoming Blade',
  'Absolute Regression',
  'Solo Leveling: Ragnarok',
  'Pick Me Up',
  'Boundless Necromancer',
  'Doctor, Live Again',
  'Descended from Divinity',
  'The Stellar Swordmaster',
  'The Infinite Mage',
  'Return of the War God',
  'Surviving as a Genius on Borrowed Time',
  "The Esper's Game",
  'Returned by the King',
  'The Reborn Young Lord is an Assassin',
  'The Tutorial Is Too Tough!',
  'After Ten Millennia in Hell',
  'Revenge of the Baskerville Bloodhound',
  "The Player Who Can't Level Up",
  'Reincarnated Escort Warrior',
  'My Very Own Tower Strategy Guide',
  'Murim Login',
  "The Swordmaster's Son",
  "The Academy's Genius Swordsman",
  "Heavenly Grand Archive's Young Master",
  'Your Talent is Mine',
  'The Devil Never Cries',
  '66,666 Years: Advent of the Dark Mage',
  'The Nine Heavens Swordmaster',
  'Demon Devourer',
  'Monarch of Death',
  'The Knight Only Lives Today',
  'The Grand Mudang Saga',
  'Chronicles of the demon Faction',
  'The World After The Fall',
  'Time-Limited Genius Dark Knight',
  'Disciple of the Holy Sword',
  'A Dance of Swords in the Night',
  'Villain to Kill',
  'Reaper of the Drifting Moon',
  'Duke Pendragon: Master of the White Dragon'
];

const failedMangas = [];


async function getSpecificManga(title) {

  const baseUrl = 'https://api.mangadex.org';

  const resp = await axios({
      method: 'GET',
      url: `${baseUrl}/manga`,
      params: {
        title: title,
        includes: ["authors", "artist", "cover_art"],
      }
  });
  console.log(resp.data.data.map(manga => manga.id));
  console.log('response', resp);
  
  let mangaData = resp.data.data.find(manga => manga.attributes.title['en'].toLowerCase() === title.toLowerCase());
  if (!mangaData) {
    failedMangas.push(title);
    throw new Error(`No data found for title: ${title}`);
  }

  const id = mangaData.id;
  const name = mangaData.attributes.title.en;
  const description = mangaData.attributes.description.en || '';
  const coverArt = mangaData.relationships.find(type => type.type === 'cover_art');
  const coverArtId = coverArt.attributes.fileName;
  const coverArtFullUrl = `https://uploads.mangadex.org/covers/${id}/${coverArtId}`;
  const tags = JSON.stringify(mangaData.attributes.tags);

  return {
    id: id,
    name: name,
    description: description,
    image: coverArtFullUrl,
    tags: tags
  }
  console.log(mangaData);

}

async function insertManga() {
  for (const title of mangaArray) {
    try {
      const mangaResult = await getSpecificManga(title);
      
      const checkMangaQuery = `
        SELECT id FROM mangas WHERE id = $1;
      `;
      const checkMangaResult = await pool.query(checkMangaQuery, [mangaResult.id]);

      let mangaId;

      if (checkMangaResult.rows.length > 0) {
        mangaId = checkMangaResult.rows[0].id;
        console.log(`Mangá "${title}" já existe com ID: ${mangaId}`);
      } else {
        const mangaInsertQuery = `
          INSERT INTO mangas (id, name, image, description, tags)
          VALUES ($1, $2, $3, $4, $5) RETURNING id;
        `;
        const mangaValues = [mangaResult.id, mangaResult.name, mangaResult.image, mangaResult.description, mangaResult.tags];
        const mangaResultInsert = await pool.query(mangaInsertQuery, mangaValues);
        mangaId = mangaResultInsert.rows[0].id;
        console.log(`Mangá "${title}" inserido com ID: ${mangaId}`);
      }
      
      const episodes = await getEpisodesForManga(mangaId);
      
      for (const episode of episodes) {
        const episodeInsertQuery = `
          INSERT INTO episodes (id, manga_id, volume, chapter, title, language, external_url, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING;
        `;
        const episodeValues = [
          episode.id, 
          mangaId, 
          episode.volume, 
          episode.chapter, 
          episode.title, 
          episode.language, 
          episode.external_url, 
          episode.created_at
        ];

        try {
          await pool.query(episodeInsertQuery, episodeValues);
          console.log(`Episódio ${episode.chapter} inserido para o mangá "${title}".`);
        } catch (error) {
          console.error(`Erro ao inserir o episódio ${episode.chapter} do mangá "${title}":`, error);
        }
      }

    } catch (error) {
      console.error(`Erro ao inserir o mangá "${title}":`, error);
    }
  }

  if (failedMangas.length > 0) {
    console.log('Mangás que falharam ao inserir:', failedMangas);
  }
}


insertManga()
  .then(() => {
    console.log('Mangá inserido!');
  })
  .catch((error) => {
    console.error('Erro ao inserir mangá:', error);
  });

  async function getEpisodesForManga(mangaId) {
    const baseUrl = 'https://api.mangadex.org/manga/';
    const episodes = [];
  
    try {
      const resp = await axios({
        method: 'GET',
        url: `${baseUrl}/${mangaId}/feed`,
        params: {
          limit: 500,
          'translatedLanguage[]': 'en',
        }
      });
  
      const chapterData = resp.data.data;
  
      for (const chapter of chapterData) {
        const episode = {
          id: chapter.id,
          manga_id: mangaId,
          volume: chapter.attributes.volume,
          chapter: chapter.attributes.chapter,
          title: chapter.attributes.title || null,
          language: chapter.attributes.translatedLanguage,
          external_url: chapter.attributes.externalUrl || null,
          created_at: chapter.attributes.createdAt
        };
        episodes.push(episode);
      }
    } catch (error) {
      console.error(`Error fetching episodes for manga ${mangaId}:`, error);
    }
  
    return episodes;
  }

  async function insertEpisodes(episodes) {
    const query = `
      INSERT INTO episodes (id, manga_id, volume, chapter, title, language, external_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING;
    `;
  
    for (const episode of episodes) {
      const values = [
        episode.id,
        episode.manga_id,
        episode.volume,
        episode.chapter,
        episode.title,
        episode.language,
        episode.external_url,
        episode.created_at
      ];
  
      try {
        await pool.query(query, values);
        console.log(`Episode inserted: ${episode.id}`);
      } catch (error) {
        console.error(`Error inserting episode ${episode.id}:`, error);
      }
    }
  }