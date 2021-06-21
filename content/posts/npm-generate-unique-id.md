---
title: Generate a Universally Unique Identifier (uuid) with Node.js
metaDescription: Generate a universally unique identifier with Node.js using the uuid npm package, that supports both commonJS and ECMAScript module formats.
tags:
  - Node.js
author: James Edwards
guid: f9ef09ec-a828-4d34-b3ff-5b9dc9f7208f
image: npm-generate-unique-id.png
---

The uuid, or universally unique identifier, npm package is a secure way to generate cryptographically strong unique identifiers with Node.js that doesn't require a large amount of code. The [uuid npm package](https://www.npmjs.com/package/uuid) has zero dependencies, and over thirty thousand packages depend on it, making it a safe choice when an id is needed that is guaranteed to be unique. It supports commonJS modules and also [ECMAScript Modules](https://nodejs.org/api/esm.html), making it a good cross-platform choice. Besides generating a unique id, the uuid npm package has other utility methods available in its API that can be useful when working with unique identifiers, to ensure that they are valid.

### npm install uuid

We can create a sample node.js script to test out the functionality of the uuid npm package, but first make sure that [Node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) are installed. Then run the command <kbd>npm init</kbd> in a test project folder terminal window, and follow the prompts that are shown. This will create a package.json file, which will be used to install the uuid package. Creating a package.json file is not needed, if you are adding uuid to an existing project.

After creating the package.json file run the command <kbd>npm install uuid --save</kbd>, and the uuid npm package will be added to the node_modules folder inside the project folder. If you are using TypeScript you can also run the command <kbd>npm install @types/uuid</kbd> to install the type definitions for the uuid npm package. See how to [compile TypeScript with npm](/npm-compile-typescript/) for more information if you want to use the uuid npm package with TypeScript.

### Generate uuid with Node.js

With the uuid npm package installed we can now import it into a Node.js script and use the functions provided. Create a new file named "index.js" and include the uuid npm package like this:

```typescript
import { v4 as uuidv4 } from "uuid";

function main() {
  const uniqueId = uuidv4();
  console.log(uniqueId);
}

main();
```

What this does is import the [RFC4122](https://tools.ietf.org/html/rfc4122) version 4 uuid export using ECMAScript modules syntax. If you aren't using ES Modules, you can by following the steps to [import and export ES Modules in Node.js](/import-es-modules-in-nodejs-with-typescript-and-babel/), or you can use commonJS modules with a different import syntax that looks like this:

```typescript
const { v4: uuidv4 } = require("uuid");
```

For the remainder of this example we will use the ES Module syntax.

To test out the Node.js script, we can add a package.json script to run it. In the "scripts" property of the package.json file add the following:

```json
{
  "scripts": {
    "start": "node index.js"
  }
}
```

After adding the additional script run the command <kbd>npm run start</kbd>, and you should see a uuid output to the console that looks similar to this:

```bash
d160b410-e6a8-4cbb-92c2-068112187503
```

You can re-run the command and a new uuid will be generated each time.

### Validate uuid

The uuid npm package can also validate uuid strings to test whether they are a valid uuid. To do this add some additional code to the index.js file we just created.

```typescript
import { v4 as uuidv4 } from "uuid";
import { validate as uuidValidate } from "uuid";

function main() {
  const uniqueId = uuidv4();
  console.log(uniqueId);

  const isValid = uuidValidate(uniqueId);
  console.log(isValid);
}

main();
```

Then run the <kbd>npm run start</kbd> command again and you will see the result of the uuidValidate method is output as true. If the value passed into the uuidValidate function is not a valid uuid the output will be false.

### Detect uuid RFC version

After validation, if we have a valid uuid, the uuid npm package can also detect the version of a uuid string. Building off the index.js sample code add another import to access the uuid version function and test the uniqueId that is generated like this:

```typescript
import { v4 as uuidv4 } from "uuid";
import { validate as uuidValidate } from "uuid";
import { version as uuidVersion } from "uuid";

function main() {
  const uniqueId = uuidv4();
  console.log(uniqueId);

  const isValid = uuidValidate(uniqueId);
  console.log(isValid);

  const version = uuidVersion(uniqueId);
  console.log(version);
}

main();
```

Now when we run the index.js script we can see the version of the uniqueId that is generated is output as "4", matching the uuidv4 version we imported initially. If the uuidVersion function is not passed a valid uuid an error will be thrown, so it can be helpful to wrap this function in a try/catch block to capture any errors.

```typescript
import { v4 as uuidv4 } from "uuid";
import { validate as uuidValidate } from "uuid";
import { version as uuidVersion } from "uuid";

function main() {
  const uniqueId = uuidv4();
  console.log(uniqueId);

  const isValid = uuidValidate(uniqueId);
  console.log(isValid);

  try {
    const version = uuidVersion(uniqueId);
    console.log(version);
  } catch (error) {
    console.log(error);
  }
}

main();
```

This way any resulting error can be output to the console, or handled in a way that is best for the current usage.

### Generate NIL uuid

If you need to generate a NIL uuid, or a uuid that is entirely zeros, the uuid npm package provides the NIL_UUID as an export. Adding it to the index.js sample script looks like this:

```typescript
import { v4 as uuidv4 } from "uuid";
import { validate as uuidValidate } from "uuid";
import { version as uuidVersion } from "uuid";
import { NIL as NIL_UUID } from "uuid";

function main() {
  const uniqueId = uuidv4();
  console.log(uniqueId);

  const isValid = uuidValidate(uniqueId);
  console.log(isValid);

  try {
    const version = uuidVersion(uniqueId);
    console.log(version);
  } catch (error) {
    console.log(error);
  }

  console.log(NIL_UUID);
}

main();
```

I haven't come across a use case where a NIL uuid is needed, but it is provided in the uuid npm package so I'm sure there are plenty.

The uuid npm package is a helpful utility to generate a unique id with Node.js that saves a lot of the potential headache from generating one from scratch, while also ensuring the value are unique, secure, and matching a specific RFC version.
