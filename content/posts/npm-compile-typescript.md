---
title: Compile TypeScript with npm
metaDescription:
  Configure the TypeScript compiler with tsconfig.json, and compile TypeScript
  into JavaScript using tsc command, Node.js, and npm package.json scripts.
guid: 5ae4feed-1cee-469b-837d-5dbe38ae0227
author: James Edwards
tags:
  - TypeScript
  - Node.js
image: npm-compile-typescript.png
imageAlt: Compile TypeScript into JavaScript
---

Npm package.json scripts can be used to run various commands. Here, we will learn how to run the TypeScript compiler to generate JavaScript output from TypeScript source files. Before we start, make sure you have [Node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed.

## TypeScript

In a new folder, create a file named script.ts. Then, add some sample code so we can test whether the JavaScript output is being generated properly.

```typescript
const msg: string = "Hello World!";
console.log(msg);
```

## TypeScript Compiler

In the same folder, create a new file named tsconfig.json. Here is the TypeScript official documentation for configuring [tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).

Your tsconfig.json file should look like this:

```json
{
  "compilerOptions": {
    "outDir": "output"
  },
  "include": ["./*"],
  "exclude": ["node_modules"]
}
```

This configuration tells the TypeScript compiler to look for source files in the root of your project, where your tsconfig.json is located. For any TypeScript files it finds there, it will output the compiled JavaScript to a new folder named output.

## package.json

In the same folder create a package.json file. Here is the npm official documentation on creating a [package.json](https://docs.npmjs.com/creating-a-package-json-file) file.

Then, add the name and version properties required. You will also need to add a property called scripts. This property contains the script instructions that we will use to compile the TypeScript we created. In this case, our compilation script is named compile-typescript, and it runs the command tsc. This is the default TypeScript command, and it will utilize the tsconfig.json we created.

Your package.json file should look like this:

```json
{
  "name": "package-name-goes-here",
  "version": "0.0.0",
  "scripts": {
    "compile-typescript": "tsc"
  }
}
```

Now that package.json is created and the TypeScript compilation step is listed, we must save TypeScript as a dev dependency. This will give the npm task access.

## npm Install TypeScript

To install TypeScript for this project in a terminal window, run the command: <kbd>npm install typescript --save-dev</kbd>

After installing TypeScript, your package.json should look like this:

```json
{
  "name": "package-name-goes-here",
  "version": "0.0.0",
  "scripts": {
    "compile-typescript": "tsc"
  },
  "devDependencies": {
    "typescript": "^3.5.3"
  }
}
```

## JavaScript

In a terminal window, navigate to the source code folder you created. Then, run the following command: <kbd>npm run compile-typescript</kbd>

Now, you should now see a new folder created named output, that contains one file named script.js. Notice how the output has defaulted to ES5 JavaScript, which is compatible with all major browsers.

Your script.js file should look like this:

```typescript
var msg = "Hello World";
console.log("msg");
```

## Run Node.js Script

The script.js created as a result of running the "compile-typescript" command can now be run with Node.js. To do this another package.json script is added, which is named "start". The "start" script will run the node cli command which the path of the script.ts file is passed.

```json
{
  "name": "package-name-goes-here",
  "version": "0.0.0",
  "scripts": {
    "compile-typescript": "tsc",
    "start": "node ./output/script.js"
  },
  "devDependencies": {
    "typescript": "^3.5.3"
  }
}
```

Run the start command by entering <kbd>npm run start</kbd> in a terminal window, and you should see the output "Hello World!" printed to the console.

## Run npm Scripts Sequentially

To save time the "compile-typescript" and "start" commands can be combined into one command by modifying the start command to include this functionality.

```json
{
  "name": "package-name-goes-here",
  "version": "0.0.0",
  "scripts": {
    "compile-typescript": "tsc",
    "start": "npm run compile-typescript && node ./output/script.js"
  },
  "devDependencies": {
    "typescript": "^3.5.3"
  }
}
```

Now running the command <kbd>npm run start</kbd> will first run the "compile-typescript" command and then use node to run the script.js file that is output.
