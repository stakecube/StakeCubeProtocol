module.exports = {
  "env": {
      "node": true
  },
  "extends": [
      "standard"
  ],
  "ignorePatterns": ["scripts/*.js"],
  "rules": {
      "array-bracket-spacing": [2, "never"],
      "block-scoped-var": 2,
      "brace-style": [2, "1tbs"],
      "camelcase": 1,
      "computed-property-spacing": [2, "never"],
      "curly": 2,
      "eol-last": 2,
      "eqeqeq": [2, "always"],
      "indent": [2, 4],
      "keyword-spacing": [2, { "before": true, "after": true, "overrides": { "catch": { "after": false } } }],
      "max-depth": [1, 3],
      "max-len": [1, { "code": 80, "ignoreComments": true }],
      "max-statements": [1, 15],
      "new-cap": 1,
      "no-extend-native": 2,
      "no-extra-semi": 2,
      "no-mixed-spaces-and-tabs": 2,
      "no-trailing-spaces": 2,
      "no-unreachable": 2,
      "no-unused-vars": 2,
      "no-use-before-define": [2, "nofunc"],
      "object-curly-spacing": [2, "always"],
      "prefer-const": ["error", { "destructuring": "any", "ignoreReadBeforeAssign": true }],
      "quotes": [2, "single", "avoid-escape"],
      "quote-props": [2, "always"],
      "semi": [1, "always"],
      "semi-spacing": [2, { "before": false, "after": true }],
      "space-before-function-paren": [2, { "anonymous": "never", "named": "never", "asyncArrow": "always" }],
      "space-unary-ops": 2
  }
};
