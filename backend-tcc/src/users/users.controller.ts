import { Body, Controller, Delete, Get, Param, Patch, Post, BadRequestException, Res, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {

  }

  @Post()
  async createUser(
  @Body() createUserDto: { username: string; email: string; password: string },
    ) {
  const exists = await this.usersService.userExists(createUserDto.username, createUserDto.email);
  if (exists) {
    throw new BadRequestException('User with this username or email already exists.');
  }

  const user = await this.usersService.createUser(createUserDto.username, createUserDto.email, createUserDto.password);

  return {
    message: 'User created successfully',
    user: { username: user.username, email: user.email },
  };
}

  @Post(':userId/progress')
  async setMangaProgress(
  @Param('userId') userId: string,
  @Body() body: { mangaId: string; chapter: string }
  ) {
  const { mangaId, chapter } = body;

    if (!mangaId || !chapter) {
      throw new BadRequestException('Manga ID and Chapter are required');
    }

    if (isNaN(parseFloat(chapter))) {
      throw new BadRequestException('Chapter must be a valid number');
  }

    await this.usersService.setMangaProgress(userId, mangaId, chapter);
    return { message: 'Progress updated successfully' };
  }

  @Get(':userId/mangas')
  async getUserMangas(@Param('userId') userId: string) {
    return this.usersService.getUserMangas(userId);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return { message: 'User retrieved successfully', userId: id };
  }

  @Delete(':userId/manga')
async removeManga(
  @Param('userId') userId: string,
  @Body() body: { mangaName: string }
) {
  const { mangaName } = body;

  if (!mangaName) {
    throw new BadRequestException('Manga name is required');
  }

  try {
    await this.usersService.removeManga(userId, mangaName);
    return { message: `Manga "${mangaName}" and its progress removed successfully` };
  } catch (error) {
    throw new BadRequestException(error.message || 'Failed to remove manga and its progress');
  }
}

@Post(':userId/add-manga')
async addMangaToUser(
  @Param('userId') userId: string,
  @Body() body: { mangaId: string; mangaName: string },
) {
  const { mangaId, mangaName } = body;

  if (!mangaId || !mangaName) {
    throw new BadRequestException('Manga ID and Manga Name are required');
  }

  try {
    await this.usersService.addMangaToUser(userId, mangaId, mangaName);
    return { message: `Manga "${mangaName}" added successfully to user ${userId}` };
  } catch (error) {
    if (error.message.includes('already in the user\'s list')) {
      console.error('Duplicate manga addition attempt:', error.message);
      throw new BadRequestException({
        message: error.message,
        error: 'MangaAlreadyExists',
      });
    }
    console.error('Unexpected error adding manga:', error.message);
    throw new BadRequestException({
      message: 'Failed to add manga to user list. Please try again later.',
      error: 'UnexpectedError',
    });
  }
}
}
