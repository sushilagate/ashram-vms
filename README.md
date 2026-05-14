# आश्रम विजिटर नोंदणी — Static Site

A fully static, deployable Marathi visitor registration system for ashrams.
Works on any web host (Netlify, Vercel, GitHub Pages, your own server, S3, etc.)
**No build step. No dependencies. No backend required.**

## File structure

```
├── index.html          New visitor multi-step form
├── search.html         Returning visitor search + profile + new visit
├── dashboard.html      Admin view — filters, table, Excel export
├── style.css           All styles (responsive, mobile + desktop)
├── app.js              Shared logic — storage, helpers, widgets
└── assets/
    └── favicon.svg
```

## How to deploy

### Option 1 — Just drop on any host
Upload the entire folder. Point your domain to `index.html`. Done.

### Option 2 — Netlify / Vercel / Cloudflare Pages
Drag the folder onto their dashboard — they auto-deploy in seconds.

### Option 3 — GitHub Pages
1. Push these files to a GitHub repo
2. Settings → Pages → Source: `main` branch / root
3. Site goes live at `https://username.github.io/repo-name/`

### Option 4 — Your own server (Apache/Nginx)
Just copy the files into your web root (`/var/www/html/` or similar).

## Data storage

The site uses **browser localStorage** — all visitor records are saved
locally in each browser. This means:

- ✅ Works offline after first load
- ✅ Zero server cost
- ✅ Fast (no network needed)
- ⚠️ Data lives in one browser only — different devices won't share data
- ⚠️ Clearing browser data will erase records

**For multi-device sync** you'd need to add a backend (e.g. Firebase,
Supabase, Google Sheets API). The form fields and UI are ready for it
— just swap out the storage functions in `app.js`.

## Features

- **नवीन विजिटर** — Multi-step wizard (4 steps when staying, 3 for day visit)
  - Multi-select व्यवसाय (with manual entry)
  - Multi-select भेटीचा उद्देश (with manual entry)
  - Conditional चेक-इन/आउट + कालावधी
  - Conditional health section with multi-select आरोग्य समस्या
  - Consent box with quote
  - Review summary on final step

- **यापूर्वी भेट दिलेली** — Search by mobile or name
  - "सर्व नोंदी पहा" fallback
  - Profile with visit count, total stay, member-since
  - Collapsible visit history with program & purpose tags
  - New visit form (compact, pre-filled)

- **सर्व नोंदी (Dashboard)** — Admin / management view
  - Search bar (name, mobile, address)
  - Filters: उद्देश, शहर, व्यवसाय, विजिटर प्रकार, तारीख श्रेणी
  - Table view (desktop) / card view (mobile) — auto-switched
  - Export filtered data to CSV (Excel-compatible UTF-8 BOM)

## Responsive

The site is **fully responsive** with no separate mobile / desktop pages.
The same HTML adapts to any screen size via CSS:
- Phone: stacked layout, card-style data list, compact nav
- Tablet: hybrid layout
- Desktop: side-by-side filters, full data table

## Customization

- Colors: edit CSS custom properties in `:root` at the top of `style.css`
- Demo data: edit `DEMO_VISITORS` in `app.js`
- Field options (programs, purposes, professions, health): edit constants
  at the top of `app.js`
- Brand name / title: edit `renderHeader()` in `app.js`

## Browser support

Modern evergreen browsers (Chrome, Edge, Safari, Firefox — last 2 years).
Uses CSS Grid, Flexbox, `:has()`, ES6+. No IE support.

## License

Use freely for your ashram / service organization.
