---
title: Convert Relative URL to Absolute URL with Node.js
author: James Edwards
metaDescription: Convert HTML link values containing relative URLs to use absolute URLs with the cheerio npm package.
tags:
  - Node.js
  - TypeScript
  - HTML
guid: 9e7ec00f-d165-41d5-b007-73486ff4f119
---

Let's say you are building a site with the [Jamstack](https://jamstack.org/) and you want to [use node.js to generate the rss feed for your site](/xml-rss-feed-nodejs/). In doing so you realize that your post content contains relative links when checking with the validator provided by the [W3C Feed validation service](https://validator.w3.org/), and it indicates [elements should not contain relative URL references](https://validator.w3.org/feed/docs/warning/ContainsRelRef.html). In order to make sure the RSS feed is valid, and only containing absolute URLs, we can use the [cheerio npm package](https://www.npmjs.com/package/cheerio) to parse an HTML source and transform relative anchor links and image sources to absolute URLs. To demonstrate this we can create an HTML file that represents sample post content.

## HTML with relative links

```html
<p>
  This is the sample content that contains a
  <a href="/relative-link">relative link</a>, that will be converted into an
  absolute link.
</p>

<p>Post content can also include images like this one:</p>
<img src="/sample-image" />
<p>These will get transformed too.</p>
```

This isn't a full HTML document, only a fragment that represents a sample of what may be contained in a blog post that has been converted from markdown into HTML with a node.js static site generator. Now that the sample HTML file is created and saved as "sample-post.html" we can read it and process the relative links.

## Cheerio npm package

To use the cheerio npm package we need to create a node script, and for this we can optionally use TypeScript. For more info about using TypeScript with Node.js, read about how to [compile TypeScript with npm](/npm-compile-typescript/). If you aren't using TypeScript you can omit the type declarations from the following code.

What is important is that the package.json file is configured for the project (if not use the <kbd>npm init</kbd> command), and then run the command <kbd>npm install cheerio fs-extra typescript --save</kbd> followed by the command <kbd>npm install @types/cheerio @types/fs-extra @types/node --save-dev</kbd> to install the cheerio npm package with the corresponding type declaration files.

The script code will use es modules to import these npm package libraries, so at the top of the generated package.json file add the following line:

```json
{
  "type": "module"
}
```

Your package.json file should look similar to this:

```json
{
  "type": "module",
  "name": "relativeurltoabsoluteurl",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "cheerio": "^1.0.0-rc.5",
    "fs-extra": "^9.0.1",
    "typescript": "^4.1.3"
  },
  "devDependencies": {
    "@types/cheerio": "^0.22.23",
    "@types/fs-extra": "^9.0.6",
    "@types/node": "^14.14.21"
  }
}
```

You can also copy the above json and save as package.json, then run the command <kbd>npm install</kbd> to install all of the dependencies listed.

## Transform relative URL to absolute URL

Then create a new file named script.ts and place the following code inside of it:

```typescript
import cheerio from "cheerio";
import fs from "fs";

(async function convertRelativeToAbsolute() {
  const postContent = await fs.readFile("./sample-post.html");

  const $ = cheerio.load(postContent as string, {
    decodeEntities: false,
  });

  $("a[href^='/'], img[src^='/']").each(function (this: cheerio.Element) {
    const $this = $(this);
    if ($this.attr.href) {
      $this.attr("href", `YOUR-DOMAIN-HERE/${$this.attr("href")}`);
    }
    if ($this.attr.src) {
      $this.attr("src", `YOUR-DOMAIN-HERE/${$this.attr("src")}`);
    }
  });

  await fs.writeFile($("body").html() as string);
})();
```

Make sure to replace "YOUR-DOMAIN-HERE" with actual domain you want to convert the relative links to use.

The code inside the "convertRelativeToAbsolute" function, first reads the sample post file containing the HTML file with relative links. Then it uses the cheerio package to load the file and parse it to find all of the anchor tags and images tags that are referencing relative URLs. The selectors used scope either anchor tags or image tags to those that begin with a forward slash, which can most likely be safely assumed to be a relative link. Depending on whether the element is an anchor link or an image, either the href attribute or the src attribute will be prepended with the site domain, to make it an absolute link. When all of the link and image attributes are processed the sample html file is written back to the original file location.

## Compile TypeScript and Run Node script

Now we can add a script to the package.json file that will compile the TypeScript script file and run the "convertRelativeToAbsolute" function. In the package.json file add this line to the scripts property:

```json
{
  "scripts": {
    "convertRelativeToAbsolute": "tsc --allowSyntheticDefaultImports --moduleResolution node --module esnext script.ts && node script.js"
  }
}
```

This will first run the TypeScript compiler, with the flag options specified to indicate the use of es modules with node.js, to convert script.ts into JavaScript output. Then the script.js file is run using node. We can run the "convertRelativeToAbsolute" package.json script by running the command <kbd>npm run convertRelativeToAbsolute</kbd>. After it completes you should be able to see the sample-post.html file has been updated to use absolute links in the sample content included earlier.

Now the sample-post.html file content can be shared and referenced from any source, while ensuring that any of the internal links will load as expected. In a more typical scenario the cheerio parsing can be included as a plugin or middleware in a static site generator's build process, rather than working with HTML files directly. This would enable the output of the build process to apply the relative to absolute link conversion to all of the, possibly syndicated, content for the site.

This is one example of how the cheerio npm package is helpful for DOM parsing and manipulation outside of the browser, especially in the context of a static, pre-rendered site that is built using Jamstack technologies.
