// postcss.config.js
// Use the new Tailwind PostCSS plugin package (@tailwindcss/postcss)
// and export CommonJS for PostCSS/Vite compatibility.
module.exports = {
  plugins: [
    // Tailwind's PostCSS plugin moved to @tailwindcss/postcss
    // Calling it without options uses the default config lookup (tailwind.config.js)
    require("@tailwindcss/postcss")(),
    require("autoprefixer")(),
  ],
};
