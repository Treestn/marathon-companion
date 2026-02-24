# Page System Documentation

## Overview

This directory contains the centralized page management system that makes it easy to add new pages to the application.

## Adding a New Page

### Step 1: Add to PageRegistry

Edit `PageRegistry.ts` and add your page configuration:

```typescript
{
  id: 'my-new-page',
  name: 'My New Page',
  path: '/my-new-page',
  navigationId: 'my-new-page-navigation',
  icon: './img/my-new-page-icon.png',
  i18nKey: 'nav.myNewPage',
  enabled: true
}
```

### Step 2: Register the Page Loader

Edit `registerPageLoaders.ts` and add your loader:

```typescript
pageLoader.register('my-new-page', async (params?: any) => {
  NavigationUtils.removeiFrames();
  NavigationUtils.saveActivePage();
  NavigationUtils.setActiveButton('my-new-page-navigation');
  await yourPageMediator.load();
  // ... any other initialization logic
});
```

### Step 3: Add i18n Key

Add the translation key to your i18n files (e.g., `public/i18n/en.json`):

```json
{
  "nav": {
    "myNewPage": "My New Page"
  }
}
```

### That's it!

The page will automatically appear in the navigation bar and be handled by the routing system.

## File Structure

- `PageRegistry.ts` - Central registry of all pages
- `PageLoader.ts` - Abstraction for page loading
- `registerPageLoaders.ts` - Registration of page loaders

## Benefits

1. **Single Source of Truth**: All pages defined in one place
2. **Easy to Add**: Just 3 steps to add a new page
3. **Type Safe**: TypeScript ensures consistency
4. **Future Ready**: Easy to migrate to full React routing later

