# GitHub Mass Follower Dashboard

A premium, glassmorphism-themed client-side web dashboard to search, filter, and mass-follow active GitHub users. The application calculates users' active dates based on their public GitHub events to target developers active within your preferred window.

## Features

- **OAuth-Free, Client-Side Architecture**: Requires a GitHub Personal Access Token (PAT). Token is saved locally in your browser (`localStorage`) and never leaves your machine.
- **Dynamic Scraper Sources**:
  - Followers of a target user
  - Users followed by a target user (Following)
  - Members of an organization
  - Advanced search query (e.g., location, language, active repos)
- **Active User Filtering ("Preferred Days Back Online")**: Scans recent public events of candidates and checks if they have been active within a chosen threshold (e.g., last 24h, 3 days, 7 days).
- **Concurrency & Concurrency Control ("Huge Number in Single Time")**: Processes multiple follows in parallel using a queue with customizable delay offsets to run at maximum speed while preventing secondary rate-limit blocks.
- **Real-Time Visual Metrics**: Beautiful progress animations, charts for success/skip/failure counters, live scrolling execution log, and tabular results view.
- **Manual Actions Override**: View details, check live profiles, and manually follow or unfollow candidates.
- **CSV & JSON Reporting**: Export details of the follow campaign.

## How to Set Up

### 1. Generate a GitHub PAT (Personal Access Token)
To allow the application to verify user activity and follow users on your behalf, you need a Personal Access Token:
1. Go to **GitHub Settings** -> **Developer Settings** -> **Personal Access Tokens** -> **Tokens (classic)**.
2. Click **Generate new token (classic)**.
3. Set a name and check the `user:follow` scope.
4. Generate and copy the token.

### 2. Launch the Dashboard
You can run this application by starting a local HTTP server in this directory:
Using Python:
```bash
python -m http.server 8000
```
Or using Node.js:
```bash
npx live-server
```
Then open `http://localhost:8000` in your web browser.
