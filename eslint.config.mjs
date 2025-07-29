import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginVue from "eslint-plugin-vue"

export default [
  { files: ["**/*.{js,mjs,cjs,vue}"] },
  { ignores: ["dist/*", "scripts/*"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    files: ["scripts/*", "vite.config.js"],
    languageOptions: { globals: globals.node },
  },
]
