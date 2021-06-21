---
title: Import and Export ES Modules in Node.js using TypeScript with Babel Compilation
metaDescription: Use ES Modules in Node.js without an experimental flag by configuring Babel and TypeScript to support ES Module import and export syntax.
author: James Edwards
tags:
  - Node.js
  - TypeScript
  - Babel
  - ES Modules
guid: e9753917-e598-424e-8b9c-088ec64d5565
image: import-es-modules-in-nodejs-with-typescript-and-babel.png
---

As of Node.js version 13.2.0 ECMAScript modules are now supported by default without adding an experimental flag. Although, using ES Modules without making the required configuration changes will result in the error "SyntaxError: Cannot use import statement outside a module". This is because Node.js, by default, is expecting the [CommonJS module](https://nodejs.org/docs/latest/api/modules.html) format.

Using TypeScript in combination with ES Modules brings many added benefits. To use TypeScript with ES Modules, the TypeScript compiler configuration in [tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) can be updated to process code in ES Module format. Additionally, [Babel](https://babeljs.io/) can be used for TypeScript compilation, and the TypeScript compiler will be used for type checking, as Babel can not type check TypeScript code. Once the TypeScript code is being compiled by Babel into JavaScript, retaining the ES Module format, the ES Modules can be exported, imported, and run with Node.js.

### package.json Type Module

The first configuration change we can make, to use ES Modules in Node.js is configuring the package.json file to include the type module property value. To do this add the following code to the package.json file in your Node.js project:

```json
{
  "type": "module"
}
```

If you are starting a new project you can run the command <kbd>npm init</kbd> in a terminal window, follow the prompts that follow, and a package.json file will be generated in the current project folder. Although, before doing so make sure to have [Node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed. Once the package.json file is added to your project then add the extra configuration shown above as the <kbd>npm init</kbd> command does not generate a package.json file with this ES Module setting pre-configured.

### npm install

We will also be using some additional npm packages to carry out the compilation and type checking processes.

- [cross-env](https://www.npmjs.com/package/cross-env)
- [@babel/cli](https://www.npmjs.com/package/@babel/cli)
- [@babel/core](https://www.npmjs.com/package/@babel/core)
- [@babel/preset-env](https://www.npmjs.com/package/@babel/preset-env)
- [@babel/preset-typescript](https://www.npmjs.com/package/@babel/preset-typescript)
- [rimraf](https://www.npmjs.com/package/rimraf)
- [typescript](https://www.npmjs.com/package/typescript)

Before proceeding run the command <kbd>npm install cross-env @babel/cli @babel/core @babel/preset-env @babel/preset-typescript rimraf typescript --save</kbd>. This will install the npm packages in the project "node_modules" folder and create a package-lock.json file. The npm packages are now available for usage in the project. Since we are using TypeScript, we can also run the command <kbd>npm install @types/node --save-dev</kbd> which will install the Node.js type definitions as a devDependency.

### Configure TypeScript compiler to use ES Module format

Using ES Modules does not require the use of TypeScript, however the overhead of including TypeScript is minimal and including it provides many benefits such as static typing, which can enable code editors or an [IDE](https://en.wikipedia.org/wiki/Integrated_development_environment) to offer more predictive assistance. You may have heard referred to as intellisense or [intelligent code completion](https://en.wikipedia.org/wiki/Intelligent_code_completion). In the same folder as the package.json add a new file named "tsconfig.json" containing this configuration:

```json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "strict": true,
    "module": "esnext",
    "lib": ["ES2019"],
    "noEmit": true,
    "moduleResolution": "node",
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules/**/*", "dist/**/*"]
}
```

More info on tsconfig settings can be found in the [TSConfig reference](https://www.typescriptlang.org/tsconfig) provided by Microsoft. The most important compiler option included is setting the "module" property to "esnext". This informs the TypeScript compiler to recognize source code in the ES Module format as well as retain the format when generating JavaScript code.

Since Babel will be configured to do the compilation of TypeScript into JavaScript the "noEmit" property is set to true, and what this does is allow for the use of the TypeScript compiler only to indicate when there are type checking errors. When configured this way the [tsc compile command](https://www.typescriptlang.org/docs/handbook/compiler-options.html) will not generate any JavaScript code, but it will output any errors that would occur during compilation to the console. It is also recommended, when [using TypeScript with the Babel compiler](https://www.typescriptlang.org/docs/handbook/babel-with-typescript.html), to set the "allowSyntheticDefaultImports" and "isolatedModules" to true as this ensures that the TypeScript compiler will process source code similar to how the Babel compiler does. This way the type checking and compilation configurations are in sync, even though separate steps are responsible for each.

### Configure Babel to compile TypeScript into ES Modules

With TypeScript configured, we can add the Babel configuration that enables TypeScript compilation with the Babel compiler. To do this create a new file in the same folder as the tsconfig.json file named ".babelrc.json" and add this configuration:

```json
{
  "presets": [
    ["@babel/preset-env", { "modules": false, "targets": { "node": true } }],
    ["@babel/preset-typescript"]
  ],
  "ignore": ["node_modules"],
  "comments": false,
  "minified": true
}
```

This will configure Babel to use the [preset-typescript](https://babeljs.io/docs/en/babel-preset-typescript) and [preset-env](https://babeljs.io/docs/en/babel-preset-env) when generating JavaScript code. The presets are executed in a bottom to top order, meaning that first Babel will compile the TypeScript into JavaScript and then on the resulting JavaScript code the preset-env configuration will be applied. This is where Babel is configured to use ES Modules as the "modules" setting is set to false, which is somewhat confusing because ES Modules are being used. It is necessary to set this to false otherwise Babel will use the default CommonJS module format for Node.js. Additionally the compilation target is set to Node so that Babel can apply code transforms that ensure the code will be able to run in the LTS version of Node.js.

In this example there are two extra babel settings included that instruct the Babel compiler to remove any comments in the source code and minify the JavaScript output. These can be removed if not desired for your use case, however this is beneficial for using in production to minimize code size.

### Export ES Module

Now we can add some sample TypeScript code to test out the configuration changes.

In the same project folder create a new folders named "src", so that the file structure matches the "include" pattern in the tsconfig.json file. Then in the "src" folder create a new file named "helpers.ts" and place the following code in it:

```typescript
function log(value: string) {
  console.log(value);
}

export { log };
```

This code is only logging the value that is passed in to the console, and is not really representative of actual code that would be used, but it allows for the demonstration of using ES Modules with TypeScript and Babel. The export of the "log" function is the key item to notice about this code, as this is all that is needed to export an ES Module. Now we can create another file to import the "log" helper function module.

### Import ES Module

In the same "src" folder create a new file named "index.ts" this will be the main entry point for our ES Module code. Once that file is created add in this TypeScript code to import the helper function that was created in the previous step.

```typescript
import { log } from "./helpers.js";

function main() {
  log("testing es modules");
}

main();
```

Similar to the helpers.ts file the index.ts files is mainly for demonstrating ES Module import syntax. It imports the helper function and then the main function is called to execute the "log" function. Although it is important to note that the file imported must end with a ".js" file extension rather than a ".ts" file extension. This is because when the code is eventually compiled the ES Module code will be a JavaScript file. Make sure that anytime a module is imported from a separate file the path is relative to the current file and the extension is set to ".js", otherwise both the TypeScript compiler and Babel compiler will not be able to resolve the file location.

### Run ES Modules in Node.js

At this point the source code is configured to run with ES Modules, so we can now look at how to compile the code and run it with Node.js. To do this we'll need to add six additional scripts to the "scripts" property in the package.json file.

In the package.json "scripts" property add the following:

```json
{
  "clean": "rimraf dist",
  "compile": "cross-env-shell babel src -d dist --source-maps --extensions '.ts'",
  "build": "npm run clean && npm run compile",
  "typecheck": "tsc --p .",
  "build-typecheck": "npm run typecheck && npm run build",
  "start": "npm run build-typecheck && node ./dist/index.js"
}
```

The "clean" script will ensure that prior to the compilation, the output directory "dist" will be deleted. This way the latest code will copied into an empty folder.

The "compile" script is where the cross-env package is used to run the babel compilation command. This babel compilation command specifies that the source files will be located in the "src" folder and when compilation is complete the JavaScript output will be copied to a folder named "dist". The flags that are passed in indicate that source maps should be generated for debugging purposes and also the "--extensions" flag is required so that Babel will look for files ending with the ".ts" extension.

To use the "clean" and "compile" script sequentially they are combined in a new script named "build", which can be run using the command <kbd>npm run build</kbd>. This will remove the old files from the "dist" folder and compile the TypeScript source code with Babel, however no typechecking errors will be indicated and Babel may fail to compile the code if there are errors present.

To resolve this an additional script "typecheck" is included that will pass the TypeScript source code through the TypeScript compiler, and if there are errors present, they will be output to the console. Since the tsconfig.json settings include the "noEmit" property the typecheck command won't output any JavaScript code.

The command that will be most commonly used is the "build-typecheck" command, which can be used by running <kbd>npm run build-typecheck</kbd>. This will sequentially run the "typecheck" command and then if there are no errors present as a result of the TypeScript compilation with the TypeScript compiler, the "build" command will be executed, invoking the Babel compiler and generating JavaScript code that can be run by Node.js in ES Module format.

Since the JavaScript code is being output to a folder named "dist" the "main" property in the package.json should be changed to:

```json
{
  "main": "./dist/index.js"
}
```

To run the compiled JavaScript code, execute the command <kbd>npm run start</kbd> and this will carry out the type checking and compilation steps as well as run the index.js file with Node.js. If everything is setup and working as expected you should see the value included in the "main" function - "testing es modules" output to the console. Now you can use this configuration to create node modules that are statically typed and run in Node.js using the ES Module format.
