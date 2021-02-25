---
title: Use the Dart Sass JavaScript Implementation to Compile SASS with Node.js
guid: 9c077f28-c8bf-4d92-a35d-a014cbf4b5da
metaDescription: Compile a SCSS file into CSS with the sass npm package JavaScript API and command line interface provided by the Dart Sass JavaScript implementation.
author: James Edwards
tags:
  - SASS
  - Node.js
---

_This post is an updated version of a previous post containing instructions on [how to compile sass with the node-sass npm package](/npm-compile-sass/), which is now deprecated._

---

The [SASS team](https://sass-lang.com/community) now recommends using [Dart Sass](https://sass-lang.com/dart-sass) in favor of [LibSass](https://sass-lang.com/blog/libsass-is-deprecated) for new development projects. This means that the [sass](https://www.npmjs.com/package/sass) npm package should be used instead of the [node-sass](https://www.npmjs.com/package/node-sass) npm package, which is built on top of LibSass, to compile sass with Node.js. The sass npm package is a pure JavaScript implementation of Dart Sass. The Dart Sass JavaScript API strives to be compatible with the existing node-sass API, so that it can be integrated into existing workflows with minimal changes. This post will show how to install the Dart Sass Javascript implementation with npm and use it via the supported JavaScript API and the command line. Before proceeding make sure to have [Node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed.

### npm install sass

After installing Node.js and npm we can create a sample project to demonstrate the functionality of the sass npm package. To do this create a project folder and open it in a terminal window. Then run the command <kbd>npm init</kbd> and follow the prompts, which will create a package.json file. Then we can install the sass node module into the project, by running the command <kbd>npm install sass --save</kbd>.

We will also be using [ES Module](https://nodejs.org/api/esm.html) format for this example so the package.json requires an additional setting after generating. Add the "type" property to the package.json with the value set to "module", so that Node.js will use ES Modules rather than [CommonJS modules](https://nodejs.org/docs/latest/api/modules.html). Here is some additional information about how to [import and export ES Modules in Node.js](/import-es-modules-in-nodejs-with-typescript-and-babel/), which explains why this setting is necessary.

Your package.json file should now look like this:

```json
{
  "name": "npmsass",
  "type": "module",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "sass": "^1.32.8"
  }
}
```

### SCSS

The sass npm package is now installed, but in order to use it we will need a SCSS file. In the same project folder create a new file named "styles.scss" and place the following code inside:

```scss
/* This CSS will print because %message-shared is extended. */
%message-shared {
  border: 1px solid #ccc;
  padding: 10px;
  color: #333;
}

// This CSS won't print because %equal-heights is never extended.
%equal-heights {
  display: flex;
  flex-wrap: wrap;
}

.message {
  @extend %message-shared;
}

.success {
  @extend %message-shared;
  border-color: green;
}

.error {
  @extend %message-shared;
  border-color: red;
}

.warning {
  @extend %message-shared;
  border-color: yellow;
}
```

The above SCSS code is borrowed from the [Sass Basics](https://sass-lang.com/guide) guide and demonstrates one of the most useful features of Sass which is the [@extend](https://sass-lang.com/documentation/at-rules/extend) at-rule, to share a set of CSS properties among different selectors. Now that we have a SCSS file we can compile it to CSS using the sass npm package.

### Compile Sass with Dart Sass JavaScript API

To use the sass npm package JavaScript API, we need to create the index.js file that is set to the "main" property value in the package.json file, created in the first step. This will be the entry point for the Node.js process that will carry out the SASS compilation. In the same project folder create a new file named "index.js", and add the following code:

```javascript
import sass from "sass";
import { promisify } from "util";
const sassRenderPromise = promisify(sass.render);

async function main() {
  const styleResult = await sassRenderPromise({
    file: `${process.cwd()}/styles.scss`,
  });

  console.log(styleResult.css.toString());
}
main();
```

This code imports the sass package along with the [util.promisify](https://nodejs.org/api/util.html#util_util_promisify_original) module and converts the sass render function to use promises instead of the default callback implementation. This makes working with the asynchronous API of the sass npm package more manageable because it allows for the use of [async/await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) syntax.

After importing and "promisifying" the sass npm package, the main function contains the code to compile the styles.scss file into CSS. In order to run this code add the following the scripts property in the package.json file:

```json
{
  "start": "node index.js"
}
```

We can then execute the main function by running the command <kbd>npm run start</kbd>, and the css output will be logged to the console.

Instead of logging directly to the console it is much more useful to write the CSS output to a file. The sass npm package does not expose a JavaScript API to write a file directly, however it does support a configuration property to indicate which file the CSS output will be written to. By adding this configuration and using the [fs.writeFile](https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback) module the CSS can be written to an output to a file like this:

```javascript
import sass from "sass";
import { promisify } from "util";
import { writeFile } from "fs";
const sassRenderPromise = promisify(sass.render);
const writeFilePromise = promisify(writeFile);

async function main() {
  const styleResult = await sassRenderPromise({
    file: `${process.cwd()}/styles.scss`,
    outFile: `${process.cwd()}/styles.css`,
  });

  console.log(styleResult.css.toString());

  await writeFilePromise("styles.css", styleResult.css, "utf8");
}
main();
```

After running the <kbd>npm run start</kbd> command again, you should now see a styles.css file in the same project folder, that contains the compiled CSS output:

```css
/* This CSS will print because %message-shared is extended. */
.warning,
.error,
.success,
.message {
  border: 1px solid #ccc;
  padding: 10px;
  color: #333;
}

.success {
  border-color: green;
}

.error {
  border-color: red;
}

.warning {
  border-color: yellow;
}
```

### SASS Render Configuration Options

The sass npm package supports other render options including:

- sourceMap
- sourceMapContents
- outputStyle

These can be added by modifying the options object passed into the sass render function. When including a source map file, a separate file needs to be written to the project folder containing the sourcemap information. To add these options make the following changes to the index.js:

```javascript
import sass from "sass";
import { promisify } from "util";
import { writeFile } from "fs";
const sassRenderPromise = promisify(sass.render);
const writeFilePromise = promisify(writeFile);

async function main() {
  const styleResult = await sassRenderPromise({
    file: `${process.cwd()}/styles.scss`,
    outFile: `${process.cwd()}/styles.css`,
    sourceMap: true,
    sourceMapContents: true,
    outputStyle: "compressed",
  });

  console.log(styleResult.css.toString());

  await writeFilePromise("styles.css", styleResult.css, "utf8");

  await writeFilePromise("styles.css.map", styleResult.map, "utf8");
}
main();
```

Then run the <kbd>npm run start</kbd> command again and you should see the "styles.css" and "styles.css.map" files have both been updated.

The styles.css should now output with the blank spaces removed, and it will include a comment at the bottom to indicate the corresponding sourcemap file, which will look like this:

```json
{
  "version": 3,
  "sourceRoot": "",
  "sources": ["styles.scss"],
  "names": [],
  "mappings": "AACA,kCACE,sBACA,aACA,WAaF,SAEE,mBAGF,OAEE,iBAGF,SAEE",
  "file": "styles.css",
  "sourcesContent": [
    "/* This CSS will print because %message-shared is extended. */\r\n%message-shared {\r\n  border: 1px solid #ccc;\r\n  padding: 10px;\r\n  color: #333;\r\n}\r\n\r\n// This CSS won't print because %equal-heights is never extended.\r\n%equal-heights {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n}\r\n\r\n.message {\r\n  @extend %message-shared;\r\n}\r\n\r\n.success {\r\n  @extend %message-shared;\r\n  border-color: green;\r\n}\r\n\r\n.error {\r\n  @extend %message-shared;\r\n  border-color: red;\r\n}\r\n\r\n.warning {\r\n  @extend %message-shared;\r\n  border-color: yellow;\r\n}\r\n"
  ]
}
```

The sourcemap will allow for easier debugging and the browser will now load both files. In the debug inspector the browser will show the line in the SCSS source code that corresponds to the CSS output being inspected.

### Compile SASS using Dart Sass CLI

It is also possible to use the sass npm package directly from the command line. To do this with the same configuration as the example using the JavaScript API add the following the the package.json scripts property:

```json
{
  "scripts": {
    "compileSass": "sass styles.scss styles.css --style=compressed --embed-sources"
  }
}
```

This will add a package.json script to run the SASS compiler, by running the command <kbd>npm run compileSass</kbd>. To make sure it is working as expected you might want to delete the previously generated styles.css and styles.css.map files, before running the <kbd>npm run compileSass</kbd> command.

Using the sass npm package JavaScript API or command line interface, should result in the same output consisting of both the css and css.map files, as both methods rely on the JavaScript implementation of Dart Sass. The main difference is that when using the CLI option the files will automatically be written based on the input and output specified, but when using the JavaScript API we must use the fs.writeFile module to write these files to the project folder.
