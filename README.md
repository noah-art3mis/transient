# Transient

Theatre-focused personal logging and discovery platform (like Letterboxd for performing arts).

## Stack

TypeScript, Expo Router, React Native + React Native Web, NativeWind (Tailwind), Supabase

## Development

```bash
npm install
npm start          # Expo dev server
npm run web        # Web dev server
npm run check      # All checks: lint + typecheck + format + test
```

## Deployment (Web)

The web app is deployed on [Netlify](https://www.netlify.com/), connected to the `main` branch on GitHub. Every push to `main` triggers an automatic deploy.

**Netlify settings:**

- Build command: `npx expo export --platform web`
- Publish directory: `dist`

The `public/_redirects` file handles SPA routing so all paths serve `index.html`.

### Manual deploy

```bash
npx expo export --platform web
netlify deploy --dir dist --prod
```
