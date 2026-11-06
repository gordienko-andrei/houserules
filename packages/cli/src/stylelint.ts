const config = {
  rules: {
    'declaration-property-unit-disallowed-list': [
      { 'font-size': ['px'], '/^font$/': ['px'] },
      {
        message:
          'Font size is set in fixed px. Use rem or a typography token of the project, so text scales up to 200% (WCAG 1.4.4).',
      },
    ],
  },
};

export default config;
