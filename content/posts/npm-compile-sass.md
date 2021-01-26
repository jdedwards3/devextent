---
title: Compile SASS with npm
metaDescription:
  Use npm package.json scripts, node-sass npm package cli and clean-css npm
  package cli to compile SCSS and minify the css output with Node.js
guid: 99bf307e-00e5-4226-b919-a8a08f8301b6
author: James Edwards
tags:
  - Node.js
  - SASS
image: npm-compile-sass.png
imageAlt: Compile SCSS into CSS
---

There are many different ways to compile [SCSS](https://stackoverflow.com/questions/5654447/whats-the-difference-between-scss-and-sass), one of the [two syntaxes supported by SASS](https://sass-lang.com/documentation/syntax). In this post we will explore the utilization of the [node-sass](https://www.npmjs.com/package/node-sass?activeTab=readme) npm package. We'll also look at how we can use the [clean-css](https://www.npmjs.com/package/clean-css) npm package to minify and optimize the generated output after compiling SCSS into CSS. Both of these techniques are similar to how Bootstrap handles the [compilation](https://github.com/twbs/bootstrap/blob/622c914a3acc1ab933b3e89d8abfdd63feeb4016/package.json#L25) and [minification](https://github.com/twbs/bootstrap/blob/622c914a3acc1ab933b3e89d8abfdd63feeb4016/package.json#L29) of its SCSS files. Please make sure you have [Node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed first.

## SCSS

First an SCSS file is needed, and it can be placed in the root of the project folder. To illustrate the preprocessing of our SCSS file into CSS let's add some style rules that are intentionally utilizing the SCSS syntax. We'll look to the [Sass Basics guide](https://sass-lang.com/guide) for some code snippets.

```scss
// some variables
$font-stack: Helvetica, sans-serif;
$primary-color: #333;

body {
  font: 100% $font-stack;
  color: $primary-color;
}

// some nesting
nav {
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: inline-block;
  }

  a {
    display: block;
    padding: 6px 12px;
    text-decoration: none;
  }
}

// a mixin
@mixin transform($property) {
  -webkit-transform: $property;
  -ms-transform: $property;
  transform: $property;
}

.box {
  @include transform(rotate(30deg));
}
```

Now that we have an SCSS file to process, the next step involves configuring the package.json to install the necessary dependencies and provide a way to compile SCSS with Node.js by adding custom scripts.

## package.json

Using the scripts section of an [npm package.json](https://docs.npmjs.com/files/package.json) file we can execute a series of commands to carry out the compilation of SCSS and optimize the resulting CSS output. A package.json file is required, and can be created running the command <kbd>npm init</kbd> in the project folder and following the prompts, or copying below.

```json
{
  "name": "npmcompilesass",
  "scripts": {}
}
```

Next we'll need to add two packages into the devDependencies of our project. To do so run the following command <kbd>npm install node-sass clean-css-cli --save-dev</kbd>. What will occur is that the node-sass and clean-css npm packages will be installed to the devDependencies of the project. You should also see a node modules folder appear in the root of the project, and there should also be a [package-lock.json](https://docs.npmjs.com/files/package-lock.json) file that was created.

Your package.json file should look like this:

```json
{
  "name": "npmcompilesass",
  "scripts": {},
  "devDependencies": {
    "clean-css-cli": "^4.3.0",
    "node-sass": "^4.12.0"
  }
}
```

If for some reason your file looks different, you can copy the above and run the command <kbd>npm install</kbd>. This will reinstall both packages.

## Compile Sass to CSS using node-sass

With the dependencies available we can add a script to compile the SCSS file created earlier with the node-sass npm package.

```json
{
  "name": "npmcompilesass",
  "scripts": {
    "compile-styles": "node-sass --output-style expanded --source-map true --source-map-contents true --precision 6 styles.scss dist/styles.css"
  },
  "devDependencies": {
    "clean-css-cli": "^4.3.0",
    "node-sass": "^4.12.0"
  }
}
```

Unfortunately, [multi-line npm scripts are not supported](https://stackoverflow.com/questions/36258456/how-can-i-write-multiline-scripts-in-npm-scripts) so the script is quite long, and there are quite a few parameters passed. Luckily the [node-sass command line documentation](https://github.com/sass/node-sass#command-line-interface) can provided detailed info on all of the possible parameters that are supported.

In this case parameters are used to indicate source maps should be generated (for debugging purposes), the amount of decimal precision is capped at 6, and the scss source file to process is styles.scss, which will be processed and output to a file named styles.css in a new folder named dist, located in the root of the project. The name of the dist folder can be changed if needed, and it will be created when the script runs if it does not already exist.

At this point we can run the compile styles script by running the command <kbd>npm run compile-styles</kbd>. However, this is only running node-sass and isn't minifying the css output, so we need to add another script to carry out the css optimization.

## Minify CSS with clean-css

Like the node-sass package, we installed the clean-css package in the first step. To utilize it we'll add an additional script to the package.json file.

```json
{
  "name": "npmcompilesass",
  "scripts": {
    "compile-styles": "node-sass --output-style expanded --source-map true --source-map-contents true --precision 6 styles.scss dist/styles.css",
    "css-minify": "cleancss --level 1 --format breaksWith=lf --source-map --source-map-inline-sources --output dist/styles.min.css dist/styles.css"
  },
  "devDependencies": {
    "clean-css-cli": "^4.3.0",
    "node-sass": "^4.12.0"
  }
}
```

Similar to the compile-styles script, the css-minify script is also quite long and contains many parameters. More info on all the parameters can be found at the [clean-css-cli GitHub repo](https://github.com/jakubpawlowicz/clean-css-cli#cli-options). The parameters being passed in indicate to run clean-css with a certain level of optimization, line break formatting, and to include source maps with the optimized output. The file to optimize is the styles.css file located in the dist folder that was generated by the compile-styles command, and the optimized output will be written to styles.min.css in the same folder. Now that all the required scripts have been added to the package.json file we can first compile, and then minify the scss source, by running the command <kbd>npm run compile-styles</kbd> followed by the command <kbd>npm run css-minify</kbd>. Then looking in the dist folder that was created there should be four files:

- styles.css
- styles.css.map
- styles.min.css
- styles.min.css.map

The two files we are most interested in are styles.css and styles.min.css. These are the browser compatible style sheets that can now be linked in any HTML file.

## CSS

To make sure everything worked correctly your styles.css file should look like this:

```css
body {
  font: 100% Helvetica, sans-serif;
  color: #333;
}

nav ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

nav li {
  display: inline-block;
}

nav a {
  display: block;
  padding: 6px 12px;
  text-decoration: none;
}

.box {
  -webkit-transform: rotate(30deg);
  -ms-transform: rotate(30deg);
  transform: rotate(30deg);
}

/*# sourceMappingURL=styles.css.map */
```

You can also verify the styles.min.css file because it should have identical content with all of the whitespace removed. Also take note that a comment is included at the bottom for the source map file. This can be left as is and allows for seeing the style rules in the original SCSS file from the browser's dev tools.

## Run npm Scripts Sequentially

With the output being generated correctly, there is one additional step we can do to simplify the SCSS processing into one command. Looking back to the scripts section of the package.json file, let's add one more script to combine the other two.

```json
{
  "name": "npmcompilesass",
  "scripts": {
    "compile-styles": "node-sass --output-style expanded --source-map true --source-map-contents true --precision 6 styles.scss dist/styles.css",
    "css-minify": "cleancss --level 1 --format breaksWith=lf --source-map --source-map-inline-sources --output dist/styles.min.css dist/styles.css",
    "process-styles": "npm run compile-styles && npm run css-minify"
  },
  "devDependencies": {
    "clean-css-cli": "^4.3.0",
    "node-sass": "^4.12.0"
  }
}
```

Now by running the command <kbd>npm run process-styles</kbd>, the compile-styles and css-minify scripts will run in series, and it is no longer necessary to execute both scripts separately. The process-styles script is responsible for both compiling the SCSS into css output and minifying it for optimal use.
