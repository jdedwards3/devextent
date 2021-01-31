---
title: Run Git Commands with Node.js
metaDescription:
  Use the simple-git npm package and Node.js to run git commands and access git
  metadata programmatically with TypeScript.
guid: 7422c6c0-840f-43cc-b590-462e72c53871
author: James Edwards
tags:
  - Git
  - Node.js
  - TypeScript
---

If you're building a blog with the [Jamstack](https://jamstack.org/) your content might be stored in a git repository. This can help to reduce overhead, since a database is no longer required, but presents other interesting challenges like displaying post metadata. This may include the date the post was created or the date it was last updated, information that can be helpful to readers and enhances the display of the post in search engine results. We can use Node.js to retrieve the information that is stored in each commit, as well as run other git commands with the help of the [Simple Git](https://www.npmjs.com/package/simple-git) npm package.

Before getting started it may be helpful to checkout how to [render EJS files with Node.js](/ejs-render-file/). The code below assumes a static build process and that the source is tracked in a git repository, as well as having [Node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed.

### Setup TypeScript

If you're interested in more information about setting up Typescript, checkout this post that shows how to [compile TypeScript with npm](/npm-compile-typescript/). There you can see how to create a package.json file and add a tsconfig.json to configure the TypeScript compiler.

Since we are using Node.js with TypeScript there are some modifications needed to the tsconfig.json file from the previous post.

Here is what your tsconfig.json file should look like, in order for the code that follows to work correctly.

```json
{
  "compilerOptions": {
    "outDir": "./output",
    "module": "commonjs",
    "target": "ES6"
  },
  "include": ["/*"],
  "exclude": []
}
```

This configuration instructs the TypeScript compiler to use commonjs modules and output code that targets the ES6 specification, which is needed since an async function will be needed to utilize the npm package we'll use to gather git file metadata.

### npm install Simple Git

Next, the Simple Git npm package is needed so that it can be used to access the git metadata. Run the command <kbd>npm install simple-git --save-dev</kbd> in the terminal, and that will install the Simple Git package to the node_modules folder.

At this point the package.json file should look similar to this (the package versions might be slightly different):

```json
{
  "name": "package-name-goes-here",
  "version": "0.0.0",
  "scripts": {
    "compile-typescript": "tsc"
  },
  "devDependencies": {
    "simple-git": "^1.129.0",
    "typescript": "^3.7.5"
  }
}
```

**Note**: Since we are using TypeScript for this example, usually a type definition package is also required to be "npm installed" just like the actual package. In this case the Simple Git package includes the @types type declarations, so downloading a separate package is not needed.

### Use Simple Git with TypeScript

With TypeScript and the npm package.json configured we can now create a TypeScript file, let's call it index.ts. This will contain the code that will access the git metadata of our post file. To get started the Simple Git npm package will be imported, and an async function will be needed to utilize the Simple Git package, immediately following the async build function is called so the result can be output.

```typescript
// index.ts
import * as simpleGit from "simple-git/promise";

async function build() {
  const git = simpleGit();
}

build();
```

Since we are using TypeScript the import declaration might look slightly different than expected. This approach is consistent with the Simple Git documentation. Additionally, make sure to import the promise and async compatible version simple-git/promise. Inside of the build function Simple Git is initialized, and the functions provided by the Simple Git API are ready for use. Simple Git may not provide all of the git functionality available from the command line, but it works well for more common usages. We can add some code that will retrieve the created date of a file (based on the first commit) and the last modified date (based on latest commit).

```typescript
// index.ts
import * as simpleGit from "simple-git/promise";

async function build() {
  const git = simpleGit();

  //list commits
  // git log accepts an options object - from ts definition
  /*
    format?: T;
    file?: string;
    from?: string;
    multiLine?: boolean;
    symmetric?: boolean;
    to?: string;
  */
  const log = await git.log({ file: `sample-post-page.html` });

  // get first commit date of file
  const createdDate = new Date(log.all.slice(-1)[0].date);

  // get latest modified date of file
  const modifiedDate = new Date(log.latest.date);

  // output formatted time stamps
  console.log(createdDate.toLocaleDateString());
  console.log(modifiedDate.toLocaleDateString());
}

build();
```

Instead of just outputting this git metadata to the console it can be assigned to a variable and then included in rendered content output for the reader to view.

The Simple Git API provides a lot of other examples for the functionality it provides. In this example the focus was on how we can gather the created and last modified dates of a file representing post content that is included in a static build process like one might find in use for a site built with the Jamstack.
