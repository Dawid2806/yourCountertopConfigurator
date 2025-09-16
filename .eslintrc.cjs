module.exports = {
  root: true,
  extends: ["next", "next/core-web-vitals"],
  parserOptions: { tsconfigRootDir: __dirname, project: ["./tsconfig.json"] },
  rules: {
    "@next/next/no-img-element": "off",
  },
};

