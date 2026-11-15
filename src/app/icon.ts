import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'glyph', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 16 16">
      @switch (name()) {
        @case ('plus') { <path d="M8 3v10M3 8h10" /> }
        @case ('pencil') { <path d="M9.5 3.5 12.5 6.5 6 13H3v-3z" /> }
        @case ('play') { <path d="M5 3.5v9l8-4.5z" /> }
        @case ('trash') { <path d="M3.5 4.5h9M6 4.5V3h4v1.5M5 4.5l.5 8h5l.5-8" /> }
        @case ('check') { <path d="M3.5 8.5 6.5 11.5 12.5 4.5" /> }
        @case ('back') { <path d="M10 3.5 5 8l5 4.5M5 8h8" /> }
        @case ('forward') { <path d="M6 3.5 11 8l-5 4.5M3 8h8" /> }
        @case ('up') { <path d="M8 12V4M8 4 4.5 7.5M8 4l3.5 3.5" /> }
        @case ('down') { <path d="M8 4v8M8 12 4.5 8.5M8 12l3.5-3.5" /> }
        @case ('minus') { <path d="M3.5 8h9" /> }
        @case ('close') { <path d="M4 4l8 8M12 4 4 12" /> }
        @case ('search') { <circle cx="7" cy="7" r="3.2" /><path d="M9.4 9.4 12.5 12.5" /> }
        @case ('code') { <path d="M6 4.5 2.5 8 6 11.5M10 4.5 13.5 8 10 11.5" /> }
        @case ('filter') { <path d="M2.5 3.5h11l-4 5v4l-3-1.5v-2.5z" /> }
        @case ('sliders') { <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11M6 3.2v2.6M10.5 6.7v2.6M7.5 10.2v2.6" /> }
        @case ('logout') { <path d="M6 3.5H3.5v9H6M7 8h6M10.5 5.5 13 8l-2.5 2.5" /> }
        @case ('list') { <path d="M3 4.5h10M3 8h10M3 11.5h10" /> }
        @case ('home') { <path d="M2.5 7.2 8 2.8l5.5 4.4V13a.8.8 0 0 1-.8.8H3.3a.8.8 0 0 1-.8-.8z" /><path d="M6.4 13.8V9.2h3.2v4.6" /> }
        @case ('eye') { <path d="M1.5 8S4 4.5 8 4.5 14.5 8 14.5 8 12 11.5 8 11.5 1.5 8 1.5 8z" /><circle cx="8" cy="8" r="1.6" /> }
        @case ('info') { <circle cx="8" cy="8" r="5.2" /><path d="M8 7.3v3.8M8 5.2h.01" /> }
        @case ('image') { <path d="M2.5 3.5h11v9h-11zM2.5 10l3-2.5 2 1.5 2.5-3 3 4" /> }
        @case ('upload') { <path d="M8 10.5V3.5M5.5 6 8 3.5 10.5 6M3.5 12.5h9" /> }
        @case ('link') { <path d="M6.5 9.5 9.5 6.5M6 7.5 4.8 8.7a2.2 2.2 0 0 0 3.1 3.1L9 10.7M10 8.5l1.2-1.2a2.2 2.2 0 0 0-3.1-3.1L7 5.3" /> }
        @case ('bold') { <path d="M5 3.5h3.4a2.2 2.2 0 0 1 0 4.4H5zM5 7.9h4a2.3 2.3 0 0 1 0 4.6H5z" /> }
        @case ('italic') { <path d="M9.5 3.5h-4M10.5 12.5h-4M9.2 3.5 6.8 12.5" /> }
        @case ('align-left') { <path d="M3 4h10M3 8h7M3 12h10" /> }
        @case ('align-center') { <path d="M3 4h10M4.5 8h7M3 12h10" /> }
        @case ('align-right') { <path d="M3 4h10M6 8h7M3 12h10" /> }
        @case ('list-ul') { <path d="M3 4.5h.1M3 8h.1M3 11.5h.1M6 4.5h7M6 8h7M6 11.5h7" /> }
        @case ('list-ol') { <path d="M3 4.2h1.2V6M3 8.2h2M5 8.2c0 .8-2 .8-2 1.6h2M6 4.5h7M6 8h7M6 11.5h7" /> }
        @case ('clear') { <path d="M4 8h8M6 5.5 4 8l2 2.5M10 5.5 12 8l-2 2.5" /> }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<string>();
}
