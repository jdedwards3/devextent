---
title: Split a TypeScript Array into Chunks with a Generic Reduce Method
author: James Edwards
metaDescription: Split a TypeScript array into smaller individual chunks with the reduce method to prevent the EMFILE error from crashing the node.js process.
guid: 6381b596-958b-4a9f-b1a7-862d250d4831
tags:
  - Node.js
  - TypeScript
---

Running too many asynchronous processes simultaneously with Node.js can cause issues that will lead to the process crashing. An example of this is when reading files inside of an asynchronous callback function that is being executed using the [map() method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) on an array. To prevent a scenario where the node.js process might crash with an [EMFILE error](https://nodejs.org/api/errors.html#errors_common_system_errors), it can be helpful to split an array into smaller arrays or chunks, and process the group of smaller arrays synchronously while asynchronously mapping over the items in each of the smaller arrays. By doing this the contents of the original array can be processed in batches, preventing an error caused by opening too many files at once in parallel. The following configuration will allow us to demonstrate the EMFILE error and then add code to split an array into chunks, batching the process, and preventing the error from occurring.

### Setup Node.js and npm package.json

Make sure to have [node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed before following these steps. Then run the command <kbd>npm init</kbd> and follow the prompts to create a package.json file. Once the package.json file is created add the setting:

```json
{
  "type": "module"
}
```

This will permit the use of [ECMAScript modules](https://nodejs.org/api/esm.html) in the code, specifically it will allow for the use of [es module imports](https://nodejs.org/api/esm.html#esm_import_specifiers) from npm packages. After that we need to install TypeScript, so run the command <kbd>npm install typescript --save</kbd> and then run the command <kbd>npm install @types/node --save-dev</kbd>. At this point also go ahead and add a new script property called "start", that will [initiate the TypeScript compiler and run the JavaScript output with Node.js](/npm-compile-typescript).

The package.json file should look similar to this:

```json
{
  "type": "module",
  "name": "splitarrayintochunks",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "tsc && node index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@types/node": "^14.14.22"
  },
  "dependencies": {
    "typescript": "^4.1.3"
  }
}
```

### Setup TypeScript

After configuring Node.js, add a tsconfig.json file to same folder as the package.json file. This lets us use TypeScript, which we just installed, instead of JavaScript and as a result we get the advantage of [generic types](https://www.typescriptlang.org/docs/handbook/generics.html) among other features. Copy this config into the tsconfig.json file:

```json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "strict": true,
    "module": "esnext",
    "lib": ["ES2019"],
    "moduleResolution": "node",
    "skipLibCheck": true
  },
  "include": ["*.ts"],
  "exclude": ["node_modules/**/*"]
}
```

Now the output of the TypeScript compilation, indicated in the tsconfig "module" field, will be created as ECMAScript modules, which matches the type field added to the package.json configuration.

### Node.js EMFILE Error When Reading Files

The configuration steps are now complete and we can add some code that will demonstrate the EMFILE error that can be prevented by batch processing the array in smaller chunks. This sample code, that results in an error, can be added to index.ts.

```typescript
import fs from "fs";
import util from "util";
const readFile = util.promisify(fs.readFile);

(async function main() {
  //an array containing ten thousand undefined items
  const originalArray = Array.from(Array(10000));

  try {
    // awaiting all ten thousand promises simultaneously
    await Promise.all(
      originalArray.map(async () => {
        const file = await readFile("./data.json", "utf8");
        console.log(file);
      })
    );
  } catch (error) {
    console.log(error);
  }
})();
```

At this point also create a sample [JSON](https://www.json.org/json-en.html) file referenced in the code above named "data.json". All that you need to add to this file is "{}" which will be interpreted as an empty JSON object. With the data file created run the command <kbd>npm run start</kbd> and as expected you should see an error in the console:

```bash
[Error: EMFILE: too many open files, open '/../../data.json'] {
  errno: -4066,
  code: 'EMFILE',
  syscall: 'open',
  path: '/../../data.json'
}
```

What is occurring is that we are trying to asynchronously read the data.json file ten thousand times all at once, and the error is informing us that there are too many [file descriptors](https://en.wikipedia.org/wiki/File_descriptor) for the system that the code is being run on. The access to the data.json file is happening too frequently for the system to keep track of and as a result the process crashes.

Rather than trying all ten thousand file read attempts at once, the array can be split into chunks and the read requests can be processed in batches, ensuring the number total number of file descriptors is within a suitable limit for the system that Node.js is operating on. To do this we can create a generic TypeScript function that will split any type of array into chunks of the original array type.

### TypeScript Generic Reducer to Split Array Into Chunks

In the index.ts file, and above the main function that is immediately invoked we can create another function named "chunkItems". This will utilize TypeScript generics to create an array containing groups of smaller arrays, that match the type of the original array.

```typescript
const chunkItems = <T>(items: T[]) =>
  items.reduce((chunks: T[][], item: T, index) => {
    const chunk = Math.floor(index / 512);
    chunks[chunk] = ([] as T[]).concat(chunks[chunk] || [], item);
    return chunks;
  }, []);
```

The [reduce() method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) is used to create an array containing chunks of smaller arrays, and for this example the chunk size is set to be a limit of 512 items per chunk. This way the maximum number of file descriptors that can be allocated at once, is below the default limit of most systems. Now we can use the generic "chunkItems" function to create a batched process by wrapping the existing file read code in a [for...of loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of), so that each of the [Promise.all()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) results can be awaited asynchronously.

Putting all the code together in the index.ts file looks like this:

```typescript
import fs from "fs";
import util from "util";
const readFile = util.promisify(fs.readFile);

const chunkItems = <T>(items: T[]) =>
  items.reduce((chunks: T[][], item: T, index) => {
    const chunk = Math.floor(index / 512);
    chunks[chunk] = ([] as T[]).concat(chunks[chunk] || [], item);
    return chunks;
  }, []);

(async function main() {
  const originalArray = Array.from(Array(10000));
  const chunks = chunkItems(originalArray);
  try {
    for (const chunk of chunks)
      await Promise.all(
        chunk.map(async (item, index) => {
          const file = await readFile("./data.json", "utf8");
          console.log("-----start item------");
          console.log("current array chunk:" + chunks.indexOf(chunk));
          console.log("file contents: " + file);
          console.log("current item index: " + index);
          console.log("-----end item-------");
        })
      );
  } catch (error) {
    console.log(error);
  }
})();
```

Run the <kbd>npm run start</kbd> command again, and the EMFILE error will not occur. The output of the above code will display rather quickly, but it will show the index of each chunk currently being processed synchronously and the contents of the sample data.json file. Watching closely (or by stopping the output after it has ran for sometime), you can see that the chunk index goes in numerical order, but the intentionally limited number of file reads is still happening asynchronously and the current item indexes are not in numerical order. By splitting the array into smaller chunks the system is not overloaded and Node.js is able to process the files asynchronously.
