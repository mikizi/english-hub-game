# English Hub Game

משחק קטן ללימוד מילים באנגלית, כולל:

- אימון כתיבה
- מבחן בחירה מהירה
- משחק זיכרון
- בחירה בין רשימות מילים מתוך קובץ JSON
- בחירת רשימת ברירת מחדל דרך מסך הניהול
- ניהול מילים דרך הדפדפן
- שמירה מקומית עם `localStorage`

## Word lists

רשימות המילים נמצאות בקובץ:

```text
data/word-lists.json
```

אפשר להוסיף שם רשימות חדשות במבנה הבא:

```json
{
  "id": "new-test",
  "name": "שם הרשימה",
  "description": "תיאור קצר שמופיע באפליקציה",
  "reference": {
    "label": "שם חומר העזר",
    "url": "assets/references/example.pdf"
  },
  "words": [
    { "en": "summer", "he": "קיץ", "icon": "☀️", "mustSpell": true }
  ]
}
```

השדה `mustSpell` קובע אם המילה תופיע באימון הכתיבה.
השדה `reference` אופציונלי ומציג קישור לחומר עזר ליד רשימת המילים.

## Run locally

Open `index.html` directly in your browser, or run a simple local server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## PWA

The app is installable as a PWA. The required assets live in:

```text
manifest.webmanifest
service-worker.js
assets/icons/
```

The service worker caches the app shell, word lists, icons, and the Unit 2 reference PDF for offline use after the first successful load.

## Upload to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git branch -M main
git push -u origin main
```

## GitHub Pages

After pushing to GitHub:

1. Open your repository settings.
2. Go to Pages.
3. Choose the `main` branch.
4. Choose the root folder.
5. Save.

GitHub will give you a public link for the game.
