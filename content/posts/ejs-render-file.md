---
title: Render EJS file with Node.js
metaDescription:
  Generate an HTML file using Node.js, Typescript, and npm package.json scripts
  to render an EJS template file.
author: James Edwards
guid: 11478bbe-6200-4ad4-8bfe-10adb215f472
tags:
  - EJS
  - Node.js
  - TypeScript
---

[EJS](https://ejs.co/) is a templating language that uses JavaScript to generate
HTML. This post will illustrate how to use Node.js with TypeScript to render an
EJS file into HTML markup. Please make sure you have
[Node.js](https://nodejs.org/en/) and
[npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
installed first. If you are unfamiliar with Typescript please read my post
describing how to [compile TypeScript with npm](/npm-compile-typescript/).

## EJS

Begin by creating a new EJS file named index.ejs. This file will be the template
used to generate index.html. If the model is passed into the template it will
render the content as a paragraph.

```ejs
<!-- Sample Page -->

<h1>Sample Page</h1>

<%% if (model) { %%>
  <%%= model.content %%>
<%% } %%>
```

## package.json

If you don't already have a package.json created you can create one by running
the command <kbd>npm init</kbd> and following the prompts.

You will need your package.json to include these packages:

```json
{
  "name": "package-name-goes-here",
  "version": "0.0.0",
  "devDependencies": {
    "@types/ejs": "^2.6.2",
    "@types/node": "^11.9.4",
    "ejs": "^2.6.1",
    "typescript": "^3.3.3333"
  }
}
```

You can also copy the devDependencies section and run the command <kbd>npm
install</kbd> instead of installing one at a time.

## Node.js

Create a new TypeScript file named render.ts. Then add the following code to
import the modules that we will use.

```typescript
//imports
import util = require("util");
import fs = require("fs");
import ejs = require("ejs");
//promisify
const mkdir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
```

The first import is the [util](https://nodejs.org/api/util.html) module so that
we can use the
[promisify](https://nodejs.org/dist/latest-v8.x/docs/api/util.html#util_util_promisify_original)
function. Then import the [fs](https://nodejs.org/api/util.html) module for file
system access. Before using three of the functions from the fs module we can
promisify them allowing for the use of async/await instead of nested callbacks.
The last is for EJS, and since the render file function returns a promise by
default we do not need to use promisify.

Below the import statements add an async function named render. This is where
the HTML output will be generated and written to a file named index.html. It
needs to be marked as an async function so that the keyword await can be used.
Then make sure to call the function so the code that is about to be added will
execute.

```typescript
async function render() {
  try {
  } catch (error) {
    console.log(error);
  }
}
render();
```

Before rendering our EJS file we will need a folder to put the output. So add
the following to our render function:

```typescript
await mkdir("dist", { recursive: true });
```

This will create a new directory named dist where the html output will be saved.
By passing the recursive property we can ensure parent folders are created even
if none are necessary. After creating the dist folder we can use EJS to render
the index.ejs template to HTML. The resulting HTML string is then written to a
file named index.html in the dist folder.

At this point your index.ts file should look like this:

```typescript
//imports
import util = require("util");
import fs = require("fs");
import ejs = require("ejs");
//promisify
const mkdir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
async function render() {
  try {
    //create output directory
    await mkdir("dist", { recursive: true });

    //render ejs template to html string
    const html = await ejs
      .renderFile("index.ejs", { model: false })
      .then((output) => output);
    //create file and write html
    await writeFile("dist/index.html", html, "utf8");
  } catch (error) {
    console.log(error);
  }
}
render();
```

In order to run this script we need to add a tsconfig.json file to configure the
TypeScript compiler. This will compile the TypeScript into JavaScript so that it
can be used by node.js. Add the tsconfig file to the same folder as the
render.js script.

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "rootDir": "./",
    "outDir": "./dist",
    "sourceMap": true
  },
  "include": ["render.js"]
}
```

We also need to add a script to the package.json file created earlier. This
script will compile render.ts and then run it using node. Your package.json
should look like this:

```json
{
  "name": "package-name-goes-here",
  "version": "0.0.0",
  "scripts": {
    "render": "tsc && node dist/render.js"
  },
  "devDependencies": {
    "@types/ejs": "^2.6.2",
    "@types/node": "^11.9.4",
    "ejs": "^2.6.1",
    "typescript": "^3.3.3333"
  }
}
```

## EJS render HTML

The render script can be run in a terminal window by typing the command <kbd>npm
run render</kbd>. Make sure to run this command from the directory where your
package.json is located. After running the render script you should now see a
folder named dist containing a file named index.html.

The contents of index.html should look like this:

```html
Sample Page
```

Notice that the conditional block containing the model content, in the index.ejs
template, is not included in the html output. This is because in the render
script the model was passed in as false. Now we'll create an object to pass in
as the model with some sample content to the sample page.

In the render.ts file previously created, after the import statements, create an
object and add a property to it called content with the value set to a sample of
content.

```typescript
const pageModel = {
  content: "This is some sample content. Located on the sample page.",
};
```

Then pass this object in to the ejs.renderFile function instead of false. The
render.ts file should look like this:

```typescript
//imports
import util = require("util");
import fs = require("fs");
import ejs = require("ejs");
//promisify
const mkdir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const pageModel = {
  content: "<p>This is some sample content. Located on the sample page.</p>",
};
async function render() {
  try {
    //create output directory
    await mkdir("dist", { recursive: true });

    //render ejs template to html string
    //pass pageModel in to render content
    const html = await ejs
      .renderFile("index.ejs", { model: pageModel })
      .then((output) => output);
    //create file and write html
    await writeFile("dist/index.html", html, "utf8");
  } catch (error) {
    console.log(error);
  }
}
render();
```

With the model object passed into the template we should now see the conditional
block rendered in the index.html output file. Run the command <kbd>npm run
render</kbd> once more.

The index.html file in the dist folder should now look like this:

```html
<h1>Sample Page</h1>
<p>This is some sample content. Located on the sample page.</p>
```

The index.ejs template can now render dynamic HTML content according to the
model object configured in the render.ts file and by running <kbd>npm run
render</kbd> after each change to generate an updated index.html file.
