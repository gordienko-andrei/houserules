import houserules from 'eslint-plugin-houserules';

export default [...houserules.configs.recommended({ cwd: import.meta.dirname })];
