---
title: Generate an RSS Feed with Node.js
guid: 79016133-6cc3-4639-977c-65a0cc69cf34
metaDescription: Use the xml, cheerio, and fs-extra npm packages with TypeScript to generate an RSS feed for a Jamstack blog with Node.js
author: James Edwards
tags:
  - Node.js
  - TypeScript
  - XML
image: xml-rss-feed-nodejs.png
---

An [RSS](https://en.wikipedia.org/wiki/RSS) feed is a convenient way to allow access to syndicated content in a standardized format that is easily shareable and discoverable. Recently I've been using [feedly](https://feedly.com/) to stay up to date with a variety of web development blogs. This got me interested in how to add an rss feed to a static website built with the [Jamstack](https://jamstack.org/), specifically how to generate an rss feed from blog post data with node.js and [TypeScript](https://www.typescriptlang.org/).

Before proceeding make sure to have [node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed.

### Run npm init

There are some npm packages that will be used to create the rss feed, so first run the command <kbd>npm init</kbd>, which will create a package.json file that we can add dependencies to. After creating the package.json these are the npm packages that we will add:

- [fs-extra](https://www.npmjs.com/package/fs-extra)
- [xml](https://www.npmjs.com/package/xml)
- [cheerio](https://www.npmjs.com/package/cheerio)
- [typescript](https://www.npmjs.com/package/typescript)

To install these run the command <kbd>npm install fs-extra cheerio xml typescript --save</kbd>, and since we are using TypeScript for this example we need the corresponding type definitions. To install the type definitions run the command: <kbd>npm install @types/xml @types/cheerio @types/fs-extra --save-dev</kbd>.

There is one extra field that needs to be added to the package.json file and that is the [type](https://nodejs.org/api/packages.html#packages_type) field. This permits the use of [ECMAScript modules](https://nodejs.org/api/esm.html), rather than [CommonJS modules](https://nodejs.org/api/modules.html).

Your package.json should look similar to this:

```json
{
  "type": "module",
  "name": "xmlrssfeed",
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
    "typescript": "^4.1.3",
    "xml": "^1.0.1"
  },
  "devDependencies": {
    "@types/cheerio": "^0.22.23",
    "@types/fs-extra": "^9.0.6",
    "@types/xml": "^1.0.5"
  }
}
```

### Configure tsconfig.json

Typescript is used in this example so tsconfig.json file is also required. You can read more about the tsconfig.json settings in the [TypeScript documentation](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html). For our case, create a file named tsconfig.json and copy the code below into it.

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

The module field is set to "esnext" to match the addition of the "type" field in the package.json. This setting instructs the TypeScript compiler to generate [es modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), and allows us to use [import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) in the TypeScript code.

### npm package.json script

After configuring TypeScript, we need a way to transpile and then execute the generated JavaScript with node.js. To do this, an npm package.json script can be added to carry out both steps. In the package.json file, add a new scripts property "createRssFeed", so that it looks like this:

```json
{
  "type": "module",
  "name": "xmlrssfeed",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "createRssFeed": "tsc && node index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "cheerio": "^1.0.0-rc.5",
    "fs-extra": "^9.0.1",
    "typescript": "^4.1.3",
    "xml": "^1.0.1"
  },
  "devDependencies": {
    "@types/cheerio": "^0.22.23",
    "@types/fs-extra": "^9.0.6",
    "@types/xml": "^1.0.5"
  }
}
```

The createRssFeed script will sequentially compile the TypeScript source file (index.ts) and then use node to execute the JavaScript output. If you try running the command <kbd>npm run createRssFeed</kbd> you will get an error, because the index.ts doesn't exist yet. Let's create that now.

### Node.js Script

In the same folder as the package.json file create a new file named index.ts, and add the code below to make sure the setup is working.

```typescript
import fs from "fs-extra";
import xml from "xml";
import cheerio from "cheerio";

(async function createRssFeed() {
  console.log("creating feed");
})();
```

Then run the createRssFeed command <kbd>npm run createRssFeed</kbd> and the output should print to the console the text "creating feed".

### Generate RSS Feed

With the setup working we can now begin to use the npm packages that we imported. The xml package accepts a feed object as it's configuration so we can add that to the createRssFeed function. The feedObject will be processed into an xml string and then the fs-extra package will be used to write the output to a file named feed.rss.

```typescript
import fs from "fs-extra";
import xml from "xml";
import cheerio from "cheerio";

(async function createRssFeed() {
  console.log("creating feed");
  const feedObject = {
    rss: [
      {
        _attr: {
          version: "2.0",
          "xmlns:atom": "http://www.w3.org/2005/Atom",
        },
      },
      {
        channel: [
          {
            "atom:link": {
              _attr: {
                href: "YOUR-WEBSITE/feed.rss",
                rel: "self",
                type: "application/rss+xml",
              },
            },
          },
          {
            title: "YOUR-WEBSITE-TITLE",
          },
          {
            link: "YOUR-WEBSITE/",
          },
          { description: "YOUR-WEBSITE-DESCRIPTION" },
          { language: "en-US" },
          // todo: add the feed items here
        ],
      },
    ],
  };

  const feed = '<?xml version="1.0" encoding="UTF-8"?>' + xml(feedObject);

  await fs.writeFile("/feed.rss", feed, "utf8");
})();
```

Make sure to replace "YOUR-WEBSITE", "YOUR-WEBSITE-TITLE", and "YOUR-WEBSITE-DESCRIPTION" with the actual values from the website you are generating the RSS feed for.

At this point the createRssFeed npm package.json script should generate a new file named feed.rss in the project folder, although it will be an empty feed. So in the feed object we can replace the todo comment with code that will use some sample post data to generate the feed.

In this case we'll create an array of objects for our sample post data, but a more likely scenario is that they would be dynamically sourced from a content store, like markdown files or a content management system.

Add the sample posts below directly above the feedObject variable.

```typescript
const posts = [
  {
    title: "Post One",
    date: "1/1/2020",
    slug: "post-one",
    content: "This is some content for post one.",
  },
  {
    title: "Post Two",
    date: "1/2/2020",
    slug: "post-two",
    content: "This is some content for post two.",
  },
  {
    title: "Post Three",
    date: "1/3/2020",
    slug: "post-three",
    content: "This is some content for post three.",
  },
  {
    title: "Post Four",
    date: "1/4/2020",
    slug: "post-four",
    content: "This is some content for post four.",
  },
];
```

Now that we some posts to include, replace the todo with this function call:

```typescript
...(buildFeed(posts));
```

This will take the result of the buildFeed function (we will write this next), which will be an array and [spread](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) the results into the feedObject.

Now the index.ts file should look like this:

```typescript
import fs from "fs-extra";
import xml from "xml";
import cheerio from "cheerio";

(async function createRssFeed() {
  console.log("creating feed");
  const posts = [
    {
      title: "Post One",
      date: "1/1/2020",
      slug: "post-one",
      content: "<p>This is some content for post one.</p>",
    },
    {
      title: "Post Two",
      date: "1/2/2020",
      slug: "post-two",
      content: "<p>This is some content for post two.</p>",
    },
    {
      title: "Post Three",
      date: "1/3/2020",
      slug: "post-three",
      content:
        "<p>This is some content for post three. This is a relative <a href='/relative-link/'>link</a></p>",
    },
    {
      title: "Post Four",
      date: "1/4/2020",
      slug: "post-four",
      content: "<p>This is some content for post four.</p>",
    },
  ];

  const feedObject = {
    rss: [
      {
        _attr: {
          version: "2.0",
          "xmlns:atom": "http://www.w3.org/2005/Atom",
        },
      },
      {
        channel: [
          {
            "atom:link": {
              _attr: {
                href: "YOUR-WEBSITE/feed.rss",
                rel: "self",
                type: "application/rss+xml",
              },
            },
          },
          {
            title: "YOUR-WEBSITE-TITLE",
          },
          {
            link: "YOUR-WEBSITE/",
          },
          { description: "YOUR-WEBSITE-DESCRIPTION" },
          { language: "en-US" },
          ...buildFeed(posts),
        ],
      },
    ],
  };

  const feed = '<?xml version="1.0" encoding="UTF-8"?>' + xml(feedObject);

  await fs.writeFile("./feed.rss", feed);
})();
```

The feedObject now includes the buildFeed function, which can be added below the createRssFeed function. As the name suggests this is where the feed items will be created and sorted by most recent date. Additionally the cheerio npm package will be used here.

```typescript
function buildFeed(
  posts: { title: string; date: string; slug: string; content: string }[]
) {
  const sortedPosts = posts.sort(function (first, second) {
    return new Date(second.date).getTime() - new Date(first.date).getTime();
  });

  const feedItems = [];

  feedItems.push(
    ...sortedPosts.map(function (post) {
      const feedItem = {
        item: [
          { title: post.title },
          {
            pubDate: new Date(post.date as string).toUTCString(),
          },
          {
            guid: [
              { _attr: { isPermaLink: true } },
              `YOUR-WEBSITE/${post.slug}/`,
            ],
          },
          {
            description: {
              _cdata: post.content,
            },
          },
        ],
      };
      return feedItem;
    })
  );

  return feedItems;
}
```

This code can now generate the RSS feed by re-running the command <kbd>npm run createRssFeed</kbd>, however any relative links in the post content will not link to the correct website, since RSS feeds require absolute links. We can convert them to absolute links using the cheerio npm package.

### Convert relative links to absolute links

Directly above the feed object add the following code:

```typescript
const $ = cheerio.load(post.content as string, {
  decodeEntities: false,
});

// replace relative links with absolute
$("a[href^='/'], img[src^='/']").each(function (this: cheerio.Element) {
  const $this = $(this);
  if ($this.attr("href")) {
    $this.attr("href", `YOUR-WEBSITE/${$this.attr("href")}`);
  }
  if ($this.attr("src")) {
    $this.attr("src", `YOUR-WEBSITE/${$this.attr("src")}`);
  }
});

const postContent = $("body").html() as string;
```

Here is some more info on this technique to [convert relative urls to absolute urls](/relative-url-to-absolute-url-nodejs/). Make sure to also replace the description property of the feedItem with the postContent variable. The buildFeed function should now look like this:

```typescript
function buildFeed(
  posts: { title: string; date: string; slug: string; content: string }[]
) {
  const sortedPosts = posts.sort(function (first, second) {
    return new Date(second.date).getTime() - new Date(first.date).getTime();
  });

  const feedItems = [];

  feedItems.push(
    ...sortedPosts.map(function (post) {
      const $ = cheerio.load(post.content as string, {
        decodeEntities: false,
      });

      // replace relative links with absolute
      $("a[href^='/'], img[src^='/']").each(function (this: cheerio.Element) {
        const $this = $(this);
        if ($this.attr("href")) {
          $this.attr("href", `YOUR-WEBSITE/${$this.attr("href")}`);
        }
        if ($this.attr("src")) {
          $this.attr("src", `YOUR-WEBSITE/${$this.attr("src")}`);
        }
      });

      const postContent = $("body").html() as string;

      const feedItem = {
        item: [
          { title: post.title },
          {
            pubDate: new Date(post.date as string).toUTCString(),
          },
          {
            guid: [
              { _attr: { isPermaLink: true } },
              `YOUR-WEBSITE/${post.slug}/`,
            ],
          },
          {
            description: {
              _cdata: postContent,
            },
          },
        ],
      };

      return feedItem;
    })
  );

  return feedItems;
}
```

The buildFeed function, first sorts all the posts by most recent date and then maps over the sorted posts to assign post data properties to the corresponding xml fields in the RSS feed. For each of the posts the content is modified, by using the cheerio npm package, to convert all the relative links to absolute links. That way when the RSS feed is shared the in-article links will link back to the correct website. As in the sections above make sure to replace "YOUR-WEBSITE" with the actual domain of your website. Additionally the date is formatted to [RFC 822 format](https://www.w3.org/Protocols/rfc822/), in order to match the [RSS specification](https://validator.w3.org/feed/docs/rss2.html).

Re-run the command <kbd>npm run createRssFeed</kbd>, and the feed.rss file that is generated should reflect the changes we made. You can verify that this file is a valid rss feed by checking it with the [w3c Feed Validation Service](https://validator.w3.org/feed/).

To permit auto discovery of the RSS feed make sure to include the following html in the head tag of your website.

```html
<link
  rel="alternate"
  type="application/rss+xml"
  title="RSS 2.0"
  href="/feed.rss"
/>
```
