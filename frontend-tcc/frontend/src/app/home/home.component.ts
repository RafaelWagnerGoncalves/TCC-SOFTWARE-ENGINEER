import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Manga, Tag } from '../interfaces/mangas.interface';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, Subject } from 'rxjs';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  mangas: Manga[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 12;
  showingTags: boolean = false;
  currentManga: Manga | null = null;
  isUserLoggedIn: boolean = false;
  loading = false;
  filteredMangas: Manga[] = [];
  searchText: string = '';
  searchSubject = new Subject<string>();


  constructor(private http: HttpClient, private toastr: ToastrService, private cdr: ChangeDetectorRef, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadMangas();

    this.authService.isLoggedIn$.subscribe((loggedIn) => {
      this.isUserLoggedIn = loggedIn;
      this.cdr.detectChanges();
    });

    this.searchSubject.pipe(debounceTime(300)).subscribe((searchText) => {
      this.filterMangas(searchText);
    });
  }
  loadMangas(): void {
    this.http.get<Manga[]>('http://localhost:3000/mangas').subscribe((data) => {
      this.mangas = data;
      this.filteredMangas = [...data];
    });
  }

  filterMangas(searchText: string): void {
    if (!searchText.trim()) {
      this.filteredMangas = [...this.mangas];
    } else {
      this.filteredMangas = this.mangas.filter((manga) =>
        manga.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    this.currentPage = 1;
  }

  onSearchChange(searchText: string): void {
    this.searchSubject.next(searchText);
  }


  checkUserLoggedIn(): void {
    const userId = localStorage.getItem('userId');
    this.isUserLoggedIn = !!userId;
    this.cdr.detectChanges();
  }

  addMangaToList(mangaId: string, mangaName: string): void {
    const userId = localStorage.getItem('userId');
  if (!userId) {
    this.toastr.warning('Please log in to add mangas to your list.', 'Warning');
    this.cdr.detectChanges();
    return;
  }

  this.http.post(`http://localhost:3000/users/${userId}/add-manga`, { mangaId, mangaName })
    .subscribe({
      next: () => {
        this.toastr.success(`Manga "${mangaName}" has been added to your list.`, 'Success');
        this.cdr.detectChanges();
      },
      error: (error) => {
        if (error.status === 400) {
          this.toastr.error(error.error?.message || 'Manga already on List', 'Error');
        } else {
          this.toastr.error('An unexpected error occurred.', 'Error');
        }
        this.cdr.detectChanges();
      }
    });
}

  onPageChange(page: number): void {
    console.log(`Page change event triggered. New page: ${page}`);
    this.currentPage = page;
    console.log(`Current page updated to: ${this.currentPage}`);
    console.log(`Mangas array:`, this.mangas);
  }

  showTagsModal(manga: Manga): void {
    console.log('Hovering over:', manga.name);
    this.currentManga = manga;
    this.showingTags = true;
  }

  hideTagsModal(): void {
    console.log('Mouse left:', this.currentManga?.name);
    this.showingTags = false;
    this.currentManga = null;
  }
}
