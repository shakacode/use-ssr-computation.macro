# useSSRComputation.macro

[![](https://github.com/Popmenu/use-ssr-computation.macro/workflows/CI/badge.svg)](https://github.com/Popmenu/use-ssr-computation.macro/actions?query=workflow%3ACI)
[![](https://img.shields.io/npm/v/useSSRComputation.macro?style=flat-square)](https://www.npmjs.com/package/useSSRComputation.macro)
[![](https://img.shields.io/github/license/Popmenu/useSSRComputation.macro?style=flat-square&color=brightgreen)](https://github.com/Popmenu/use-ssr-computation.macro/blob/master/LICENSE)
[![Babel
Macro](https://img.shields.io/badge/babel--macro-%F0%9F%8E%A3-f5da55.svg?style=flat-square)](https://github.com/kentcdodds/babel-plugin-macros)

Count lines or words in files at build time

## Installation

`useSSRComputation.macro` is a [Babel
macro](https://github.com/kentcdodds/babel-plugin-macros). This will work out of
the box with CRA, Gatsby, and Next.

```shell
npm install --save-dev useSSRComputation.macro
```

## Usage

Line and word information is based on the **source** file, not the output file.

For example, this file
