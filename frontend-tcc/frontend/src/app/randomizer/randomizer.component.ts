import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Manga } from '../interfaces/mangas.interface';

@Component({
  selector: 'app-randomizer',
  templateUrl: './randomizer.component.html',
  styleUrls: ['./randomizer.component.css']
})
export class RandomizerComponent implements OnInit {

  randomManga: Manga | null = null;
  apiUrl = 'http://localhost:3000/mangas';
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getRandomManga();
  }

  getRandomManga(): void {
    this.http.get<Manga[]>(this.apiUrl).subscribe((mangas) => {
      if (mangas.length > 0) {
        const randomIndex = Math.floor(Math.random() * mangas.length);
        this.randomManga = mangas[randomIndex];
        console.log('Random Manga:', this.randomManga);
      }
    });
  }

}
