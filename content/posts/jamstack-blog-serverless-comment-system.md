---
title: Build a Serverless Comment System for a Jamstack Blog
metaDescription: Use the GitHub REST API, Azure Serverless Functions, and Node.js to post and pre-render Jamstack blog comments without a database.
guid: 0fe42a74-7cbf-439a-b403-31bdc6c25ad8
author: James Edwards
tags:
  - Serverless
  - Git
  - Node.js
---

[Jamstack](https://jamstack.org/) blogs, or otherwise static sites that are built with prerendered markup can load quickly and cost less to run, however one potential drawback of a serverless approach for a blog can be the lack of a content management system. Without using a database or a headless content management system, blogs built with the Jamstack are most likely storing their content in a git repository, and this git-centric approach to development provides an interesting pathway for storing and managing blog comments. With some help from [Octokit](https://www.npmjs.com/package/@octokit/rest), the REST API client provided by GitHub, the [Simple Git](https://www.npmjs.com/package/simple-git) npm package, [SendGrid](https://www.npmjs.com/package/@sendgrid/mail) email service, and [Azure Serverless Functions](https://docs.microsoft.com/en-us/azure/azure-functions/) comment system can be built that includes comment moderation and email notifications.

### Create GitHub Git Repository

The first GitHub repo that we need to create will be public and is where our comments will ultimately end up. GitHub provides documentation for [creating a repo](https://docs.github.com/en/free-pro-team@latest/github/getting-started-with-github/create-a-repo). After creating the public repository, a [private repository](https://docs.github.com/en/free-pro-team@latest/github/creating-cloning-and-archiving-repositories/about-repository-visibility) is also needed and is going to be used so that comments can be moderated through the creation of pull requests. The private repository also allows for any comment information, like emails, to be filtered out before merging into the public repository.

### HTML Comment Form

With the git repositories set up we can now create a standard HTML form that will submit comments to our serverless function (not yet set up) endpoint.

```html
<!-- form.html -->
<form id="commentForm" action="FUNCTION_ENDPOINT" method="post">
  <input id="postId" type="hidden" name="postId" value="POST_ID" />
  <div>
    <label for="comment">comment</label>
    <textarea required rows="5" id="comment" name="comment"></textarea>
  </div>
  <div>
    <label for="authorName">name</label>
    <input
      required
      type="text"
      id="authorName"
      name="authorName"
      autocomplete="name"
    />
  </div>
  <div>
    <label for="authorEmail">email</label>
    <input
      required
      type="email"
      id="authorEmail"
      name="authorEmail"
      autocomplete="email"
    />
  </div>
  <button type="submit">Submit</button>
</form>
```

In most cases a static site generator would be outputting this form from template files, but the important part is that the form action shown as "FUNCTION_ENDPOINT" will be replaced with the actual url that will be provided by the serverless function in the following section. There also needs to be a way to maintain the relationship between the comment submitted and the blog post it should reference. In this case a hidden field is added with a value of "POST_ID" to maintain this data during the form submit. This can be changed to anything that suits the build process in use, so that comments can be stored with this as a key to indicate which post they belong to.

### Azure Serverless Function

Now that the client side HTML form is in place, we need an endpoint to submit the form to. Azure Javascript functions will be used to provide an endpoint configured to accept HTTP POST requests containing comment data, in the request body, that will be committed by our serverless function to the private git repository. Microsoft provides documentation to [set up a TypeScript function with Visual Studio Code](https://docs.microsoft.com/en-us/azure/azure-functions/create-first-function-vs-code-typescript). Please make sure to reference their documentation before proceeding. Below is the starting code that we will build out TypeScript function with:

```typescript
// comment.ts
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");
  context.res!.headers["Content-Type"] = "application/json";
  context.res!.status = 200;
  context.res!.body = { message: "Success!" };
};
export default httpTrigger;
```

At this point all the function does is set the [Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type) response header and return an [HTTP 200 OK](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200) success status response code with a success message. Next we will npm install the npm packages needed for the functions code.

### npm install

We are going to want to use the following npm packages within the code of the serverless function we are creating:

- [uuid](https://www.npmjs.com/package/uuid)
- [simple-git](https://www.npmjs.com/package/simple-git)
- [rimraf](https://www.npmjs.com/package/rimraf)
- [sendgrid/mail](https://www.npmjs.com/package/@sendgrid/mail)
- [octokit/rest](https://www.npmjs.com/package/@octokit/rest)

To install these packages, all at the same time, and their corresponding types to use with Typescript, run the command: <kbd>npm install @sendgrid/mail @octokit/rest rimraf simple-git uuid @types/node @types/rimraf --save-dev</kbd>.

Then add these import states to the comment.ts file:

```typescript
import * as querystring from "querystring";
import util = require("util");
import uuidv4 = require("uuid/v4");
import * as SendGrid from "@sendgrid/mail";
import * as simpleGit from "simple-git/promise";
import { formHelpers } from "../common/formHelpers";
import { Octokit } from "@octokit/rest";
import fs = require("fs");
import rimrafstd = require("rimraf");
import { tmpdir } from "os";
const rimraf = util.promisify(rimrafstd);
const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
SendGrid.setApiKey(process.env["SendGridApiKey"] as string);
```

The last import statement uses and environment variable to securely access a SendGrid API key. In order to send out notification emails (this will be set up in a later section), create a SendGrid account and configure an API Key. Azure Serverless Functions support adding additional [application settings](https://docs.microsoft.com/en-us/azure/azure-functions/functions-how-to-use-azure-function-app-settings#settings) where the API key can be saved as an environment variable. By using an environment variable we prevent the need to store the SendGrid API key directly in the serverless function source code.

### Validate POST request body

Next add some basic validation to ensure that the comment form is submitted appropriately.

```typescript
const body = querystring.parse(req.body);

if (
  !(body && body.comment && body.postId && body.authorEmail && body.authorName)
) {
  context.res!.status = 400;
  context.res!.body = {
    message: "Comment invalid. Please correct errors and try again.",
  };
  return;
}
```

After parsing the request body using the [querystring module](https://nodejs.org/api/querystring.html) the validation code checks to make sure the form fields are filled out with data. In a production environment these checks would need to be much more strict, to ensure there is no [CSRF](https://en.wikipedia.org/wiki/Cross-site_request_forgery) attacks being attempted.

### Initialize Git Repository with Simple Git

Next we will begin the process of creating a temporary repository in the serverless functions default directory for temporary files using the [os module](https://nodejs.org/api/os.html#os_os_tmpdir) , adding a new branch, and committing the newly submitted comment so that, in a later step, a pull request for the new branch can be created programmatically.

```typescript
//Initialize Git Repository with Simple Git

// generate unique folder name for git repository
const tempRepo = uuidv4();

// create empty directory to store comment file
await mkdir(`${tmpdir}/${tempRepo}/comments`, {
  recursive: true,
});

// initialize simple-git
const git = simpleGit(`${tmpdir}/${tempRepo}`);

// initialize git repository in tempRepo
await git.init();

// set up git config
await Promise.all([
  git.addConfig("user.name", "GITHUB_USERNAME"),
  git.addConfig("user.email", "GITHUB_EMAIL"),
]);

// add the private remote
await git.addRemote(
  "private",
  `https://GITHUB_USERNAME:${process.env["GitHubUserPassword"]}@https://github.com/GITHUB_USERNAME/PRIVATE_REPOSITORY`
);
```

Since this code resides within a serverless function there is no state that is saved in between requests. This requires creating a unique folder and initializing a new git repository every time the serverless function is activated. Once the git repo is initialized in a temp folder the user name and email are configured. These currently set to "GITHUB_USERNAME" and "GITHUB_EMAIL" should be updated to match your account information.

Once the git config is set, a remote is added to reference the private repository that was created earlier. For convenience the remote is named "private", although this can be changed to something more suitable in your case. GitHub requires authentication for private repositories, so the GitHub account password is accessed as an environment variable, similar to the SendGrid API key set up previously. When adding the password application setting it is also a good idea to use a [GitHub personal access token](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token) (PAT) instead of your main GitHub account password. The GitHub PAT can be included the same way a regular password would be.

### Checkout Git Branch with Simple Git

```typescript
//Checkout git branch with Simple Git

// generate unique id for comment
const commentId = uuidv4();

// create branch
try {
  // fetch main branch to base of off
  await git.fetch("private", "main");

  // use postId to see if comments already are saved for this post
  await git.checkout("private/main", ["--", `comments/${body.postId}.json`]);

  // create new branch named with commentID based off main branch
  await git.checkoutBranch(`${commentId}`, "private/main");
} catch (error) {
  // no previous comments are saved for this post
  await git.checkout("private/main");
  await git.checkoutLocalBranch(`${commentId}`);
}
```

Each comment needs a unique identifier, and the uuid npm package is used to generate a GUID that we save the the commentId variable. The code that follows is contained in a try catch block, because in the case of a brand new comment there will not be a file corresponding to the post that contains the comments previously submitted. In this case the checkout of the JSON file with the name of the postId from the parsed request body will throw an error because git will indicate that this file does not exist.

In either case of appending a comment to an existing list or committing the first one, the end result of the try catch block will be a new branch checked out with the name of the commentId that was just generated. Be sure to note the difference between checkoutBranch and checkoutLocalBranch in the Simple Git [git checkout documentation](https://github.com/steveukx/git-js#git-checkout).

### Write JSON File

```typescript
// Write JSON File with updated Comment data

// create comment object to store as JSON in git repository
const comment = {
  id: commentId,
  timestamp: new Date(new Date().toUTCString()).getTime(),
  authorEmail: body.authorEmail,
  authorName: body.authorName,
  bodyText: body.comment,
};

// list of all comments
let comments = [];

// retrieve existing comments
try {
  comments = JSON.parse(
    await readFile(`${tmpdir}/${tempRepo}/comments/${body.postId}.json`, "utf8")
  );
} catch (error) {
  //no previous comments
}

// add newly submitted comment
comments.push(comment);

// update or create new comments file with new comment included
await writeFile(
  `${tmpdir}/${tempRepo}/comments/${body.postId}.json`,
  JSON.stringify(comments, null, 2),
  "utf8"
);
```

Now that the temporary git repository is configured and we have checked out a branch with the latest comments (if any exist), we can update the JSON file containing the comments to include the new one. First, an object is created that represents the new comment data. Then in the following try catch block we attempt to read and parse into JSON, the existing file with the name of the postId included in the request body, corresponding to the blog post commented on.
In the event that this file does not exists there will be an error that is caught and the execution of the code can proceed. In this case when the file cannot be read, because it does not exist, it means that we have no comments saved previously similar to the try catch block used previously during the branch checkout.

Once the list of all comments is hydrated, or if it remains an empty array, the new comment can be added to it. Then the entire list of comments is written back to the same file corresponding the the postId, and the changes to this file are ready to be committed and pushed to the private git repository.

### Git Commit and Push to Private Repository

```typescript
// stage file modifications, commit and push

await git.add(`${tmpdir}/${tempRepo}/comments/${body.postId}.json`);

await git.commit(`adding comment ${commentId}`);

await git.push("private", `${commentId}`);

// delete temporary repository
await rimraf(`${tmpdir}/${tempRepo}/`);
```

Here we are adding the modifications from the file we just wrote to, with the name of the postId, to the branch currently checked out with the name of the commentId, and then that branch is pushed to the private remote origin. Once the push is complete, the temporary directory we previously created is no longer needed, and the rimraf npm package is used to recursively delete the entire directory and its contents.

### Send Notification Emails and Create Pull Request with Octokit

The last bit of code needed for the comment.ts function, will construct two emails, one to you and one to the reader that submitted the comment. It will also use the GitHub Octokit REST API client to create a pull request for the branch that was pushed with the new comment committed. This way the comment can be moderated before displaying publicly. To prevent the comment from being published the pull request can be declined and the branch with the comment can be deleted all within the GitHub interface.

```typescript
//send notifications and create pull request

const userEmail = {
  to: body.authorEmail,
  from: "YOUR_NAME@YOUR_WEBSITE",
  subject: "comment submitted",
  text: "Your comment will be visible when approved.",
};

const adminEmail = {
  to: "ADMIN_EMAIL",
  from: "ADMIN_EMAIL",
  subject: "comment submitted",
  html: `<div>from: ${body.authorName}</div>
         <div>email: ${body.authorEmail}</div>
         <div>comment: ${body.comment}</div>`,
};

await Promise.all([
  SendGrid.send(userEmail),
  SendGrid.send(adminEmail),
  new Octokit({
    auth: process.env["GitHubUserPassword"],
  }).pulls.create({
    owner: "GITHUB_USERNAME",
    repo: "PRIVATE_REPOSITORY",
    title: `${commentId}`,
    head: `${commentId}`,
    base: "main",
  }),
]);
```

Both SendGrid.send() and Octokit.pulls.create() are asynchronous and return a [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). To take advantage of this we use Promise.all() to carry out all three actions: sending two emails and the HTTP Request to the GitHub REST API simultaneously. Using the await keyword ensures that all three promises are resolved before continuing.

When we put all these code sections together the result should look like this:

```typescript
// comment.ts

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as querystring from "querystring";
import util = require("util");
import uuidv4 = require("uuid/v4");
import * as SendGrid from "@sendgrid/mail";
import * as simpleGit from "simple-git/promise";
import { formHelpers } from "../common/formHelpers";
import { Octokit } from "@octokit/rest";
import fs = require("fs");
import rimrafstd = require("rimraf");
import { tmpdir } from "os";
const rimraf = util.promisify(rimrafstd);
const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
SendGrid.setApiKey(process.env["SendGridApiKey"] as string);

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");

  context.res!.headers["Content-Type"] = "application/json";

  const body = querystring.parse(req.body);

  if (
    !(
      body &&
      body.comment &&
      body.postGuid &&
      body.authorEmail &&
      body.authorName
    )
  ) {
    context.res!.status = 400;
    context.res!.body = {
      message: "Comment invalid. Please correct errors and try again.",
    };
    return;
  }

  //Initialize Git Repository with Simple Git

  // generate unique folder name for git repository
  const tempRepo = uuidv4();

  // create empty directory to store comment file
  await mkdir(`${tmpdir}/${tempRepo}/comments`, {
    recursive: true,
  });

  // initialize simple-git
  const git = simpleGit(`${tmpdir}/${tempRepo}`);

  // initialize git repository in tempRepo
  await git.init();

  // set up git config
  await Promise.all([
    git.addConfig("user.name", "GITHUB_USERNAME"),
    git.addConfig("user.email", "GITHUB_EMAIL"),
  ]);

  // add the private remote
  await git.addRemote(
    "private",
    `https://GITHUB_USERNAME:${process.env["GitHubUserPassword"]}@https://github.com/GITHUB_USERNAME/PRIVATE_REPOSITORY`
  );

  //Checkout git branch with Simple Git

  // generate unique id for comment
  const commentId = uuidv4();

  // create branch
  try {
    // fetch main branch to base of off
    await git.fetch("private", "main");

    // use postID to see if comments already are saved for this post
    await git.checkout("private/main", ["--", `comments/${body.postId}.json`]);

    // create new branch named with commentID based off main branch
    await git.checkoutBranch(`${commentId}`, "private/main");
  } catch (error) {
    // no previous comments are saved for this post
    await git.checkout("private/main");
    await git.checkoutLocalBranch(`${commentId}`);
  }

  // Write JSON File with updated Comment data

  // create comment object to store as JSON in git repository
  const comment = {
    id: commentId,
    timestamp: new Date(new Date().toUTCString()).getTime(),
    authorEmail: body.authorEmail,
    authorName: body.authorName,
    bodyText: body.comment,
  };

  // list of all comments
  let comments = [];

  // retrieve existing comments
  try {
    comments = JSON.parse(
      await readFile(
        `${tmpdir}/${tempRepo}/comments/${body.postId}.json`,
        "utf8"
      )
    );
  } catch (error) {
    //no previous comments
  }

  // add newly submitted comment
  comments.push(comment);

  // update or create new comments file with new comment included
  await writeFile(
    `${tmpdir}/${tempRepo}/comments/${body.postId}.json`,
    JSON.stringify(comments, null, 2),
    "utf8"
  );

  // stage file modifications, commit and push

  await git.add(`${tmpdir}/${tempRepo}/comments/${body.postId}.json`);

  await git.commit(`adding comment ${commentId}`);

  await git.push("private", `${commentId}`);

  // delete temporary repository
  await rimraf(`${tmpdir}/${tempRepo}/`);

  //send notifications and create pull request

  const userEmail = {
    to: body.authorEmail,
    from: "YOUR_NAME@YOUR_WEBSITE",
    subject: "comment submitted",
    text: "Your comment will be visible when approved.",
  };

  const adminEmail = {
    to: "ADMIN_EMAIL",
    from: "ADMIN_EMAIL",
    subject: "comment submitted",
    html: `<div>from: ${body.authorName}</div>
           <div>email: ${body.authorEmail}</div>
           <div>comment: ${body.comment}</div>`,
  };

  await Promise.all([
    SendGrid.send(userEmail),
    SendGrid.send(adminEmail),
    new Octokit({
      auth: process.env["GitHubUserPassword"],
    }).pulls.create({
      owner: "GITHUB_USERNAME",
      repo: "PRIVATE_REPOSITORY",
      title: `${commentId}`,
      head: `${commentId}`,
      base: "main",
    }),
  ]);

  context.res!.status = 200;
  context.res!.body = {
    message: "Success!",
  };
};

export default httpTrigger;
```

At this point, we have one of the two serverless functions completed! Next we will need a way to moderate comments that are submitted to the comment.ts function shown above. To do this another serverless function will be used, which we will name "comment-merge.ts". The goal of this function will be to integrate moderated comments into the public repo that was created initially, and to filter out any sensitive data that should not be publicly displayed.

### GitHub Webhook

Before beginning the code of the comment-merge.ts function a [GitHub webhook](https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/about-webhooks) needs to be created that will send a POST request on pull request events. In the private repository settings on GitHub [add a webhook](https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/creating-webhooks#setting-up-a-webhook) that points to the serverless function url, and select only the pull request event rather than the default of activating for all of the event types. This will enable the comment-merge.ts function to be activated anytime we accept one of the pull requests created as a result of a new comment submission.

Now that the GitHub webhook is configured to listen for pull request events occurring in the private repository we can set up the second serverless function to act on these events. There is one additional npm package that will be needed for this function, and it can be installed by running the command <kbd>npm install glob @types/glob --save-dev</kbd>. This will install the glob npm package and the corresponding types.

The same beginning code from the first function can be used for the merge function, so we can skip ahead a bit and look at the imports that will be needed.

```typescript
// comment-merge.ts
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import util = require("util");
import * as querystring from "querystring";
import * as simpleGit from "simple-git/promise";
import fs = require("fs");
import { tmpdir } from "os";
import uuidv4 = require("uuid/v4");
import globstd = require("glob");
import rimrafstd = require("rimraf");
const rimraf = util.promisify(rimrafstd);
const glob = util.promisify(globstd);
const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
```

These should look similar to the first function, with the glob package also being imported.

### Validate GitHub Webhook Post Request

Now we can add code that will parse the request body that is sent from the GitHub webhook. The webhook is sent with the data needed as the value of the payload property. Like the request body of our initial comment function the querystring package is used to parse the payload and then JSON.parse is used to create an object representing the data.

```typescript
// validate github webhook payload

//request content type is configured in GitHub webhook settings
const payload = req.body;

if (
  payload.action != "closed" ||
  payload.pull_request.base.ref != "main" ||
  !payload.pull_request.merged_at
) {
  return;
}
```

Since this webhook activates on any event regarding a pull request, whether that be opening or closing, we need to make sure that this code only runs when the pull request is closed. Secondly, the pull request branch needs to match the main branch so that pull requests from other branches are ignored. Lastly, the merged_at value is checked to make sure this pull request has been merged before closing. If the pull request is closed and not merged (the comment is spam) we can ignore the following post request sent by GitHub.

In addition to checking the payload properties shown above, it is a good idea to secure the webhook to make sure the serverless function is only activating when a request is sent from GitHub. This can prevent unwanted requests from being processed, and is a good idea to include when running this code in a production environment.

### Add Public and Private GitHub Remotes

```typescript
// create temp repo and add remotes

const tempRepo = uuidv4();

await mkdir(`${tmpdir}/${tempRepo}/comments`, {
  recursive: true,
});

const git = simpleGit(`${tmpdir}/${tempRepo}`);

await git.init();

await Promise.all([
  git.addConfig("user.name", "GITHUB_USERNAME"),
  git.addConfig("user.email", "GITHUB_EMAIL"),
]);

await Promise.all([
  git.addRemote(
    "private",
    `https://GITHUB_USERNAME:${process.env["GitHubUserPassword"]}@https://github.com/GITHUB_USERNAME/PRIVATE_REPOSITORY`
  ),
  git.addRemote(
    "public",
    `https://GITHUB_USERNAME:${process.env["GitHubUserPassword"]}@https://github.com/GITHUB_USERNAME/PUBLIC_REPOSITORY`
  ),
]);
```

This code is nearly the same as the temporary git repo creation and initialization that was needed for the first function. The main difference is that two remotes are being added this time, one being the private repository where the comment is stored, and the second is the public repository where moderated comments will be merged into.

Make sure to include the username and password in the remote url for both the private and public remotes, even though for public GitHub repositories this is usually not necessary. This is a result of the Azure serverless function configuration requiring authentication in order to work as expected. If it is not included, when trying to push to the public repository after merging the comment, the git push will fail silently and the function will timeout.

### Git Checkout and Fetch

After configuring the remotes some additional git commands are required to checkout the correct branches and fetch the latest file modifications.

```typescript
// fetch public and integrate with latest modifications from private repo

await git.fetch("public", "main");

await git.checkout("main", ["--", "comments/"]);

await git.checkoutBranch("main", "main");

await git.fetch("private", "main");

await git.checkout("main", ["--", "comments/"]);
```

This code first fetches the public remote so that the folder containing previously posted comments can be checked out. With the comment data from the main branch of the public repository now included in the temporary repository, the same fetch and checkout commands are used to integrate the private remote where the main branch includes comments that have passed moderation and their corresponding pull request has been merged.

### Filter Out Private Data

Now that the temporary git repository has the newest comment, there may be information that should not be made public, like user emails. Before we commit and push the new comment to the public repository we can filter the comment data to remove any information that should not be public. This is also the point where the glob npm package will be utilized.

```typescript
// filter private data from comments

// retrieve comment file paths
const paths = await glob(`comments/**/*.json`, {
  cwd: `${tmpdir}/${tempRepo}/`,
});

// wait for all paths to process asynchronously
await Promise.all(
  paths.map(async (path) => {
    let pathData = [];

    //read JSON file with comment info
    pathData = JSON.parse(
      await readFile(`${tmpdir}/${tempRepo}/${path}`, "utf8")
    );

    // filter out private info
    const publicData = pathData.map((item) => {
      const { authorEmail, ...store } = item;
      return store;
    });

    // write file back to original with private data removed
    await writeFile(
      `${tmpdir}/${tempRepo}/${path}`,
      JSON.stringify(publicData, null, 2),
      "utf8"
    );
  })
);
```

This code gets all the paths for the files where comments are stored. Then each path is processed and the file in the temporary folder is read and JSON.parse is used to create an object that we can remove any private data from before publishing. In this case the authorEmail key/value pair is being removed from the comment object, using [destructuring assignment syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment), and any remaining properties are kept in place. The filtered data is then written back to the file matching the path using JSON.stringify to retain the original formatting.

### Git Commit and Push to Public Repository

```typescript
// add filtered comment file modifications, commit, and push

await git.add(`${tmpdir}/${tempRepo}/comments/*.json`);

await git.commit("approving comment");

await git.push("public", "main");

await rimraf(`${tmpdir}/${tempRepo}/`);
```

The last part of the comment merge function includes adding the modifications made the to the comment files to include the new comment with private data filtered out, and committing those changes to the main branch. Once the changes are committed the branch is pushed to the public repository and the comment can now be displayed.

In the case where a static site generator is being used for the blog, this push can trigger a new build and the comment can be included by the build process. The last thing to do, as done in the first function, is to delete the temporary git repository folder since it is no longer needed for the duration of this request.

The comment-merge.ts with all code added should look like this:

```typescript
// comment-merge.ts
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import util = require("util");
import * as querystring from "querystring";
import * as simpleGit from "simple-git/promise";
import fs = require("fs");
import { tmpdir } from "os";
import uuidv4 = require("uuid/v4");
import globstd = require("glob");
import rimrafstd = require("rimraf");
const rimraf = util.promisify(rimrafstd);
const glob = util.promisify(globstd);
const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");

  context.res!.headers["Content-Type"] = "application/json";

  //request content type is configured in GitHub webhook settings
  const payload = req.body;

  if (
    payload.action != "closed" ||
    payload.pull_request.base.ref != "main" ||
    !payload.pull_request.merged_at
  ) {
    return;
  }

  // create temp repo and add remotes

  const tempRepo = uuidv4();

  await mkdir(`${tmpdir}/${tempRepo}/comments`, {
    recursive: true,
  });

  const git = simpleGit(`${tmpdir}/${tempRepo}`);

  await git.init();

  await Promise.all([
    git.addConfig("user.name", "GITHUB_USERNAME"),
    git.addConfig("user.email", "GITHUB_EMAIL"),
  ]);

  await Promise.all([
    git.addRemote(
      "private",
      `https://GITHUB_USERNAME:${process.env["GitHubUserPassword"]}@https://github.com/GITHUB_USERNAME/PRIVATE_REPOSITORY`
    ),
    git.addRemote(
      "public",
      `https://GITHUB_USERNAME:${process.env["GitHubUserPassword"]}@https://github.com/GITHUB_USERNAME/PUBLIC_REPOSITORY`
    ),
  ]);

  // fetch public and integrate with latest modifications from private repo

  await git.fetch("public", "main");

  await git.checkout("main", ["--", "comments/"]);

  await git.checkoutBranch("main", "main");

  await git.fetch("private", "main");

  await git.checkout("main", ["--", "comments/"]);

  // filter private data from comments

  // retrieve comment file paths
  const paths = await glob(`comments/**/*.json`, {
    cwd: `${tmpdir}/${tempRepo}/`,
  });

  // wait for all paths to process asynchronously
  await Promise.all(
    paths.map(async (path) => {
      let pathData = [];

      //read JSON file with comment info
      pathData = JSON.parse(
        await readFile(`${tmpdir}/${tempRepo}/${path}`, "utf8")
      );

      // filter out private info
      const publicData = pathData.map((item) => {
        const { authorEmail, ...store } = item;
        return store;
      });

      // write file back to original with private data removed
      await writeFile(
        `${tmpdir}/${tempRepo}/${path}`,
        JSON.stringify(publicData, null, 2),
        "utf8"
      );
    })
  );

  // add filtered comment file modifications, commit, and push

  await git.add(`${tmpdir}/${tempRepo}/comments/*.json`);

  await git.commit("approving comment");

  await git.push("public", "main");

  await rimraf(`${tmpdir}/${tempRepo}/`);

  context.res!.status = 200;
  context.res!.body = { message: "success" };
};

export default httpTrigger;
```

A blog built with the Jamstack can now integrate comments in a way that is very cost effective and maintain a git-centric approach. The comments that readers submit can be moderated, filtered, and are stored right along side the blog content. This way the corresponding JSON files that are created can be integrated into an existing build process and dynamically pre-rendered with the content, eliminating the need to make client side requests to fetch data that would harm the user experience or affect page load time.

Azure serverless functions provide a cost effective way to have on demand cloud compute, without the need to have a server running all of the time, only to be used occasionally. One possible drawback of this approach is that sometimes, due to cold start delays of the the serverless function, when the user submits a comment it can be somewhat slow to process. This is a result of the comment.ts function, while asynchronous, initializing and checking out a git repository, sending two emails and utilizing the GitHub REST API to programmatically create a pull request. It may reduce processing times to remove the email notification component if not needed for your use case.
