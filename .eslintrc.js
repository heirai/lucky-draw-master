module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/essential', '@vue/prettier'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

    // 新增规则以解决 no-prototype-builtins 报错
    'no-prototype-builtins': 'off',
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
};
