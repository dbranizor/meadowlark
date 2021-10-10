module.exports = {
  future: {
    purgeLayersByDefault: true,
  },
  theme: {
    extend: {},
  },
  purge: [
    './client/*.svelte',
    './client/components/*.svelte',
    './client/index.html'
  ],
  variants: {},
  plugins: [],
}
