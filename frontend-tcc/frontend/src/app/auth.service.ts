import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedInSubject = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
  isLoggedIn$ = this.loggedInSubject.asObservable();

  constructor() {}

  login(token: string): void {
    localStorage.setItem('token', token);
    this.loggedInSubject.next(true);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.loggedInSubject.next(false);
  }

  checkLoginStatus(): boolean {
    const tokenExists = !!localStorage.getItem('token');
    this.loggedInSubject.next(tokenExists);
    return tokenExists;
  }
}
