---
title: Convert JSON to XML with the XML npm package
author: James Edwards
metaDescription: Read a JSON file with Node.js and use the XML npm package with TypeScript to convert JSON to an XML string and write the XML string to a file.
tags:
  - XML
  - Node.js
  - TypeScript
guid: f18bff00-3043-4cce-87e0-5bbada10744a
image: npm-convert-json-to-xml.png
---

[XML](https://en.wikipedia.org/wiki/XML) is a textual data format that is standardized, and as a result is widely used throughout a variety of systems. Two common usages are for website [sitemaps](https://developers.google.com/search/docs/advanced/sitemaps/overview) and [RSS](https://en.wikipedia.org/wiki/RSS) feeds, both of which can use XML as the document format. Other usages of XML can include [RESTful HTTP API endpoints](https://en.wikipedia.org/wiki/Representational_state_transfer), both receiving and returning XML requests and responses. This post will include the steps to convert JSON to XML with the [XML npm package](https://www.npmjs.com/package/xml). First we will read a [JSON](https://en.wikipedia.org/wiki/JSON) file, convert the JSON object to an XML string, and then write the XML string to a file. Besides reading and writing files, the XML npm package can be used in other scenarios, where no files are involved as long as incoming data format is JSON and the desired data output format is an XML string.

### npm init package.json

You will not need to to do this if you have an existing Node.js project setup but if you do not, then make sure to first install [Node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm). Then in a terminal window open new folder for the project and run the command <kbd>npm init</kbd>, and follow the prompts that are displayed. The package.json file should have been added to the project folder.

We also need to make one addition to the package.json file after it has been generated so that [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) can be used with Node.js. To support ES Modules add a "type" property to the package.json file object with the value set to "module". In the following steps we will configure the TypeScript compiler to output JavaScript using the ES Module format.

### npm install

With the package.json generated we can run additional commands to install the npm packages we will use. In the same project folder run the command <kbd>npm install xml typescript --save</kbd>, this will install the XML and TypeScript npm packages. After that run another command <kbd>npm install @types/xml --save-dev</kbd>. This will install the TypeScript type definitions for the XML npm package. Your package.json should look similar to this:

```json
{
  "type": "module",
  "name": "convertjsontoxml",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "typescript": "^4.2.3",
    "xml": "^1.0.1"
  },
  "devDependencies": {
    "@types/xml": "^1.0.5"
  }
}
```

### Compile TypeScript

Now that we have installed the XML and TypeScript npm packages installed, we can configure TypeScript to compile our code to use with Node.js, by adding an npm package.json script. To do this add the following the the "scripts" property in the package.json file that was created in the first step:

```json
{
  "scripts": {
    "compile": "tsc --allowSyntheticDefaultImports --isolatedModules --moduleResolution node --module esnext index.ts"
  }
}
```

The compile command will invoke the TypeScript compiler with the CLI flags that will generate the JavaScript output using the ES Module format. This will match the "type" property set to "module" in the package.json configured earlier. You can run this command using <kbd>npm run compile</kbd> in the terminal window.

### Create Node.js Script

Next we can create a Node.js script, and as referenced in the package.json scripts "compile" command, the name of this file is index.ts. Here we will write the TypeScript code that will use the XML npm package to generate an XML string from a JSON object. In the index.ts file add the following code:

```typescript
import { promisify } from "util";
import { readFile, writeFile } from "fs";
import xml from "xml";

const readFilePromise = promisify(readFile);
const writeFilePromise = promisify(writeFile);

(async function convertJsonToXml() {})();
```

This will set up the import statements for the XML npm package and also import the readFile and writeFile functions from the node [fs module](https://nodejs.org/api/fs.html). Since these functions use callbacks by default, the promisify function is imported from the [util module](https://nodejs.org/api/util.html) to convert the readFile and writeFile functions into promises. This way we can use [async/await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) syntax.

### Read JSON File

In the ConvertJsonToXml function the first thing we can do is read the JSON file containing a sample JSON object that we can convert to an XML string. Create a new file named "data.json" in the same project folder, and add this sample JSON object:

```json
[
  {
    "name": "Next.js",
    "language": "JavaScript",
    "templates": "React",
    "description": "A framework for statically-exported React apps (supports server side rendering)"
  },
  {
    "name": "Gatsby",
    "language": "JavaScript",
    "templates": "React",
    "description": "Build blazing fast, modern apps and websites with React"
  },
  {
    "name": "Nuxt",
    "language": "JavaScript",
    "templates": "Vue",
    "description": "A minimalistic framework for serverless Vue.js applications."
  }
]
```

In the index.js file, inside of the ConvertJsonToXml function we can add this code to read the JSON file and parse it into a JSON object with the corresponding type signature:

```typescript
const staticSiteGeneratorData = JSON.parse(
  await readFilePromise("data.json", "utf8")
) as [
  {
    name: string;
    language: string;
    templates: string;
    description: string;
  }
];
```

Once the json file is read and saved as the "staticSiteGeneratorData" variable we can use the [Array.prototype.map(](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)) method to shape the data into the format we need, in order to use the XML npm package to convert the JSON object into an XML string. Below the code that is reading the data.json file add this code:

```typescript
const xmlFormattedStaticSiteGeneratorData = [
  {
    staticSiteGenerators: [
      ...staticSiteGeneratorData.map((item) => {
        return {
          staticSiteGenerator: [
            {
              _attr: {
                language: item.language,
                templates: item.templates,
                description: item.description,
              },
            },
            item.name,
          ],
        };
      }),
    ],
  },
];
```

The result of the data that is assigned to the "xmlFormattedStaticSiteGeneratorData" variable will look like this:

```json
[
  {
    "staticSiteGenerators": [
      {
        "staticSiteGenerator": [
          {
            "_attr": {
              "language": "JavaScript",
              "templates": "React",
              "description": "A framework for statically-exported React apps (supports server side rendering)"
            }
          },
          "Next.js"
        ]
      },
      {
        "staticSiteGenerator": [
          {
            "_attr": {
              "language": "JavaScript",
              "templates": "React",
              "description": "Build blazing fast, modern apps and websites with React"
            }
          },
          "Gatsby"
        ]
      },
      {
        "staticSiteGenerator": [
          {
            "_attr": {
              "language": "JavaScript",
              "templates": "Vue",
              "description": "A minimalistic framework for serverless Vue.js applications."
            }
          },
          "Nuxt"
        ]
      }
    ]
  }
]
```

### Convert JSON File to an XML String

The JSON data assigned to the "xmlFormattedStaticSiteGeneratorData" variable, is now in the appropriate format to use with the XML npm package. Directly below the code that formats the data, and inside the "convertJsonToXml" function, add the following code:

```typescript
const staticSiteGeneratorXmlString = xml(xmlFormattedStaticSiteGeneratorData);
```

The format of the xml string assigned to the "staticSiteGeneratorXmlString" is going to look like this:

```xml
<staticSiteGenerators>
    <staticSiteGenerator language="JavaScript" templates="React" description="A framework for statically-exported React apps (supports server side rendering)">Next.js</staticSiteGenerator>
    <staticSiteGenerator language="JavaScript" templates="React" description="Build blazing fast, modern apps and websites with React">Gatsby</staticSiteGenerator>
    <staticSiteGenerator language="JavaScript" templates="Vue" description="A minimalistic framework for serverless Vue.js applications.">Nuxt</staticSiteGenerator>
</staticSiteGenerators>
```

### Write XML File

The XML string assigned to the variable "staticSiteGeneratorDataXmlString" can be written to an XML file with the writeFile module that we imported and promisified at the beginning of the index.ts file. To write the XML string to a file in the same project folder add this code below the XML npm package usage that was included in the prior step:

```typescript
await writeFilePromise("data.xml", staticSiteGeneratorXmlString, "utf8");
```

Put all the code together and the index.ts file should look like this:

```typescript
import { promisify } from "util";
import { readFile, writeFile } from "fs";
import xml from "xml";

const readFilePromise = promisify(readFile);
const writeFilePromise = promisify(writeFile);

(async function convertJsonToXml() {
  const staticSiteGeneratorData = JSON.parse(
    await readFilePromise("data.json", "utf8")
  ) as [
    {
      name: string;
      language: string;
      templates: string;
      description: string;
    }
  ];

  const xmlFormattedStaticSiteGeneratorData = [
    {
      staticSiteGenerators: [
        ...staticSiteGeneratorData.map((item) => {
          return {
            staticSiteGenerator: [
              {
                _attr: {
                  language: item.language,
                  templates: item.templates,
                  description: item.description,
                },
              },
              item.name,
            ],
          };
        }),
      ],
    },
  ];

  const staticSiteGeneratorXmlString = xml(xmlFormattedStaticSiteGeneratorData);

  await writeFilePromise("data.xml", staticSiteGeneratorXmlString, "utf8");
})();
```

### Run Node.js Script with npm package.json Scripts

To test this code out and run the Node.js script we can add another package.json script that will first compile the TypeScript into JavaScript and then run the JavaScript output with Node.js. In the package.json file add a new package.json script named "start" that looks like this:

```json
{ "scripts": { "start": "npm run compile && node index.js" } }
```

To use the start script run the command <kbd>npm run start</kbd> and you should then see the XML file generated and saved to the project folder. The contents of this file should match the format of the XML string shown previously. Anytime you want to change the data or formatting make sure to run the <kbd>npm run start</kbd> again to regenerate the data.xml file.

The XML npm package is a convenient way to convert JSON into XML, as long as the JSON data is formatted appropriately, or there is a step involved to properly format the original JSON data source into the format the XML npm package requires. For other usages of the XML npm packages you can read my other posts showing how to [generate an XML sitemap](/generate-xml-sitemap-nodejs/) and [generate an XML RSS feed](/xml-rss-feed-nodejs/), like this example, both of these posts are using Node.js and npm.
