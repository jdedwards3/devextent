---
title: Minify HTML with npm
metaDescription:
  Use the html-minifier npm package cli to minify an HTML file with npm
  package.json scripts and Node.js
guid: 28f35562-d544-4eea-ba10-05be8e09120a
author: James Edwards
tags:
  - HTML
  - Node.js
---

The [html-minifier](https://www.npmjs.com/package/html-minifier) npm package provides a command line interface that makes it possible to minify HTML. This can be useful when working with a site built with the [Jamstack](https://jamstack.org/). One example of this scenario could be a site that uses a static site generator to output prerendered HTML files at build time. In this case, and especially when serving lots of content, minifying the HTML output can result in cost savings as well as performance improvements.

Before following the steps below make sure to have [Node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed.

### HTML

To demonstrate the features provided by the html-minifier package we will start out with a sample html file. We can name this file index.html, and save it to a folder called "src". The name of the file and containing folder will be needed in the following steps. For this example, the sample file contains different types of elements to highlight the effect of minification, especially in regard to how white space is maintained when using preformatted elements.

```html
<h1>This is our sample html content</h1>

<p>Here is some paragraph text.</p>

<pre>This text is preformatted.

There is more than one line in this text block.

    <code>console.log("code block inside preformatted block.");</code>
</pre>

<div>some more text at the bottom</div>
```

**Note**: A more common scenario than starting with a sample file might be applying the minification step to the output of a build process. If you are interested in seeing an example of how to generate HTML output, here is some info on how to [render EJS files with Node.js](/ejs-render-file/). The steps in that article can be extended to create a static site generator, and the html-minifier package can be included and used as part of the build process.

### package.json

Next we will want to set up the [package.json](https://docs.npmjs.com/creating-a-package-json-file) file so that we can npm install the html-minifier package. If one is not already created, running the command <kbd>npm init</kbd> and following the prompts will create one. Once the package.json file is in place we can run the command <kbd>npm install html-minifier --save-dev</kbd> to install the html-minifier npm package.

Your package.json file should look similar to this:

```json
{
  "name": "your-package-name-here",
  "version": "1.0.0",
  "devDependencies": {
    "html-minifier": "^4.0.0"
  }
}
```

There may be some additional properties created if using the npm init command, and the default values can be left in place. If you did not use the npm init command you can copy the contents above and run the command <kbd>npm install</kbd>, which will install all the required dependencies.

Now that the html-minifier package is installed we need a way to utilize it from the command line. To do so, an npm scripts property can be added to the package.json file just created. We will need to add one script that will pass option arguments to the html-minifier package command line interface, and we can name this script "html-minify".

Here is what the package.json file should look like with the script added:

```json
{
  "name": "your-package-name-here",
  "version": "1.0.0",
  "scripts": {
    "html-minify": "html-minifier --input-dir src --output-dir dist --file-ext html --remove-comments --collapse-whitespace --minify-js true --minify-css true"
  },
  "devDependencies": {
    "html-minifier": "^4.0.0"
  }
}
```

Let's look at each of the options being passed in to the html-minifier cli, and see what each is specifying.

### html-minifier options

The first option --input-dir is specifying the folder that our source html file is located. In this case the folder name is "src", which was created during the initial step. Following that, --output-dir is specifying the output directory where the minified html file will be added. In this case it is set to "dist", although this can be changed to any folder name.

The --file-ext option is set to html (in this example it is not needed), however if the input directory contains file types other than "html", errors may occur as a result of the attempted minification of those files. In the html-minifier github repository there is open issue to [support multiple file extensions](https://github.com/kangax/html-minifier/pull/1026). A possible workaround for the time being is to add multiple package.json scripts, with each one running a separate command for each of the individual file types that will be minified. Additionally there are many other minifier packages available on npm and one of those may be better suited for file types other than html.

The next two options: --remove-comments and --collapse-whitespace do exactly as they are named, and there is no value to pass to them. If comments need to be retained or white space non-collapsed, these options can be deleted and html-minifier will not alter these properties of the original file.

Depending on whether set to true or false (or not included as the default value is false), the last two options, --minify-js and --minify-css will minify the corresponding source of their type, only if included as inline style or script tags in the html being minified. It may also be good to know that the html-minifier options information states that [clean-css](https://www.npmjs.com/package/clean-css) and [uglify-js](https://www.npmjs.com/package/uglify-js) are used for the minification when these options are included.

To get a full list of all the options supported, it can be helpful to globally install the html-minifier package by running the command <kbd>npm install html-minifier -g</kbd> (this may require administrator access). With the package installed globally, running the command <kbd>html-minifier --help</kbd> will list all of the command line options, their value if applicable, and a short help text description.

### Minify HTML

Now that the html-minify script is added and the options are configured, to use it run the command <kbd>npm run html-minify</kbd>. As a result a new folder called "dist" should have been created where the src folder is located. Within that folder should be the minified version of the index.html file initially created.

Here is what the minified html file should look like:

```
<h1>This is our sample html content</h1><p>Here is some paragraph text.</p><pre>This text is preformatted.

There is more than one line in this text block.

    <code>console.log("code block inside preformatted block.");</code>
</pre><div>some more text at the bottom</div>
```

Notice that the whitespace within the preformatted element is maintained. This is important as those sections need to keep their whitespace as originally formatted, so the html-minifier does not change the desired formatting. For other elements not intended to maintain whitespace they can be reduced to a single line, and the comment at the top has been removed as well. There is no inline Javascript of CSS in this example, but you can add some in and see the effect.

Using the html-minifier package can be helpful to reduce file size and increase performance for users, especially when using a slower internet connection. Even with the small file used for this example, the response size has decreased from 303 bytes to 275 bytes. This is a small amount, but the savings can add up in a typical scenario where file sizes are much larger.

There is also a [web based html minifier](http://kangax.github.io/html-minifier/) made by the same package author.
