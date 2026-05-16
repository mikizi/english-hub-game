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

קובץ האינדקס הראשי מכיל מפה של המבחנים:

```text
data/word-lists.json
```

כל מבחן מפנה לקובץ מילים נפרד דרך `wordsUrl`, כדי שהאינדקס הראשי יישאר קטן:

```json
{
  "defaultTestId": "weather-test",
  "tests": {
    "new-test": {
      "name": "שם הרשימה",
      "description": "תיאור קצר שמופיע באפליקציה",
      "wordCount": 1,
      "wordsUrl": "data/tests/new-test.json",
      "reference": {
        "label": "שם חומר העזר",
        "url": "assets/references/example.pdf"
      }
    }
  }
}
```

קובץ המילים של מבחן נראה כך:

```json
{
  "words": [
    { "en": "summer", "he": "קיץ", "icon": "☀️", "mustSpell": true }
  ]
}
```

קבצי המילים נמצאים בתיקייה:

```text
data/tests/
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
