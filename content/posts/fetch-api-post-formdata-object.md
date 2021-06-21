---
title: Submit FormData Object Using the Fetch API
metaDescription: Create an HTML form and post formdata with the ES6 Fetch API and TypeScript.
guid: b0ef09d3-6b55-4af0-a911-0682b359aa0e
author: James Edwards
tags:
  - TypeScript
  - Web API
image: fetch-api-post-formdata-object-2.png
imageAlt: Submit FormData with ES6 Fetch API
---

The JavaScript [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) API provides a utility to make [AJAX](https://developer.mozilla.org/en-US/docs/Web/Guide/AJAX) requests. This post will show how ES6 syntax can be used with Typescript and the Fetch API to submit an HTML form. Using the Fetch API in conjunction with other [Web API's](https://developer.mozilla.org/en-US/docs/Web/API) a post request can be sent, containing [FormData Objects](https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects) in the body of the request.

### HTML Form

First we need to create an html file, let's call it index.html, with a form element to capture the input values we are going to submit using JavaScript.

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Example Form</title>
  </head>
  <body>
    <form id="myForm" action="myFormAction" method="post">
      <!-- this input is hidden with a value already set -->
      <input type="hidden" id="userId" name="userId" value="3" />
      <label for="firstName">first name</label>
      <input type="text" id="firstName" name="firstName" />
      <button type="submit">Submit</button>
    </form>
    <script src="form.js"></script>
  </body>
</html>
```

Take note that the value for the form action attribute is a placeholder. In real usage this would be replaced with url that you would like to submit the form to. One of the inputs is type=hidden to show that we can submit hidden elements using this technique. Additionally there is one input to capture first name and a button to submit the form using the HTTP post method.

### Typescript Form Submit

Next we'll need to write form.ts so the TypeScript compiler can generate the JavaScript file, form.js, referenced in index.html. The code in form.ts will handle the form submit by making an AJAX request. If you haven't already now is a good time to read my other post [Compile Typescript with npm](/npm-compile-typescript/). There you will find instructions on how to install and configure TypeScript to accommodate the usage below.

The code below assumes the endpoint we are submitting the form to, in the sample HTML action="myFormAction", will be returning a response that has the [Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type) header set to [application/json](https://www.iana.org/assignments/media-types/application/json).

To begin an event listener is created to listen for all form submit events. Notice that the callback function is marked as an async function. Using the async modifier allows for the use of the await keyword when executing the asynchronous Fetch request.

```typescript
// form.ts

// listen for any form submit event
document.body.addEventListener("submit", async function (event) {});
```

Inside the callback the first line of code prevents the default action from occurring. Without preventing the default, the browser would attempt to navigate to the URL of the form action attribute when the form is submitted.

```typescript
// form.ts

// listen for any form submit event
document.body.addEventListener("submit", async function (event) {
  event.preventDefault();
});
```

Next a variable for the form element is created and cast to an [HTMLFormElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement) to allow access to the action and method properties.

```typescript
// form.ts

// listen for any form submit event
document.body.addEventListener("submit", async function (event) {
  event.preventDefault();

  const form = event.target as HTMLFormElement;
});
```

### Fetch API Post Form Data

Then the result variable is created and it is used to store the response sent following the Fetch request. The Fetch request returns a promise and must be awaited so that the result can be obtained. The URL passed into the Fetch method is set to the action of the form, and the options contains keys for method and body values. The form method, like the action, is available from HTMLFormElement.

```typescript
// form.ts

// listen for any form submit event
document.body.addEventListener("submit", async function (event) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;

  // casting to any here to satisfy tsc
  // sending body as x-www-form-url-encoded
  const result = await fetch(form.action, {
    method: form.method,
    body: new URLSearchParams([...(new FormData(form) as any)]),
  })
    .then((response: Response) => response.json())
    .then((json) => json)
    .catch((error) => console.log(error));
});
```

Notice the use of [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) to transform the [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) into an array of key-value pairs. This may seem redundant, but the Edge browser cannot iterate over FormData objects. By transforming the object into an array, Edge is able to successfully construct the [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) object.

Interestingly the current [TypeScript definition for URLSearchParams](https://github.com/microsoft/TypeScript/blob/75301c8e2ce498359a6b33c3f9c9a6a1bd5980c0/lib/lib.dom.d.ts#L16109) does not permit a FormData object to be passed into the constructor, however this is valid JavaScript. To satisfy the TypeScript compiler the FormData object is cast to any. This allows a URLSearchParams object to be constructed from the FormData object which itself is constructed from the HTMLFormElement. Since the body of the Fetch request is of the type URLSearchParams (hint: it looks like a ?query=string) the resulting Content-Type of the request body will be x-www-form-url-encoded. This allows for the server to parse it as it would a normal form submission.

Now when the form in the index.html file is submitted the submit event listener will override the default browser behavior and submit the form using an AJAX request. Even without an actual endpoint to receive the request you should still be able to verify the code is working because the resulting error "Failed to fetch" will be logged to the console.
