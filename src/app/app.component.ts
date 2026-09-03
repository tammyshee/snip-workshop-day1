import { Component, OnInit, inject, signal } from '@angular/core';
import { Link, SnipService } from './snip.service';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly snipService = inject(SnipService);
  readonly url = signal('');
  readonly links = signal<Link[]>([]);
  readonly createdLink = signal<Link | null>(null);
  readonly error = signal('');
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loadLinks();
  }

  shorten(): void {
    const value = this.url().trim();
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      this.error.set('Please enter a valid URL.');
      return;
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      this.error.set('Please enter an HTTP or HTTPS URL.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.createdLink.set(null);
    this.snipService.createLink(value).subscribe({
      next: (link) => {
        this.createdLink.set(link);
        this.url.set('');
        this.links.update((links) => [link, ...links]);
        this.loading.set(false);
      },
      error: (error: { error?: { error?: string } }) => {
        this.error.set(error.error?.error ?? 'Unable to create the link.');
        this.loading.set(false);
      },
    });
  }

  private loadLinks(): void {
    this.snipService.getLinks().subscribe({
      next: (links) => this.links.set(links),
      error: () => this.error.set('Unable to load links. Is the backend running?'),
    });
  }
}
