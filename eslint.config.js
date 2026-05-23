import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist/*", "dev-dist/*"] },
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
];
