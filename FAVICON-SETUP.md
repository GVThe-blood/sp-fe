# Favicon Setup Guide

## ✅ Completed Setup

Custom SpringFood favicon has been successfully installed and configured.

## 📁 Files Added

All favicon files are located in `public/` folder:

- `favicon.ico` - Main favicon (16x16, 32x32, 48x48)
- `favicon-16x16.png` - 16x16 PNG version
- `favicon-32x32.png` - 32x32 PNG version
- `apple-touch-icon.png` - 180x180 for iOS devices
- `android-chrome-192x192.png` - 192x192 for Android
- `android-chrome-512x512.png` - 512x512 for Android
- `site.webmanifest` - Web app manifest for PWA

## 🔧 Configuration

### index.html

Updated `src/index.html` with multiple favicon links for better browser support:

```html
<link rel="icon" type="image/x-icon" href="favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
```

### site.webmanifest

Configured web app manifest with SpringFood branding:

```json
{
  "name": "SpringFood",
  "short_name": "SpringFood",
  "theme_color": "#10b981",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

### angular.json

Assets configuration already includes `public/` folder, so all favicon files are automatically copied to `dist/` during build:

```json
"assets": [
  {
    "glob": "**/*",
    "input": "public"
  }
]
```

## 🎯 Browser Support

- ✅ Chrome/Edge - Uses `favicon.ico` and PNG versions
- ✅ Firefox - Uses `favicon.ico` and PNG versions
- ✅ Safari - Uses `apple-touch-icon.png`
- ✅ iOS Home Screen - Uses `apple-touch-icon.png`
- ✅ Android Home Screen - Uses `android-chrome-*.png` from manifest

## 🧪 Testing

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Verify files in dist:**
   ```bash
   ls dist/springfood/browser/*.png
   ls dist/springfood/browser/*.ico
   ```

3. **Test in browser:**
   - Clear browser cache (Ctrl+Shift+Delete)
   - Open the app
   - Check browser tab for new favicon
   - Check "Add to Home Screen" on mobile

## 🔄 Updating Favicon

To update the favicon in the future:

1. Generate new favicon files using a tool like:
   - https://favicon.io/
   - https://realfavicongenerator.net/

2. Replace files in `public/` folder

3. Rebuild the app:
   ```bash
   npm run build
   ```

## 📝 Notes

- The old Angular default favicon has been replaced
- All favicon files are served from the root path (e.g., `/favicon.ico`)
- PWA manifest is configured for "Add to Home Screen" functionality
- Theme color `#10b981` matches SpringFood's green branding
