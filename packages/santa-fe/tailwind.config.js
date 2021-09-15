module.exports = {
  important: true,
  future: {
    purgeLayersByDefault: true,
  },
  theme: {
    extend: {
      transitionProperty: ['opacity'],
      padding: {
        sm: "var(--padding-sm)",
        md: "var(--padding-md)",
        lg: "var(--padding-lg)"
      },
      fontSize: {
        tiny: "var(--font-tiny)",
        base: "var(--font-base)",
        big: "var(--font-lg)",
        checkbox: "var(--font-check)"
      },
      lineHeight: {
        checkbox: "var(--line-height-check)"
      },
      height: {
        sm: "var(--height-sm)",
        md: "var(--height-md)",
        lg: "var(--height-lg)",
        primary: "var(--bg-height-primary)",
      },
      colors: {
        background: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          ternary: "var(--bg-ternary)",
        },
      },
      textColor: {
        /**Name conflict. MaterialCSS uses text-primary. add t to override. */
        tprimary: "var(--text-tprimary)",
        tsecondary: "var(--text-tsecondary)",
        tternary: "var(--text-tternary)",
      },
      borderColor: {
        primary: "var(--bg-primary)",
        secondary: "var(--bg-secondary)",
        ternary: "var(--bg-ternary)",
      },
      transitionProperty: ['invisible'],
    },
  },
  purge: [
    "./src/*.svelte",
    "./src/components/*.svelte",
    "./public/index.html",
  ],
  plugins: [require("@tailwindcss/custom-forms")],
  variants: {},
};
