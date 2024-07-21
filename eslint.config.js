import globals from "globals"; 
import importPlugin from "eslint-plugin-import";

export default [
  {
    ignores: ["src/public/**"], // התעלמות מכל הקבצים בתיקיית src/public
    languageOptions: {
      globals: globals.browser, // הגדרת משתנים גלובליים של סביבת הדפדפן
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      indent: ["error", 2], // שימוש ב-2 רווחים לאינדנטציה
      quotes: ["error", "single"], // שימוש במרכאות בודדות למחרוזות
      semi: ["error", "always"], // דרישה לנקודה-פסיק בסוף כל משפט
      camelcase: ["error", { properties: "always" }], // דרישה לשימוש במתודולוגיית camelCase עבור שמות משתנים ותכונות
      "class-methods-use-this": "off", // ביטול הדרישה לשימוש במתודות מחלקה
      "consistent-return": "off", // ביטול הדרישה להחזרת ערך עקבית בכל המתודות
      "func-names": "off", // ביטול הדרישה למתן שמות לפונקציות אנונימיות
      "max-len": ["error", { code: 270 }], // הגבלת אורך שורה ל-80 תווים
      "no-underscore-dangle": "off", // ביטול האיסור על שימוש בקו תחתון בהתחלה או בסוף של שם מזהה
      "object-curly-newline": ["error", { multiline: true }], // דרישה לשורות חדשות עבור אובייקטים מרובי שורות
      "prefer-destructuring": ["error", { object: true, array: true }], // דרישה לשימוש בפירוק (destructuring) עבור אובייקטים ומערכים
      "no-unused-vars": ["error", { argsIgnorePattern: "req|res|next" }], // איסור על משתנים לא בשימוש, עם חריגות למשתנים בשם req, res, next
      //"no-param-reassign": ["warn", { props: true }], // איסור על שינוי פרמטרים של פונקציות
      "no-shadow": ["error", { hoist: "all" }], // איסור על הצללה של משתנים
      "no-duplicate-imports": "error", // איסור על יבוא כפול של אותו מודול
      "prefer-const": "error", // דרישה לשימוש ב-const במקום let אם המשתנה לא משתנה
      "prefer-arrow-callback": "error", // דרישה לשימוש בפונקציות חץ במקום פונקציות רגילות כקולבקים
      "no-var": "error", // איסור על שימוש ב-var והעדפת let או const
      "no-trailing-spaces": "error", // איסור על רווחים מיותרים בסוף שורה
      "key-spacing": ["error", { beforeColon: false }], // דרישה לרווח אחרי נקודתיים במפתחות אובייקט
      "comma-dangle": ["error", "always-multiline"], // דרישה לנקודה-פסיק בסוף אובייקטים ומערכים מרובי שורות
      "import/order": [
        "error",
        {
          "newlines-between": "always", // דרישה לשורות חדשות בין קבוצות יבוא שונות
          groups: [
            ["builtin", "external"], // קיבוץ יבוא מובנה ויבוא חיצוני יחד
            "internal", // קיבוץ יבוא פנימי
            ["parent", "sibling", "index"], // קיבוץ יבוא של קבצים מקבילים
          ],
        },
      ],
      "import/newline-after-import": "error", // דרישה לשורה חדשה אחרי יבוא של מודול
      "import/no-named-as-default": "off", // ביטול האיסור על שימוש ביבוא כברירת מחדל עם שם
    },
  },
  {
    ignores: ["src/**"], // התעלמות מכל הקבצים בתיקיית src
    languageOptions: {
      globals: globals.browser, // הגדרת משתנים גלובליים של סביבת הדפדפן
    },
    plugins: {
      import: importPlugin, // שימוש בפלאגין import
    },
    rules: {
      indent: ["error", 2], // שימוש ב-2 רווחים לאינדנטציה
      quotes: ["error", "single"], // שימוש במרכאות בודדות למחרוזות
      semi: ["error", "always"], // דרישה לנקודה-פסיק בסוף כל משפט
      camelcase: ["error", { properties: "always" }], // דרישה לשימוש במתודולוגיית camelCase עבור שמות משתנים ותכונות
      "class-methods-use-this": "off", // ביטול הדרישה לשימוש במתודות מחלקה
      "consistent-return": "off", // ביטול הדרישה להחזרת ערך עקבית בכל המתודות
      "func-names": "off", // ביטול הדרישה למתן שמות לפונקציות אנונימיות
      "no-underscore-dangle": "off", // ביטול האיסור על שימוש בקו תחתון בהתחלה או בסוף של שם מזהה
      "object-curly-newline": ["error", { multiline: true }], // דרישה לשורות חדשות עבור אובייקטים מרובי שורות
      "prefer-destructuring": ["error", { object: true, array: true }], // דרישה לשימוש בפירוק (destructuring) עבור אובייקטים ומערכים
      "no-unused-vars": ["error", { argsIgnorePattern: "req|res|next" }], // איסור על משתנים לא בשימוש, עם חריגות למשתנים בשם req, res, next
      "no-param-reassign": ["error", { props: true }], // איסור על שינוי פרמטרים של פונקציות
      "no-shadow": ["error", { hoist: "all" }], // איסור על הצללה של משתנים
      "no-duplicate-imports": "error", // איסור על יבוא כפול של אותו מודול
      "prefer-const": "error", // דרישה לשימוש ב-const במקום let אם המשתנה לא משתנה
      "prefer-arrow-callback": "error", // דרישה לשימוש בפונקציות חץ במקום פונקציות רגילות כקולבקים
      "arrow-parens": ["error", "always"], // דרישה לשימוש בסוגריים מסביב לפרמטרים של פונקציות חץ
      "no-var": "error", // איסור על שימוש ב-var והעדפת let או const
      "no-trailing-spaces": "error", // איסור על רווחים מיותרים בסוף שורה
      "key-spacing": ["error", { beforeColon: false }], // דרישה לרווח אחרי נקודתיים במפתחות אובייקט
      "space-before-function-paren": ["error", "never"], // איסור על רווח לפני סוגריים של פונקציה
      "comma-dangle": ["error", "always-multiline"], // דרישה לנקודה-פסיק בסוף אובייקטים ומערכים מרובי שורות
      "import/order": [
        "error",
        {
          "newlines-between": "always", // דרישה לשורות חדשות בין קבוצות יבוא שונות
          groups: [
            ["builtin", "external"], // קיבוץ יבוא מובנה ויבוא חיצוני יחד
            "internal", // קיבוץ יבוא פנימי
            ["parent", "sibling", "index"], // קיבוץ יבוא של קבצים מקבילים
          ],
        },
      ],
      "import/newline-after-import": "error", // דרישה לשורה חדשה אחרי יבוא של מודול
      "import/no-named-as-default": "off", // ביטול האיסור על שימוש ביבוא כברירת מחדל עם שם
    },
  },
];
