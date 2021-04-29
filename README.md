# vite-plugin-linaria
A Vite plugin for Linaria, like `@linaria/webpack-loader`

### 📖 Please refer to the [GitHub](https://github.com/callstack/linaria#readme) for full linaria documentation.

## Installation

```sh
npm install vite-plugin-linaria-css
```

or

```sh
yarn add vite-plugin-linaria-css
```

## Simple Configure

```ts
import linaria from 'vite-plugin-linaria';
export default defineConfig({
  plugins: [
    linaria({
      sourceMap: true,
      cacheDirectory: '.linaria-cache',
      extension: '.linaria.css',
    }),
  ]
})
```
