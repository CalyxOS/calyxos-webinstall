# Android web installer

This is an easy-to-use web installer for [CalyxOS](https://calyxos.org) that runs entirely in the browser. It is written in typescript and uses WebUSB, which is supported by Chromium and its derivatives. This allows you to install and Android operating system from computers and Android devices software with no additional software or command-line tools.

Based on the the original and useful installer for [ProtonAOSP](https://github.com/ProtonAOSP) built by [kdrag0n](https://protonaosp.kdrag0n.dev/install/web/).

## Development

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`

All configuration is in `src/config.js` and `.env`, and the release index at `src/releases.json`. `npm run update-releases` will update `src/releases.json` from the data in `calyxos.org/data/downloads.yml`.

### Using docker

Build the docker image: `docker build --tag YOUR_TAG .` or `npm run docker-build`

Run the app: `docker run --rm -p 8080:80 calyxos-webinstall:latest`

Create a production build:

```
npm run docker-build
container_id=$(docker create calyxos-webinstall:latest)
mkdir docker-build/
docker cp -a "$container_id":/site ./docker-build
tree docker-build/site
```

## Contributing

Contributions are welcome! If you adapt this installer or make other improvements to it, please contribute the improvements back to the official repository instead of forking it and keeping the changes to yourself. There are many rough edges that need to be improved upon.
