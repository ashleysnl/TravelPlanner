# Vacation Trip Tracker

Standalone local web app for planning vacations with:

- activity timeline
- budget dashboard + category breakdown
- planned vs paid cost tracking
- USD to CAD conversion
- print-friendly report for PDF sharing

## Run Locally on Mac

1. Open `/Users/AshleySkinner/Documents/00_Engineering/04_Code/26_Vacation Tracker/index.html` in Safari or Chrome.
2. The app stores your edits in browser `localStorage`.

Optional (served locally):

1. In Terminal:
   ```bash
   cd "/Users/AshleySkinner/Documents/00_Engineering/04_Code/26_Vacation Tracker"
   python3 -m http.server 8000
   ```
2. Open `http://localhost:8000`

## Print / Save as PDF

1. Click `Print / Save as PDF`.
2. In the macOS print dialog, choose `Save as PDF`.
3. Share the generated PDF with your wife.

## Notes

- `Reset Demo Data` restores the included sample itinerary.
- Update the `USD to CAD Rate (CDN)` field to match your current exchange rate.
