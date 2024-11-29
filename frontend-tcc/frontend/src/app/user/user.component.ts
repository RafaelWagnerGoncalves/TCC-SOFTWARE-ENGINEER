import { Component } from '@angular/core';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent {
  username: string = '';
  email: string = '';
  password: string = '';

  constructor(private userService: UserService) {}

  onSubmit() {
    const userData = { username: this.username, email: this.email, password: this.password };

    this.userService.createUser(userData).subscribe({
      next: (response) => {
        console.log('User created successfully:', response);
      },
      error: (error) => {
        console.error('Error creating user:', error);
      },
    });
  }
}
