---
title: Send a POST Request Containing a GraphQL Query with the Fetch API
metaDescription: Use the Fetch API to send a POST request containing a GraphQL query to a GraphQL API server, and display the data that is returned.
author: James Edwards
tags:
  - Web API
  - GraphQL
guid: a1fb9cdc-8fac-4b58-8493-e34a490915eb
image: send-post-request-graphql-query-fetch-api.png
---

[GraphQL](https://github.com/graphql/graphql-spec) is a query language specification that is used for Web APIs to permit the use of API clients to create data queries. The queries can be specific to the client, and they are sent to a GraphQL server that is able to return exactly the data that was requested. A single GraphQL [POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST) request can be used to obtain all of the data that is needed for the current context. This is in contrast to [RESTful APIs](https://en.wikipedia.org/wiki/Representational_state_transfer), that might result in a chain or waterfall of requests, with each request requiring data from the previous, in order to retrieve all of the data from the API server.

Typically a [GraphQL client](https://graphql.org/graphql-js/graphql-clients/) is used to facilitate the client side query building, and to send HTTP POST requests containing GraphQL queries to the GraphQL server responsible for returning the data. It is not required to use a dedicated GraphQL client, as it is possible to send a GraphQL query as a POST request using the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), and this is similar to the process used to [submit FormData using the Fetch API](/fetch-api-post-formdata-object/). To show how to send a POST request containing a GraphQL query with the Fetch API, data from the GraphQL API: [https://content.wpgraphql.com/graphql](https://content.wpgraphql.com/graphql) provided by [WPGraphQL](https://www.wpgraphql.com/) can be used. After fetching the latest posts from the GraphQL API, by sending a POST request containing the GraphQL query, we can display the data as a list with each item title as a link.

### Create HTML File

First, create an HTML file that will link to a JavaScript file containing the code that will send the GraphQL query as a POST request with the Fetch API. After sending the POST request containing the GraphQL query, the result of the query will be displayed as HTML, and before any data is received a no data message is displayed. In the project folder add a new file named "index.html" with the following content:

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Post a GraphQL Query with the Fetch API</title>
  </head>
  <body>
    <div id="data-container">
      <p>no data yet!</p>
    </div>
    <script src="/script.js"></script>
  </body>
</html>
```

### Add JavaScript File

In the "index.html" file there is a JavaScript file referenced that is named "script.js". We can create that file in the same folder as the index html file. After creating "script.js" in the project folder add the following code:

```javascript
const dataFetchDisplay = function ({
  eventListenerSelector,
  eventType,
  dataFetcher,
  displayUpdater,
  dataTargetSelector,
}) {
  document
    .querySelector(eventListenerSelector)
    .addEventListener(eventType, async () => {
      displayUpdater(dataTargetSelector, await dataFetcher());
    });
};
```

The "dataFetchDisplay" function has an options object as the parameter that contains the information needed to send the Fetch API POST request containing a GraphQL query, although we have yet to call this function or define the functions "displayUpdater" and "dataFetcher" that are included in the options parameter and used within the async callback of the event listener that is instantiated, when the "dataFetchDisplay" function is called. Here is how the "dataFetchDisplay" function will be used:

```javascript
dataFetchDisplay({
  eventListenerSelector: "#data-button",
  eventType: "click",
  dataFetcher: getData,
  displayUpdater: updateDisplay,
  dataTargetSelector: "#data-container",
});
```

Notice that the "eventListenerSelector" and "dataTargetSelector" parameters correspond to the ID attributes that are present in the index.html file created in the first step. These values can be changed, but the values must match the HTML document ID attributes. Go ahead and add the invocation of the "dataFetchDisplay" function directly below the function definition previously added to script.js.

### Fetch API POST Request with GraphQL Query

Now that we have the "dataFetchDisplay" function defined and being called, if we try to run this code it will result in an error because the helper functions to get the data and display it are not yet defined. Directly above the "dataFetchDisplay" function add the following code to define the "getData" function that is referenced in the "dataFetcher" options object parameter key value.

```javascript
const getData = async function () {
  return (
    await (
      await fetch("https://content.wpgraphql.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "{ posts { nodes { title, link } } }",
        }),
      })
    ).json()
  ).data.posts.nodes;
};
```

The getData function shown above is where the POST request, sent by the Fetch API, containing the GraphQL query is defined. For this example the GraphQL API is provided by [WPGraphQL](https://www.wpgraphql.com/), and the query will retrieve the link and title information for the ten most recent blog posts. Since we know the format of the data that is returned from the GraphQL query POST request sent with the Fetch API, we can return only the "nodes" in the "getData" function. That way when the "getData" function is used the data is already formatted as an array of post objects.

### Display GraphQL Query Data

Now that we have the "getData" function defined and the GraphQL query data is returned after sending a POST request using the Fetch API, we need to display the data once it is returned from the GraphQL API server. To do this the function that is passed in as the "displayUpdater" parameter in the options object will be used. Add this code above the "dataFetchDisplay" function in the "script.js" file:

```javascript
const updateDisplay = function (selector, data) {
  const list = document.createElement("ul");

  data.forEach(function (item) {
    const listItemLink = document.createElement("a");
    listItemLink.textContent = item.title;
    listItemLink.setAttribute("href", item.link);

    const listItem = document.createElement("li");
    listItem.appendChild(listItemLink);

    list.appendChild(listItem);
  });

  document.querySelector(selector).replaceChildren(list);
};
```

The "updateDisplay" accepts two parameters: one to indicate the target element to insert the HTML that is generated and the second is the data array. In this example a link item is created for each data object using the title. The list of link elements is then used to replace the html of the target element.

By passing the "getData" and "displayUpdater" functions in as parameters to the "dataFetchDisplay" function, both the query and the way it should be displayed can be changed to suit the usage context. The "dataFetchDisplay" function is generic in that sense as the parameters determine what data to display, and how,based on the specific usage of the function.

Putting all of the code sections together should result in a script.js file that looks like this:

```javascript
//script.js

