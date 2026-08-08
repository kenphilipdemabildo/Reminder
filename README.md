# Monthsary Reminder ❤️

GitHub/Vercel-ready Progressive Web App.

## Default settings

- Monthsary day: 8th
- Reminder: 12:00 AM
- Starting date: March 8, 2024
- Display on August 8, 2026: 29 months together

## Deploy to Vercel

1. Create a GitHub repository.
2. Upload all files in this folder.
3. Import the repository into Vercel.
4. Deploy.
5. Open the Vercel URL on Android Chrome.
6. Use the browser's Install/Add to Home Screen option.
7. Open the installed app and tap **Enable Notifications**.
8. Tap **Test Notification** to verify notifications.

## Important notification limitation

A normal PWA cannot guarantee an exact 12:00 AM alarm while Android has completely suspended/killed the browser or PWA. The browser/OS controls background execution and notification sounds.

When the PWA is allowed to run in the background, notification delivery can work, but exact alarm timing is not guaranteed by standard web APIs.

For a guaranteed exact 12:00 AM alarm even after the app is fully closed, a native Android app using Android AlarmManager is recommended.
