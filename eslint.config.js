// @ts-check

import { readFileSync } from 'node:fs';

import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import compat from 'eslint-plugin-compat';
import importX from 'eslint-plugin-import-x';
import node from 'eslint-plugin-n';
import unicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    compat.configs['flat/recommended'],
    importX.configs.typescript,
    node.configs['flat/recommended-module'],
    unicorn.configs['flat/recommended'],
    prettierConfig,
    {
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
            },
        },
    },
    {
        settings: {
            lintAllEsApis: true,
            node: {
                version: readFileSync('./.nvmrc'),
            },
        },
    },
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unsafe-argument': 'warn',
            '@typescript-eslint/no-unsafe-assignment': 'warn',
            '@typescript-eslint/no-unsafe-call': 'warn',
            '@typescript-eslint/no-unsafe-member-access': 'warn',
            '@typescript-eslint/no-unsafe-return': 'warn',
            '@typescript-eslint/prefer-includes': 'off',
            'n/no-missing-import': 'off',
            'unicorn/no-array-for-each': 'off',
            'unicorn/no-new-array': 'off',
            'unicorn/no-null': 'off',
            'unicorn/prefer-dom-node-append': 'off',
            'unicorn/prefer-dom-node-remove': 'off',
            'unicorn/prefer-includes': 'off',
            'unicorn/prefer-number-properties': 'off',
            'unicorn/prefer-spread': 'off',
        },
    },
    {
        ignores: ['dist/'],
    },
);
