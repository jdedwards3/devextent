---
title: Convert Markdown to HTML with Node.js
metaDescription: Convert a Markdown file into HTML, with code block syntax highlighting, using Node.js and asynchronously write the HTML string to a file.
guid: 3bce6e8d-b596-4d69-bb27-6e0d116b5efb
author: James Edwards
tags:
  - Markdown
  - HTML
  - TypeScript
  - Node.js
  - ES Modules
image: convert-markdown-to-html-nodejs.png
---

Unlike the name implies, [Markdown](https://en.wikipedia.org/wiki/Markdown) is a markup language that can be used to create rich text output while authoring content in a plain text editor without formatting. Like [HTML](https://en.wikipedia.org/wiki/HTML), Markdown includes a base syntax, however there is no formal specification for Markdown, like there is for HTML. As a result there are many [Markdown variants](https://www.iana.org/assignments/markdown-variants/markdown-variants.xhtml), with each providing their own syntax variations and specifications.

While there are some differences among the flavors of Markdown, one rather nice aspect of authoring content with Markdown is that it can be readily converted to HTML using one of the many markdown processing technologies that are available. One way that can facilitate the creation of a website's HTML files, while still authoring content in Markdown, is to use Node.js to convert Markdown content into an HTML file. The resulting HTML output can then be uploaded to Jamstack website hosting, using static HTML files.

In this post we'll use Node.js and CLI commands to read a Markdown file, convert that file to an HTML string and then write the HTML string to a new file. When we have the file created, we can start a local development server to test the file in a web browser. Before following the steps make sure to have [Node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed.

### Setup Node.js CLI Project

To start, setup the package.json file used with Node.js by running the command <kbd>npm init</kbd> in a terminal window open to your project folder. Then follow the prompts shown by the npm init process and a package.json file should have been created. With the package.json file in place we can run additional commands to install the npm packages that are used to convert Markdown to HTML.

#### npm install

In the same terminal window run the command <kbd>npm install markdown-it highlight.js fs-extra cross-env rimraf @babel/cli @babel/core @babel/preset-env @babel/preset-typescript --save</kbd>, followed by the command <kbd>npm install typescript @types/node @types/markdown-it @types/fs-extra --save-dev</kbd>.

After running both of these commands a new folder named "node_modules" should be present in your project folder. In the "node_modules" folder the following npm packages are installed:

- [markdown-it](https://www.npmjs.com/package/markdown-it)
- [highlight.js](https://www.npmjs.com/package/highlight.js)

#### Add Support For ES Modules

For this example these packages are also installed, mostly to support using [TypeScript](https://www.typescriptlang.org/) and [ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) in Node.js, which is optional.

- [fs-extra](https://www.npmjs.com/package/fs-extra)
- [typescript](https://www.npmjs.com/package/typescript)
- [cross-env](https://www.npmjs.com/package/cross-env)
- [rimraf](https://www.npmjs.com/package/rimraf)
- [@babel/cli](https://www.npmjs.com/package/@babel/cli)
- [@babel/core](https://www.npmjs.com/package/@babel/core)
- [@babel/preset-env](https://www.npmjs.com/package/@babel/preset-env)
- [@babel/preset-typescript](https://www.npmjs.com/package/@babel/preset-typescript)
- [@types/fs-extra](https://www.npmjs.com/package/@types/fs-extra)
- [@types/markdown-it](https://www.npmjs.com/package/@types/markdown-it)
- [@type/node](https://www.npmjs.com/package/@types/node)

The remainder of these steps will include setting up the TypeScript and [Babel](https://babeljs.io/) compilers to [use ES Modules in Node.js](/import-es-modules-in-nodejs-with-typescript-and-babel/) for the CLI script that will convert Markdown into HTML, and write the HTML string to a file.

To support ES modules there is one more configuration that must be included in the package.json file. This is the "type" property with the value set to "module" as indicated below.

```json
{
  "type": "module"
}
```

#### package.json Scripts

Additionally, we need to configure the "scripts" section of the package.json file to include the npm CLI scripts that will be used in the following steps. Since we are modifying the package.json file at this time go ahead and also add the following to the scripts property:

```json
{
  "scripts": {
    "typecheck": "tsc --p .",
    "clean": "rimraf dist",
    "compile": "cross-env-shell babel src -d dist --source-maps --extensions '.ts'",
    "start": "npm run clean && npm run compile && node ./dist/index.js",
    "start-typecheck": "npm run typecheck && npm run start"
  }
}
```

These scripts are responsible for invoking the TypeScript and Babel compilers, to carry out typechecking and the compilation of TypeScript into JavaScript. These use most of the optional packages that were installed for that process. In a later step we can run these package.json scripts as CLI commands to first compile TypeScript and then run the JavaScript output with Node.js to convert Markdown into HTML.

#### package.json

With all the required packages installed and ES modules configured, the package.json file in your project should look like this:

```json
{
  "name": "convertmarkdowntohtml",
  "type": "module",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "typecheck": "tsc --p .",
    "clean": "rimraf dist",
    "compile": "cross-env-shell babel src -d dist --source-maps --extensions '.ts'",
    "start": "npm run clean && npm run compile && node ./dist/index.js",
    "start-typecheck": "npm run typecheck && npm run start"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@babel/cli": "^7.14.8",
    "@babel/core": "^7.14.8",
    "@babel/preset-env": "^7.14.9",
    "@babel/preset-typescript": "^7.14.5",
    "cross-env": "^7.0.3",
    "fs-extra": "^10.0.0",
    "highlight.js": "^11.2.0",
    "markdown-it": "^12.2.0",
    "rimraf": "^3.0.2"
  },
  "devDependencies": {
    "@types/fs-extra": "^9.0.12",
    "@types/markdown-it": "^12.0.3",
    "@types/node": "^16.4.10",
    "typescript": "^4.3.5"
  }
}
```

If you are having trouble with the package install try copying the package.json from above and save that as your package.json file, then run the command <kbd>npm install</kbd> to install all of the listed packages.

#### Configure TypeScript Compiler with tsconfig.json

TypeScript is not required to convert Markdown to HTML, but it is not that much extra configuration to add when compared to the benefits of using TypeScript. Since the npm package for TypeScript was just installed we can add a new file to the project folder named "tsconfig.json" and this will contain the [TypeScript compiler configuration settings](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) that are recommended when [using TypeScript and Babel](https://www.typescriptlang.org/docs/handbook/babel-with-typescript.html) in the same project.

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

The configuration will use TypeScript for type checking only, and the actual compilation of TypeScript into JavaScript will instead be carried out by the Babel compiler.

#### Configure Babel Compiler with babel.config.json

Just as the tsconfig.json file was added, we can add another file for the [Babel configuration settings](https://babeljs.io/docs/en/configuration). This file is named "babel.config.json" and contains the following:

```json
{
  "presets": [
    [
      "@babel/preset-env",
      { "modules": false, "targets": { "node": "current" } }
    ],
    ["@babel/preset-typescript"]
  ],
  "ignore": ["node_modules"]
}
```

The Babel compiler does not type check TypeScript code and will attempt to output valid JavaScript regardless of the TypeScript source. This is why the TypeScript compiler is used for type checking, and the benefit of using both is that the Babel compiler has [presets](https://babeljs.io/docs/en/presets/) available to ensure that the JavaScript generated will target a specific environment, in this case the current version of Node.js, and the "[modules](https://babeljs.io/docs/en/babel-preset-env#modules)" property is set to false, which will preserve ES modules.

### Create Markdown File

With our Node.js CLI project setup and package.json scripts already configured, the next part of the process to convert Markdown into HTML will be to create a sample Markdown file with a variety of content that includes the basic syntax shared among most Markdown flavors. To do this create a new folder for your project, named "content" and then inside the "content" folder create a new file named "index.md". When you have the index.md file created you can copy the sample Markdown content below into it.

````markdown
# H1

## H2

### H3

#### H4

**bold text**

_italicized text_

> blockquote

1. First item
2. Second item
3. Third item

- First item
- Second item
- Third item

`code`

---

```javascript
function() {
  console.log("This is some javascript included in a markdown code block, and it will be converted to valid HTML with code syntax highlighting.");
}
```

<kbd>this is a keyboard input html element</kbd>

```html
<span>this will remain html even after the Markdown is converted to HTML</span>
```

[Dev Extent](https://www.devextent.com)

![Dev Extent](https://www.devextent.com/images/devextent.png)
````

### Create Node.js CLI Script

Now that there is a Markdown file in the project we can add a new folder named "src" and in that folder add a new file named "index.ts". This is the Node.js script responsible for converting the Markdown file into an HTML file, and to start it looks like this:

```typescript
(async function convertMarkdownToHtml() {
  console.log("Converting Markdown to HTML...");
})();
```

You can now run the command <kbd>npm run start-typecheck</kbd> or <kbd>npm run start</kbd> to compile without typechecking and you should see the console log is displayed. This means that the Node.js CLI project is working correctly, first compiling the TypeScript source code and then executing the generated JavaScript output with Node.js, all in one command.

### Read Markdown File

After verifying that the Node.js CLI script is working correctly go ahead and add this code:

```typescript
import fs from "fs-extra";

(async function convertMarkdownToHtml() {
  console.log("Converting Markdown to HTML...");

  // markdown source
  const content = await fs.readFile("./content/index.md", "utf8");
})();
```

The additional code imports one node module, the fs-extra package, and it provides the "readFile" function to asynchronously read the "index.md" file in the content folder. The contents of the Markdown file are then assigned to the variable named "content". We now have a string of Markdown content that is ready to be converted into HTML, and to do that the markdown-it package will be used.

### Configure markdown-it Markdown Parser Options

To configure the markdown parser included in the markdown-it package, create a new folder in the "src" folder named "utils" and then in the "utils" folder create a new TypeScript file named "markdown.ts". In the "markdown.ts" the markdown-it package will be imported and the markdown parser object will be constructed and exported.

```typescript
import MarkdownIt from "markdown-it";

const markdown: MarkdownIt = MarkdownIt({
  html: true,
});

export { markdown };
```

There is one configuration option passed into the markdown parser configuration and that is to support HTML tags in the markdown source. This is optional, and not required but it can be helpful to support using HTML for elements that are lacking in Markdown syntax.

#### Add Code Syntax Highlighting With highlight.js

Besides optionally supporting HTML tags in the Markdown source, the markdown parser included with the markdown-it package can apply syntax highlighting to designated code blocks. Make the following adjustments to the markdown.ts file to include this option:

```typescript
import hljs from "highlight.js";
import MarkdownIt from "markdown-it";

const markdown: MarkdownIt = MarkdownIt({
  html: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre><code class="hljs">' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          "</code></pre>"
        );
      } catch (__) {}
    }
    return (
      '<pre><code class="hljs">' +
      markdown.utils.escapeHtml(str) +
      "</code></pre>"
    );
  },
});

export { markdown };
```

The highlight.js module is able to dynamically determine the language syntax highlighting based on the "lang" variable valuable that is passed into the "highlight" function the highlight.js module API provides.

Instead of an error when encountering inconsistent syntax, the "ignoreIllegals" parameter configures the highlight.js highlighter to finish highlighting. You may wish to leave this option out, but there is [discussion whether the default value of the "ignoreIllegals" options should be changed to true](https://github.com/highlightjs/highlight.js/issues/3149), as is used in this example.

If highlight.js cannot determined the language of the code block it will apply the "escapeHtml" function provided to the markdown string, and also wraps the code block section into a [code](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code) element nested inside a [pre](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre) element.

These additions will import the highlight.js module and apply the formatting required to dynamically highlight code blocks based on the language provided. The sample markdown file created in a previous step includes a block of JavaScript code that will have dynamic syntax highlighting applied when converted to HTML.

#### Convert Markdown to HTML with markdown-it parser

The "markdown.ts" file can now be imported in the "index.ts" file to access the Markdown parser with the previous configuration applied. To import the "markdown.ts" file and use the "render" function provided by the markdown-it module API, make these changes to the "index.ts" file:

```typescript
import fs from "fs-extra";
import { markdown } from "./utils/markdown.js";

(async function () {
  console.log("Converting Markdown to HTML...");

  // markdown source
  const content = await fs.readFile("./content/index.md", "utf8");

  // converted to HTML
  const rendered = await markdown.render(content);
})();
```

The Markdown content, converted to HTML, is now assigned to the variable named "rendered". To view the rendered HTML you can output the "rendered" variable to the console and then run the command <kbd>npm run start-typecheck</kbd>, once more.

The contents of the "rendered" variable are valid HTML, but they do not represent an entire HTML document. To ensure that the Markdown source is converted into a complete and valid HTML document another variable is added, named "htmlFile", and this wraps the "rendered" variable string value in additional HTML code to create an entire HTML document. The "index.ts" should now look like this:

```typescript
import fs from "fs-extra";
import { markdown } from "./utils/markdown.js";

(async function () {
  console.log("Converting Markdown to HTML...");

  // markdown source
  const content = await fs.readFile("./content/index.md", "utf8");

  // converted to HTML
  const rendered = await markdown.render(content);

  const htmlFile = `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8" />
  <title>Convert Markdown to HTML with Node.js</title>
  <link rel="stylesheet" href="./default.css">
  </head>
  <body>
  ${rendered}
  </body>
  </html>`;
})();
```

**Note**: The "default.css" file referenced in the head of the HTML document will be copied in the following step from the default style sheet theme included with the highlight.js npm package.

### Write HTML File

Instead of writing this file in the project folder root, the fs-extra module includes a "mkdirs" function that can programmatically create a folder. Using this function a new folder will be created named "public", and the generated HTML file saved there.

The highlight.js module provides many different style sheet themes to choose from when applying code block syntax highlighting. For this example the "default.css" theme is used, and that file is copied from the highlight.js module, inside the "node_modules" folder into the public folder that is programmatically created for the generated HTML. This way when the style sheet is reference in the "index.html" file, the "default.css" file is available in the same folder.

```typescript
import fs from "fs-extra";
import { markdown } from "./utils/markdown.js";

(async function () {
  console.log("Converting Markdown to HTML...");

  // markdown source
  const content = await fs.readFile("./content/index.md", "utf8");

  // converted to HTML
  const rendered = await markdown.render(content);

  const htmlFile = `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8" />
  <title>Convert Markdown to HTML with Node.js</title>
  <link rel="stylesheet" href="./default.css">
  </head>
  <body>
  ${rendered}
  </body>
  </html>`;

  await fs.mkdirs("./public");

  await fs.writeFile("./public/index.html", htmlFile, "utf8");

  await fs.copy(
    "./node_modules/highlight.js/styles/default.css",
    "./public/default.css",
    { overwrite: true }
  );

  console.log("HTML generated.");
})();
```

Run the command <kbd>npm run start-typecheck</kbd> once more and a new file "index.html" should be generated inside a new folder named "public" in your project folder, along with the "default.css" file that was copied from the "node_modules" folder.

You can now view the "index.html" file that will contain the Markdown source converted into HTML. The "index.html" file should look similar to this:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Convert Markdown to HTML with Node.js</title>
    <link rel="stylesheet" href="./default.css" />
  </head>
  <body>
    <h1>H1</h1>
    <h2>H2</h2>
    <h3>H3</h3>
    <h4>H4</h4>
    <p><strong>bold text</strong></p>
    <p><em>italicized text</em></p>
    <blockquote>
      <p>blockquote</p>
    </blockquote>
    <ol>
      <li>First item</li>
      <li>Second item</li>
      <li>Third item</li>
    </ol>
    <ul>
      <li>First item</li>
      <li>Second item</li>
      <li>Third item</li>
    </ul>
    <p><code>code</code></p>
    <hr />
    <pre><code class="hljs"><span class="hljs-keyword">function</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&quot;This is some javascript included in a markdown code block, and it will be converted to valid HTML with code syntax highlighting.&quot;</span>);
}
</code></pre>
    <p><kbd>this is a keyboard input html element</kbd></p>
    <pre><code class="hljs"><span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>this will remain html even after the Markdown is converted to HTML<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
</code></pre>
    <p><a href="https://www.devextent.com">Dev Extent</a></p>
    <p>
      <img
        src="https://www.devextent.com/images/devextent.png"
        alt="Dev Extent"
      />
    </p>
  </body>
</html>
```

You can validate the generated HTML code with the [W3C Markup Validation Service](https://validator.w3.org/#validate_by_input), and you can also use the [http-server](https://www.npmjs.com/package/http-server) npm package to create a local web server on your computer to view the "index.html" file in a browser.

### View HTML File Locally

To test the Markdown converted into HTML, in a browser you can run the command <kbd>npm install http-server --save-dev</kbd> to install the http-server npm package. Then add the following to the package.json scripts property:

```json
{
  "scripts": {
    "serve": "http-server"
  }
}
```

Then you can run the command <kbd>npm run serve</kbd> and the generated "index.html" file will be served from the public folder in your project. You should be able to navigate to "localhost:8080" and there you will see the content of the "index.html" with the styles from "default.css" applied to the syntax highlighted code block.
