# Quick Start: Adding a New Page

## Template for New Pages

To add a new page to the application, follow these steps:

### 1. Add to PageRegistry.ts

```typescript
{
  id: 'your-page-id',
  name: 'Your Page Name',
  path: '/your-page',
  navigationId: 'your-page-navigation',
  icon: './img/your-page-icon.png',  // or '../img/...' for in_game
  i18nKey: 'nav.yourPage',
  enabled: true
}
```

### 2. Register Page Loader

In `registerPageLoaders.ts`:

```typescript
pageLoader.register('your-page-id', async (params?: any) => {
  NavigationUtils.removeiFrames();
  NavigationUtils.saveActivePage();
  NavigationUtils.setActiveButton('your-page-navigation');
  
  // Initialize your page mediator
  await yourPageMediator.load();
  
  // Any additional initialization
  // ...
});
```

### 3. Add i18n Translation

Add to all locale files (e.g., `public/i18n/en.json`):

```json
{
  "nav": {
    "yourPage": "Your Page Name"
  }
}
```

### 4. Create Page Mediator (if needed)

If you need a new mediator, follow the pattern from existing pages in `escape-from-tarkov/page/`.

### Done!

Your page will automatically:
- Appear in the navigation bar
- Handle navigation clicks
- Be registered in the routing system
- Work with the centralized page loading system

## Example: Adding a "Stats" Page

```typescript
// 1. PageRegistry.ts
{
  id: 'stats',
  name: 'Statistics',
  path: '/stats',
  navigationId: 'stats-navigation',
  icon: './img/stats-icon.png',
  i18nKey: 'nav.stats',
  enabled: true
}

// 2. registerPageLoaders.ts
pageLoader.register('stats', async () => {
  NavigationUtils.removeiFrames();
  NavigationUtils.saveActivePage();
  NavigationUtils.setActiveButton('stats-navigation');
  await statsPageMediator.load();
});

// 3. i18n/en.json
"nav": {
  "stats": "Statistics"
}
```

That's it! The page is now integrated.

