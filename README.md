# useSSRComputation.macro

[![](https://github.com/Popmenu/use-ssr-computation.macro/workflows/CI/badge.svg)](https://github.com/Popmenu/use-ssr-computation.macro/actions?query=workflow%3ACI)
[![](https://img.shields.io/npm/v/useSSRComputation.macro?style=flat-square)](https://www.npmjs.com/package/useSSRComputation.macro)
[![](https://img.shields.io/github/license/Popmenu/useSSRComputation.macro?style=flat-square&color=brightgreen)](https://github.com/Popmenu/use-ssr-computation.macro/blob/master/LICENSE)
[![Babel
Macro](https://img.shields.io/badge/babel--macro-%F0%9F%8E%A3-f5da55.svg?style=flat-square)](https://github.com/kentcdodds/babel-plugin-macros)

[https://github.com/Popmenu/use-ssr-computation.macro](https://github.com/Popmenu/use-ssr-computation.macro)

A babel macro for Server-Side computations. The results are attached to HTML as JSON. Client-side the macro works similarly to ***React.useMemo***, but the data is cached during SSR. 
Similar to React Server Components (RSC) but requires less refactoring.

## Installation

TBD

## Usage

Assuming `./a.ssr-computation.js` exports a function.

The following code will be compiled differentially

```ruby
import { useSSRComputation } from "../lib/index.macro"
const x = useSSRComputation("./a.ssr-computation")
```

   **server-side -** static import synchronous execution. The result is cached and passed to the client.

**↓ ↓ ↓ ↓ ↓ ↓**

```ruby
import __a from "./a.ssr-computation";
import { useSSRComputationServer } from "use-ssr-computation/lib/useSSRComputation";
const x = useSSRComputationServer(__a, "./a.ssr-computation");
```

   **client-side -** uses cache from SSR. In case of a cache miss will import the function dynamically.

↓ ↓ ↓ ↓ ↓ ↓

```ruby
import { useSSRComputationClient } from "use-ssr-computation/lib/useSSRComputation";
const x = useSSRComputationClient("./a.ssr-computation");
```
