# Tripsy

Tripsy is a web-based travel booking platform built with Angular. It lets travellers browse destinations, search rooms, reserve a stay and pay through a simulated gateway, and lets admins manage destinations, hotels and rooms — built as part of the Angular Assignment.

## Live Demo

- **Deployed App:** https://tripsyprojectlovekeshkumararyalorem.vercel.app/

## Signing In

Tripsy uses **Google Sign-In** (Firebase Authentication). Click **Continue with Google** on the login screen and continue with your own Google account.
If Google sign-in is unavailable, see [If Google Sign-In Is Not Working](#if-google-sign-in-is-not-working-firebase-setup).


### For the mentor / evaluator: signing in as admin with your own email

1. Open `src/environments/environment.ts`.
2. Add your Google email to the allowed admin list:
   ```ts
   adminEmails: ['xyz@gmail.com', 'your.email@example.com'],
   ```
3. Rebuild/redeploy (or restart `ng serve`), then sign in with that Google account — you will see the **Admin** area.

> Admin access is decided in the browser from this list, which is fine for an assignment demo but is not real server-side authorization.

## If Google Sign-In Is Not Working (Firebase setup)
 
If the Firebase key in this build is no longer valid, or Firebase is not configured, the login page shows:
*"Firebase is not configured in this build, so Google sign-in is unavailable. Use a demo account below, or add your Firebase keys (see README)."*
 
You have two options:
 
**Option A — Use a demo account (no setup).** On the login page choose **Customer demo** or **Admin demo**. These need no Firebase and no password; they live in the browser only and exist for evaluation convenience.
 
**Option B — Add your own Firebase keys (enables real Google sign-in):**
 
1. Go to the [Firebase console](https://console.firebase.google.com/), create a project (or open an existing one).
2. **Authentication → Sign-in method →** enable the **Google** provider.
3. **Authentication → Settings → Authorized domains →** make sure `localhost` and the domain you are running on (for example the Vercel domain) are listed.
4. **Project settings → Your apps →** add a **Web app** (`</>`) and copy its config values.
5. Open `src/environments/environment.ts` and replace the empty `firebase` object with your values:
```ts
   export const environment: AppEnvironment = {
     firebase: {
       apiKey: 'YOUR_API_KEY',
       authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
       projectId: 'YOUR_PROJECT_ID',
       appId: 'YOUR_APP_ID',
     },
     adminEmails: ['xyz@gmail.com', 'your.email@example.com'],
     allowDemoRoleSwitch: true,
   };
```
 
   Only the `firebase` object needs to be replaced; the four keys are `apiKey`, `authDomain`, `projectId` and `appId`.
6. Restart `ng serve` (or rebuild and redeploy) and sign in with **Continue with Google**. The warning on the login page disappears once `apiKey` is filled in.
 
> Firebase web config values are identifiers, not secrets, so they are safe to commit; access is controlled by the authorized domains and the sign-in provider settings above.

## Features Implemented

- **Google Authentication (Firebase)** — Social sign-in with role detection (admin / customer) based on the signed-in email.
- **Destinations (Home)** — Browse published destinations.
- **Room Search** — Search by destination, check-in/check-out dates and guests; results are computed in a **Web Worker** with a safe fallback.
- **Room Details** — Amenities, photos, price and live availability.
- **Checkout & Dummy Payment Gateway** — Reserve a room, review the price breakdown and pay through a simulated gateway (success, declined, cancelled or processing).
- **Payment Success Page** — Booking details and a confirmation number.
- **My Bookings** — View and cancel upcoming bookings; cancelled bookings return their rooms to availability.
- **Admin Panel** — Add, update and delete destinations, hotels and rooms, and control their visibility.
- **Saved Searches (Bonus ✅ attempted)** — Save a search and re-run it later.
- **Styling** — SCSS with a custom design-token system.

## Assumptions & Known Limitations

- **No backend.** Firebase is used only for authentication. Destinations, hotels, bookings and saved searches are stored in the browser's `localStorage`, so data is per-browser/device. Sample data is seeded on first load.
- **Payments are simulated.** No real card details are ever requested or charged.
- **Roles are enforced in the browser only**, as noted above.

## Tech Stack

- Angular (standalone components, Signals, typed Reactive Forms)
- Firebase Authentication (Google Sign-In)
- RxJS
- SCSS
- Web Workers
- `localStorage` as the persistence layer (no backend)

## Running the Project Locally

### Prerequisites

- [Node.js](https://nodejs.org/) 22.22.3 or newer
- Angular CLI:
  ```bash
  npm install -g @angular/cli
  ```

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   ng serve
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:4200
   ```

4. Click **Continue with Google** and sign in with your own Google account.



## Building for Production

```bash
ng build
```

Build artifacts will be output to the `dist/` directory.