import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'glyph', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 16 16">
      @switch (name()) {
        @case ('plus') { <path d="M8 3v10M3 8h10" /> }
        @case ('layers') { <path d="M8 2.2 13.2 5 8 7.8 2.8 5zM2.8 8 8 10.8 13.2 8M2.8 11 8 13.8 13.2 11" /> }
        @case ('pencil') { <path d="M9.5 3.5 12.5 6.5 6 13H3v-3z" /> }
        @case ('play') { <path d="M5 3.5v9l8-4.5z" /> }
        @case ('trash') { <path d="M3.5 4.5h9M6 4.5V3h4v1.5M5 4.5l.5 8h5l.5-8" /> }
        @case ('clone') { <path d="M6 2.6h7.4v7.4H6z" /><path d="M2.6 6h7.4v7.4H2.6z" /> }
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
        @case ('help') { <circle cx="8" cy="8" r="5.2" /><path d="M6.4 6.3a1.7 1.7 0 1 1 2.5 1.5c-.5.3-.9.7-.9 1.4M8 11.3h.01" /> }
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
        @case ('equals') { <path d="M2.5 5.5h11M2.5 10.5h11" /> }
        @case ('like') {
          <circle cx="5" cy="4.6" r="1.8" />
          <path d="M12.4 3 3.6 13" />
          <circle cx="11" cy="11.4" r="1.8" />
        }
        @case ('from') { <path d="M3.2 3.6 11 8 3.2 12.4M3.2 14.2h8.4" /> }
        @case ('to') { <path d="M12.8 3.6 5 8l7.8 4.4M4.4 14.2h8.4" /> }
        @case ('type-string') { <path d="M4 3.5h8M8 3.5v9" /> }
        @case ('type-number') { <path d="M6 3v10M10 3v10M3.5 6.2h9M3.5 9.8h9" /> }
        @case ('type-decimal') { <path d="M3.2 5h4.4M3.2 8h9.6M3.2 11h5.2" /><circle cx="12.2" cy="11" r=".7" /> }
        @case ('type-password') { <path d="M5.2 7.2V5.6a2.8 2.8 0 0 1 5.6 0v1.6M3.6 7.2h8.8v5.4H3.6z" /> }
        @case ('type-email') { <path d="M2.8 4.2h10.4v7.6H2.8zM3 4.6l5 3.8 5-3.8" /> }
        @case ('type-text') { <path d="M3 4.5h10M3 8h10M3 11.5h6" /> }
        @case ('type-tinymce') { <path d="M3.2 4h5.4a2.2 2.2 0 0 1 0 4.4H3.2zM3.2 8.4h6a2.3 2.3 0 0 1 0 4.4H3.2z" /> }
        @case ('type-monaco') { <path d="M6 4.5 2.5 8 6 11.5M10 4.5 13.5 8 10 11.5" /> }
        @case ('type-boolean') { <path d="M3.2 3.2h9.6v9.6H3.2zM5 8.2 7 10.2 11.2 5.6" /> }
        @case ('type-passivation') { <circle cx="8" cy="8" r="5" /><path d="M5.2 8h5.6" /> }
        @case ('type-date') { <path d="M3.2 4.6h9.6v8H3.2zM3.2 7.2h9.6M6 3.2v2.4M10 3.2v2.4" /> }
        @case ('type-datetime') { <path d="M2.6 3.8h7.4v6.4H2.6zM2.6 6h7.4M4.4 2.8v1.8M7.6 2.8v1.8" /><circle cx="11.6" cy="11.4" r="2.4" /><path d="M11.6 10.2v1.3l1 .6" /> }
        @case ('type-time') { <circle cx="8" cy="8" r="5" /><path d="M8 5v3.2l2.2 1.3" /> }
        @case ('type-select') { <path d="M2.8 3.6h10.4v8.8H2.8zM6 7.2 8 9.2 10 7.2" /> }
        @case ('type-multiselect') { <path d="M2.6 4.4 3.8 5.6 5.6 3.4M7 4.6h6.2M2.6 8.4 3.8 9.6 5.6 7.4M7 8.6h6.2M2.6 12.4 3.8 13.6 5.6 11.4M7 12.6h6.2" /> }
        @case ('type-tags') { <path d="M2.6 8.2 7.2 3.4h5.4v5.4L8.2 13.2z" /><circle cx="10.4" cy="5.6" r=".7" /> }
        @case ('type-join') { <path d="M6.6 9.4 5.2 10.8a2 2 0 0 1-2.8-2.8L3.8 6.6M9.4 6.6l1.4-1.4a2 2 0 0 1 2.8 2.8L12.2 9.4M6.2 9.8l3.6-3.6" /> }
        @case ('type-lookup') { <circle cx="7" cy="7" r="3.2" /><path d="M9.4 9.4 12.5 12.5" /> }
        @case ('type-multijoin') { <path d="M2.4 5.2h3.2M6.6 5.2h2.2M10.4 5.2h3.2M2.4 10.8h3.2M6.6 10.8h2.2M10.4 10.8h3.2" /> }
        @case ('type-multilookup') { <circle cx="6.2" cy="7.2" r="3" /><path d="M8.4 9.4 10.6 11.6M11.2 3.4v3.2M9.6 5h3.2" /> }
        @case ('type-relationships') { <circle cx="4.2" cy="4.6" r="1.6" /><circle cx="11.8" cy="4.6" r="1.6" /><circle cx="8" cy="12" r="1.6" /><path d="M5.6 5.4 7 10.6M10.4 5.4 9 10.6M5.8 4.6h4.4" /> }
        @case ('type-media') { <path d="M4 2.6h5.2L12.2 5.6V13.4H4zM9.2 2.6v3H12.2" /> }
        @case ('type-image') { <path d="M2.5 3.5h11v9h-11zM2.5 10l3-2.5 2 1.5 2.5-3 3 4" /> }
        @case ('type-location') { <path d="M8 13.8s4-3.6 4-6.6a4 4 0 0 0-8 0c0 3 4 6.6 4 6.6z" /><circle cx="8" cy="7" r="1.3" /> }
        @case ('type-path') { <path d="M4.2 12.2C6 6.4 10 6.2 11.8 10.4" /><circle cx="4" cy="12.2" r="1.3" /><circle cx="12.2" cy="10.2" r="1.3" /> }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<string>();
}
