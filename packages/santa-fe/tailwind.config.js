module.exports = {
  important: true,
  future: {
    purgeLayersByDefault: true,
  },
  purge: [
    "./src/*.svelte",
    "./src/components/*.svelte",
    "./public/index.html",
  ],
  plugins: [require("@tailwindcss/custom-forms")],
  variants: {},
};
