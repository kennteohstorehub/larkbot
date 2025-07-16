module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Customize rules for this project
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'max-len': ['error', { code: 120, ignoreComments: true }],
    'comma-dangle': ['error', 'never'],
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'no-underscore-dangle': 'off',
    'consistent-return': 'off',
    'no-param-reassign': ['error', { props: false }],
    'radix': 'off',
    'no-plusplus': 'off',
    'class-methods-use-this': 'off',
    'no-await-in-loop': 'off',
    'no-restricted-syntax': 'off',
    'guard-for-in': 'off',
    'object-curly-newline': ['error', { 
      ObjectExpression: { multiline: true, consistent: true },
      ObjectPattern: { multiline: true, consistent: true },
      ImportDeclaration: { multiline: true, consistent: true },
      ExportDeclaration: { multiline: true, consistent: true }
    }],
    'function-paren-newline': 'off',
    'implicit-arrow-linebreak': 'off',
    'operator-linebreak': 'off',
    'newline-per-chained-call': 'off'
  },
  overrides: [
    {
      files: ['*.test.js', '*.spec.js', 'tests/**/*.js'],
      rules: {
        'no-console': 'off',
        'import/no-extraneous-dependencies': 'off'
      }
    },
    {
      files: ['scripts/**/*.js', 'setup*.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};