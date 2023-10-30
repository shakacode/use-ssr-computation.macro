# useSSRComputation.macro

[![](https://github.com/shakacode/use-ssr-computation.macro/workflows/CI/badge.svg)](https://github.com/shakacode/use-ssr-computation.macro/actions?query=workflow%3ACI)
[![](https://img.shields.io/npm/v/useSSRComputation.macro?style=flat-square)](https://www.npmjs.com/package/useSSRComputation.macro)
[![](https://img.shields.io/github/license/shakacode/useSSRComputation.macro?style=flat-square&color=brightgreen)](https://github.com/shakacode/use-ssr-computation.macro/blob/master/LICENSE)
[![Babel
Macro](https://img.shields.io/badge/babel--macro-%F0%9F%8E%A3-f5da55.svg?style=flat-square)](https://github.com/kentcdodds/babel-plugin-macros)

[https://github.com/shakacode/use-ssr-computation.macro](https://github.com/shakacode/use-ssr-computation.macro)

A Babel macro designed to offload computations to the server-side, with the results attached to the HTML as JSON.

On the client-side, the macro mimics the behavior of `React.useMemo`, fetching results cached during Server-Side Rendering (SSR). This reduces client-side bundle size by eliminating unnecessary code and library imports.

It's similar to ***React Server Components (RSC)*** but requires less refactoring.

## 📌 Table of Contents

- [Overview](#overview)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
  - [Basic Example: Dynamic Date Formatting](#basic-example-dynamic-date-formatting)
  - [Subscriptions Feature](#subscriptions-feature)
  - [Example with Subscriptions: Showing the current time](#example-with-subscriptions-showing-the-current-time)
- [Installation](#installation)
- [Under the Hood](#under-the-hood)

## 🌟 Overview

In the modern web ecosystem, performance is king. With `use-ssr-computation.macro`, the objective is simple: perform computation-heavy tasks server-side and send only the essential results to the client. This ensures a more responsive user experience, especially on lower-end devices.

## Usage
The `useSSRComputation` macro is used to execute code on the server-side and cache the result for the client-side.

**Arguments:**
- `path` - the path to the file that contains the code to be executed on the server-side.
- `dependencies` - an array of dependencies that will be passed as arguments to the function in the `path` file.
- `options` - SSR computation options object. It can contain the following options:
  - `webpackChunkName` - the name of the webpack chunk that will be created for the SSR computation file. It's useful for code splitting. If not provided, the default chunk name will be `default-ssr-computations`.
  - `skip` - a boolean value that indicates whether the SSR computation should be skipped or not. It's useful for development purposes. If not provided, the default value will be `false`. It's necessary because React hooks can't be called conditionally. Instead, we can use the `skip` option to skip the SSR computation until needed.

**Return Value:**
- The return value of the `useSSRComputation` hook is the result of the server-side computation. It will be `null` if the computation hasn't been executed yet (skipped or still downloading the SSR computation file).

## Basic Usage
Simply put, execute computations on the server, cache the result, and make it available on the client-side.

### Your Computation File
The computation file must export a function named `compute` that takes the dependencies as arguments and returns the result of the computation.

The `compute` function must be a `sync` function and it must returns a result that can be serialized. It can't return a function or a class.

**Dependencies**
Each dependency should be of the dependency type:

```typescript
type Dependency = string | number | { uniqueId: string };
```
You can pass either the primitive types `string` or `number` or any other object that has a `uniqueId` property of type `string`.
This is necessary to serialize the dependencies and pass them to the client-side. The `uniqueId` is used to serialize the dependency and to compare it with the client-side dependency.

```javascript
// someLogic.ssr-computation.js
export const compute = () => {
// Your server-side computation logic here
};
```

### Within Your App
After defining your logic:

```javascript
import { useSSRComputation } from "use-ssr-computation.macro";

const computationResult = useSSRComputation("./path-to-someLogic.ssr-computation");
```

### Detailed Walkthrough
Once the useSSRComputation hook is invoked, here’s what happens:

- **Server-Side**: The provided computation logic is executed.
- **Cache**: The result is stored in an ssr-computation cache.
- **Client-Side**: The cached result is used, without needing to re-run or include the original computation logic in the client bundle. It will only be re-run if the dependencies change. In this case, the `ssr-computation` file will be imported dynamically and executed.

### Benefits:
Smaller Client Bundles: Only the results are sent to the client, not the actual logic or heavy libraries.
Faster Initial Loads: Reduced JavaScript means faster parsing and execution times.

### Basic Example: Dynamic Date Formatting
Use the `luxon` package to dynamically format a user's birthdate on the server side, ensuring the client-side bundle remains lightweight by loading the library only when the birthdate changes.

1- **Server-side computation** file named `./formatBirthDate.ssr-computation.js`:
```javascript
// ./formatBirthdate.ssr-computation.js
import { DateTime } from "luxon";

export const compute = (birthdate) => {
  return DateTime.fromISO(birthdate).toLocaleString(DateTime.DATE_FULL);
};
```

```javascript
// App.js

import React, { useState } from "react";
import { useSSRComputation } from "use-ssr-computation.macro";

const App = () => {
  const [birthDate, setBirthDate] = useState("1990-07-20");  // Example date
  const formattedDate = useSSRComputation("./formatBirthDate.ssr-computation", [birthDate]);

  return (
    <div>
      User's birthdate is: {formattedDate}
      <input
        type="date"
        value={birthDate}
        onChange={e => setBirthDate(e.target.value)}
      />
    </div>
  );
};

export default App;
```
The `luxon` package is included on server-budle and executed on the server side. The formatted date is passed to the client side.
If the user changes their birthdate on the client side, the SSR computation file will be dynamically loaded on the client side, execute it, and return the updated result.

## Subscriptions Feature
The macro now supports a "subscription" mechanism. This allows dynamic computations that can update over time.

### Computation File with Subscription
Your computation file should have the usual `compute` function and an additional `subscribe` function if it supports dynamic updates:

The subscription function will only be called on the client side. Only in the following cases:
- The computation is not cached before (there is a cache miss).
- The `fetchSubscriptions` function is called. In this case, all SSR computation files are downloaded and executed.

**The `compute` function will be called first and then the `subscribe` function.**
```javascript
export const compute = () => {
  // computation logic
};

export const subscribe = (getCurrentResult, next, ...dependencies) => {
  // subscription logic
  return {
    unsubscribe: () => {
      // cleanup logic
    },
  };
};
```

- `getCurrentResult` function returns the last result returned by the computation. It will return null if the computation hasn't been executed yet (not cached before and the `compute` function returned `NoResult`).
- `next` function is used to update the result. It takes one argument which is the new result.

### Using Subscriptions in Your App
After a computation is initially fetched, you can subscribe to updates using the `fetchSubscriptions` function:
```javascript
import { useSSRComputation, fetchSubscriptions } from "use-ssr-computation.macro";

const result = useSSRComputation("./path-to-computeData.ssr-computation");
```

When you want to start listening for changes, simply invoke `fetchSubscriptions()`:
```javascript
fetchSubscriptions();
```

For more details about the subscriptions feature, please check the [subscriptions example with React On Rails Pro](https://www.shakacode.com/react-on-rails-pro/). Also, you can look at the [Add support for Subscriptions PR](https://github.com/shakacode/use-ssr-computation.macro/pull/70)

### Example with Subscriptions: Showing the current time
A practical application of the macro with the new subscriptions feature is formatting and updating the current time every minute using the `luxon` library.

1- **Server-side Computation with Subscription:**
```javascript
// formattedTime.ssr-computation.js

import { DateTime } from "luxon";

export const compute = () => {
  return DateTime.now().toLocaleString(DateTime.TIME_SIMPLE);
};

let timerId;

export const subscribe = (getCurrentResult, next) => {
  if (timerId) clearInterval(timerId);

  timerId = setInterval(() => {
    const newValue = compute();
    if (newValue !== getCurrentResult()) {
      next(newValue);
    }
  }, 60000);  // Update every minute

  return {
    unsubscribe: () => {
      clearInterval(timerId);
    },
  };
};
```
2-**Application Integration:**
```javascript
// App.js

import React, { useEffect } from "react";
import { useSSRComputation, fetchSubscriptions } from "use-ssr-computation.macro";

const App = () => {
  const formattedTime = useSSRComputation("./formattedTime.ssr-computation");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSubscriptions();
    }, 60000); // Subscribe after 1 minute

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div>
      Current time is: {formattedTime}
    </div>
  );
};

export default App;
```

The computation module and the `luxon` package are not loaded immediately, thereby optimizing initial page load times. Only after 1 minute (when the `fetchSubscriptions` function is called) will the library and module be dynamically loaded and the subscription set up to update the time.

With this mechanism, we've effectively lazy-loaded our time formatting operation, deferring the load of `luxon` and ensuring minimal performance impact during the critical initial page render.

### Performance Gains
Why go through this trouble?

- Lazy Loading: Import heavy libraries only when they're truly necessary.
- Reduced Network Payload: Only essential data is sent over the wire.
- Optimized CPU Utilization: Client devices do less computational work, leading to better responsiveness.

## Installation
### Install Packages
**NPM**
```bash
npm install babel-plugin-macros @shakacode/use-ssr-computation.macro @shakacode/use-ssr-computation.runtime
```
**Yarn**
```bash
yarn add babel-plugin-macros @shakacode/use-ssr-computation.macro @shakacode/use-ssr-computation.runtime
```

### Configure Babel
1- Add the following to your `.babelrc` that's responsible for compiling your server-bundle file:

```json
{
  "plugins": [
    "macros",
    {
      "useSSRComputation": {
        "side": "server"
      }
    }
  ]
}
```

2- Add the following to your `.babelrc` that's responsible for compiling your client-bundle file:

```json
{
  "plugins": [
    "macros",
    {
      "useSSRComputation": {
        "side": "client"
      }
    }
  ]
}
```

### Pass the SSR Computation Cache to the Client by embedding it in the HTML
Add the following to your returned HTML from the server **after rendering your React app**:

```javascript
import { getSSRCache } from "use-ssr-computation.macro";
```

```HTML
<script
  dangerouslySetInnerHTML={{
    __html: `
      window.__SSR_COMPUTATION_CACHE=${JSON.stringify(getSSRCache())};
    `,
  }}
/>
```

If you are using `Typescript`, don't forget to add `__SSR_COMPUTATION_CACHE` to the `Window` interface:
```typescript
import { SSRCache } from "use-ssr-computation.macro";

interface Window {
  __SSR_COMPUTATION_CACHE: SSRCache;
}
```

### Hydrate the SSR Computation Cache on the Client
Add the following to your client-side entry file **before rendering your React app**:

```javascript
import { setSSRCache } from "use-ssr-computation.macro";

const cache = window.__SSR_COMPUTATION_CACHE;
if (cache) {
  setSSRCache(cache);
}
```

## Under the Hood
The macro works by transforming the `useSSRComputation` hook into a function call that's executed on the server-side and cached for the client-side. The macro also transforms the `useSSRComputation` hook into a function call that's executed on the client-side, mimicking the behavior of `React.useMemo`.

### Example

```javascript
import { useSSRComputation } from "use-ssr-computation.macro";
const x = useSSRComputation("./a.ssr-computation", [1, 2, 3], {});
```

**↓ ↓ ↓ ↓ ↓ ↓**

**Server Bundle**
```javascript
import * as __a from "./a.ssr-computation";
import useSSRComputation_Server from "@shakacode/use-ssr-computation.runtime/lib/useSSRComputation_Server";
const x = useSSRComputation_Server(__a, [1, 2, 3], {}, "app/a.ssr-computation");
```

**Client Bundle**
```javascript
function _dynamicImport_() {
  return import(
    /* webpackChunkName: "default-ssr-computations" */ "./a.ssr-computation"
    );
}
import useSSRComputation_Client from "@shakacode/use-ssr-computation.runtime/lib/useSSRComputation_Client";
const x = useSSRComputation_Client(
  _dynamicImport_,
  [1, 2, 3],
  {},
  "app/a.ssr-computation",
);
```

**For more examples of the code transformation, please check the [snapshot tests](packages/macro/tests/__snapshots__)**
