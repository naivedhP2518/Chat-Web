import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {}

  login(): void {
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.authService.saveToken(res.token, res.user);
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        console.error('Login error details:', err);
        this.error = err.error?.message || 'Login failed. Please try again.';
        this.loading = false;
      },
    });
  }
}
