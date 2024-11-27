This is the CalyxOS version of android-webinstall, modified for use with CalyxOS.

calyxos-webinstall changes from upstream android-webinstall:

- Modified `.env`
- Modified `src/config.js`
- Modified `src/core/devices.js`
- Replaced `public/releases/index.json` (via update-releases script)
- Replaced `public/favicon.png`
- Removed step that lets you select clean install or not.
- Modified `public/index.html` to remove request for icons via CDN, saved icon CSS and fonts to `public`.

Scripts:

- `yarn run update-releases`: This will grab the latest list of factory images and update webinstall's `releases/index.json` file.
