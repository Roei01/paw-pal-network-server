import globals from "globals";

export default [
  {

    languageOption: {globals: globals.browser},
    rules:{
        indent: ["error", 4],
        "quotes": ["error", "single"],
        "semi": ["error", "always"],
        "no-console": "off"
    }

}
];
