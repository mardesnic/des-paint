# Paint

A free colour mixing game for young kids that works offline. A colour is shown, and the child pours drops of red, yellow, blue, white and black paint into a test tube until the paint in it is that colour. It teaches how colours are made, without reading or numbers.

Made for ages 5 and up. There is no timer and no way to lose. Undo takes back the last drop, and Start over empties the tube.

## Demo

Check out the live demo at: https://mardesnic.github.io/des-paint/

On your phone, open it and choose **Add to Home Screen** (Safari) or **Install app** (Chrome). It then opens like an app and works offline.

## Features

- Four levels:
  - **Very easy**: red, yellow and blue make orange, green and purple
  - **Easy**: white too, for pink, light blue and other light colours
  - **Medium**: twice as much of one paint, like reddish orange or pale pink
  - **Hard**: up to three drops of a paint, and black too
- Paint mixes like real paint: yellow and blue make green
- What counts is how much of each paint there is, so one red and one yellow make the same orange as two and two
- The drops in the tube are shown as dots, so they can be counted
- A count of colours made at each level
- Picks up where you left off after a reload
- Keeps the screen on while you play
- In English and Croatian, following the phone's language unless you pick one
- Light and dark mode
- No ads, accounts or tracking

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # game and translation tests
npm run build      # production build in dist/
```

`npm run deploy` builds the app and publishes it to GitHub Pages.
