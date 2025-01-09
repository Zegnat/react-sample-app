# Sample React App

Sample React App using functional components per a small exercise:

> The functionality of the web page is for the user to be able to submit a
> block of text and via a simulation of a slow external API receive the
> number of characters and words in the text for display.

## Usage

After checking out or downloading and extracting this repository, navigate a
shell instance to the folder and in order run the following to setup the
environment and start a local web server:

```sh
npm ci --omit="dev"
npm run dev
```

If you want to make sure you are running on the same version of node as me, it
has been documented under `engines` in package.json. Use a tool such as [fnm][]
to install the same version with:

```sh
fnm use --install-if-missing --resolve-engines
```

## Contraints & Prerequisites

- [x] Stand-alone web page application
- [x] Web server that can be started from the command line
- [x] npm
- [x] Typescript
- [x] ReactJS
- [ ] ~~Material-ui.com (version 4)~~

### Notes on constraints

Ignore the constrained on Material UI v4 and instead use the latest stable v6.

![Wireframe sketch of the site showing a box titled initial screen above a box titled analysis screen.](Wireframes/Wireframes.001.png)

## Production

Special care has been taken to make sure the code results in a very lean final
production build.

1. Always check where bundle size originates. To inspect the final bundle,
   [vite-bundle-visualizer][] is manually run. This has helped to decide on how
   and which Material UI components are imported. E.g. it was discovered that
   the `TextField` component would always bundle code to potentially render a
   `Select`, so instead `OutlinedInput` is used.
2. React is replaced with Preact, using [@preact/compat][], on build. All code
   is written and tested in development using React before switching it in the final bundle to save on size.

To view the production build in a browser make sure all dependencies (including
`devDependencies`) are installed.

```sh
fnm use --install-if-missing --resolve-engines
npm ci
npm exec vite preview -- --config vite.build.config.mts
```

To build a distribution, change the last command to:

```sh
npm run build
```

[@preact/compat]: https://www.npmjs.com/package/@preact/compat
[fnm]: https://github.com/Schniz/fnm
[vite-bundle-visualizer]: https://www.npmjs.com/package/vite-bundle-visualizer