const getData = async function () {
  return (
    await (
      await fetch("https://content.wpgraphql.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "{ posts { nodes { title, link } } }",
        }),
      })
    ).json()
  ).data.posts.nodes;
};

const updateDisplay = function (selector, data) {
  const list = document.createElement("ul");

  data.forEach(function (item) {
    const listItemLink = document.createElement("a");
    listItemLink.textContent = item.title;
    listItemLink.setAttribute("href", item.link);

    const listItem = document.createElement("li");
    listItem.appendChild(listItemLink);

    list.appendChild(listItem);
  });

  document.querySelector(selector).replaceChildren(list);
};

const dataFetchDisplay = function ({
  eventListenerSelector,
  eventType,
  dataFetcher,
  displayUpdater,
  dataTargetSelector,
}) {
  document
    .querySelector(eventListenerSelector)
    .addEventListener(eventType, async () => {
      displayUpdater(dataTargetSelector, await dataFetcher());
    });
};

dataFetchDisplay({
  eventListenerSelector: "#data-button",
  eventType: "click",
  dataFetcher: getData,
  displayUpdater: updateDisplay,
  dataTargetSelector: "#data-container",
});
```

### Test GraphQL Post Request Locally

At this point we have the "index.html" and the "script.js" file setup so we can make sure that it is working by testing it locally. To do this we will need to install the [http-server npm package](https://www.npmjs.com/package/http-server). Before proceeding make sure to have [Node.js](https://nodejs.org/en/) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed as they are required.

#### npm init package.json

Once installed you can open the project folder in a terminal window and run the <kbd>npm init</kbd> command, and follow the prompts that are displayed. This will set up the package.json in the project folder.

#### npm install http-server

After configuring the package.json file run the command <kbd>npm install http-server --save-dev</kbd>. The http-server npm package is now installed as a development dependency.

#### add npm script

In the "scripts" object of the package.json file configuration add the following script:

```json
{
  "scripts": {
    "dev": "http-server"
  }
}
```

The dev script can now be run and this will start the local development environment using the http-server npm package. You should now have a "node_modules" folder that was added to the project folder, and the package.json file should look like this:

```json
{
  "name": "post-graphql-query-fetch-api",
  "version": "1.0.0",
  "description": "",
  "main": "script.js",
  "scripts": {
    "dev": "http-server",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "http-server": "^0.12.3"
  }
}
```

To start the local development environment with http-server run the command <kbd>npm run dev</kbd> and navigate to the url that is displayed in the console output. The development url will most likely be "http://localhost:8080", as this is the default setting for the local server configuration.

After running the <kbd>npm run dev</kbd> command and navigating "http://localhost:8080" you should see the "no data yet" message in your browser and the "get data" button we created earlier. To send the GraphQL query POST request with the Fetch API click the "get data" button, and the latest ten posts should will display on the page.

In some cases it might be beneficial to include a dedicated GraphQL client in your project, but in others using the Fetch API to send a POST request containing a GraphQL query without a GraphQL client can be sufficient. This can save time if the other more advanced features that come with GraphQL clients are not needed, especially if requests to the GraphQL server are infrequent.
