import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  mangas: any[] = [];
  chapters: string[] = [];
  selectedManga: string | null = null;
  selectedMangaName: string | null = null;
  filteredMangas: any[] = [];
  searchText: string = '';
  searchSubject = new Subject<string>();


  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchUserMangas();

    this.searchSubject.pipe(debounceTime(300)).subscribe((searchText) => {
      this.filterMangas(searchText);
    });
  }

  fetchUserMangas() {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      alert('User not logged in. Please log in to view your mangas.');
      console.error('User ID not found in localStorage');
      return;
    }

    this.http.get<any[]>(`http://localhost:3000/users/${userId}/mangas`).subscribe(
      (data: any[]) => {
        this.mangas = data;
        this.filteredMangas = [...data];
        console.log('Fetched user mangas:', this.mangas);
      },
      (error) => {
        console.error('Error fetching user mangas:', error);
      }
    );
  }

  filterMangas(searchText: string) {
    if (!searchText.trim()) {
      this.filteredMangas = [...this.mangas];
    } else {
      this.filteredMangas = this.mangas.filter((manga) =>
        manga.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
  }

  onSearchChange(searchText: string) {
    this.searchSubject.next(searchText);
  }

  selectManga(mangaId: string) {
    this.selectedManga = mangaId;
    const manga = this.mangas.find((m) => m.id === mangaId);
    this.selectedMangaName = manga ? manga.name : null;
    console.log('Selected Manga:', this.selectedManga);
    console.log('Selected Manga Name:', this.selectedMangaName);

    this.fetchChapters(mangaId);
  }

  fetchChapters(mangaId: string) {
    this.http.get(`http://localhost:3000/mangas/${mangaId}/chapters`).subscribe(
      (data: any) => {
        this.chapters = data.map((c: any) => parseFloat(c.chapter)).sort((a: any, b: any) => b - a);
        console.log('Fetched chapters:', this.chapters);
      },
      (error) => {
        console.error('Error fetching chapters:', error);
      }
    );
  }

  updateProgress(event: Event) {
    const target = event.target as HTMLSelectElement;
    const chapter = target?.value;

    if (!chapter) {
      console.error('No chapter selected');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('User ID not found. Please log in again.');
      console.error('User ID not found in localStorage');
      return;
    }

    this.http.post(`http://localhost:3000/users/${userId}/progress`, {
      mangaId: this.selectedManga,
      chapter,
    }).subscribe(
      () => {
        const manga = this.mangas.find((m) => m.id === this.selectedManga);
        if (manga) {
          manga.current_chapter = chapter;
        }
        console.log(`Progress updated to Chapter ${chapter} for ${this.selectedMangaName}`);
      },
      (error) => {
        console.error('Error updating progress:', error);
      }
    );
  }

  removeManga(mangaName: string) {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      console.error('User ID not found in localStorage');
      return;
    }

    this.http
      .delete(`http://localhost:3000/users/${userId}/manga`, {
        body: { mangaName },
      })
      .subscribe(
        () => {
          this.mangas = this.mangas.filter((m) => m.name !== mangaName);
          this.filteredMangas = this.filteredMangas.filter((m) => m.name !== mangaName);
          console.log(`Manga "${mangaName}" removed from the list`);
        },
        (error) => {
          console.error('Error removing manga:', error);
        }
      );
  }
}
