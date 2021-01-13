---
title: Send Emails with Node.js
guid: 4b9f6847-9676-49e2-a49f-1f91a134fbef
metaDescription:
  Use the SendGrid npm package and a SendGrid API key to send emails with
  Node.js and TypeScript.
author: James Edwards
tags:
  - Node.js
  - Serverless
  - TypeScript
---

There are a variety of ways to send an email with Node.js. One way is to utilize
the email service offered by [SendGrid](https://sendgrid.com/). The
[email API](https://sendgrid.com/solutions/email-api/) has a
[free plan](https://sendgrid.com/pricing/), which does have a usage limit,
specified on their website, but it should be enough for example purposes. To use
the
[SendGrid Mail Service npm package](https://www.npmjs.com/package/@sendgrid/mail),
an API key is required which can be obtained by
[creating a new SendGrid account](https://signup.sendgrid.com/).

## SendGrid API Key

If you are having trouble creating an API key, please view the
[API Keys documentation](https://sendgrid.com/docs/ui/account-and-settings/api-keys/)
provided by SendGrid. With the API key obtained, we can begin writing code that
will utilize the free SendGrid service. You should not "hardcode" your API key
into your application code. A more secure way of granting the application access
to your account API key is to store it as an environment variable.

## Azure Serverless Function

In order to send the email we can use a serverless function, for this example we
will use a
[JavaScript Azure Function](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node).
The serverless function will accept an HTTP post request and trigger the sending
of an email to the address provided in the form submission. In order to do this
we will need an HTML form. Before using the following code, it's a good idea to
check out this other post on
[Submitting Form Data with the Fetch API](/fetch-api-post-formdata-object/).

Once the client side code is setup to post a form with the email address and
email message, we can set up the serverless function to handle sending the email
with the information from the form submission.

```typescript
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as querystring from "querystring";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");

  // form data submitted as query string in request body
  const body = querystring.parse(req.body);
};

export default httpTrigger;
```

This is the base code needed for the Azure serverless function. Below we will
look to see how the data contained in the request body will be used to generate
the email.

## Send Email with SendGrid and Node.js

**_NOTE_**: This code is setup as if the request body contains two keys, one for
emailAddress and one for emailMessage. Additionally, the SendGrid API key
obtained earlier is accessed here from an environment variable. See the Azure
documentation to
[add an application setting](https://docs.microsoft.com/en-us/azure/azure-functions/functions-how-to-use-azure-function-app-settings).
Application settings are accessed as environment variables in the serverless
function code.

```typescript
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as querystring from "querystring";
import * as SendGrid from "@sendgrid/mail";
SendGrid.setApiKey(process.env["SendGridApiKey"] as string)

const httpTrigger: AzureFunction = async function(
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.")

  // form data submitted as query string in request body
  const body = querystring.parse(req.body)

  // check to make sure form was submitted with field data entered
  if (body && body.emailAddress && body.emailMessage)
    // create an email options object
    const email = {
      to: process.env["SendGridApiKey"],
      from: "noreply@yourdomain.com",
      subject: "Hello! This email was sent with Node.js",
      html: `<div>This email is from: ${body.emailAddress}</div>
      <div>message: ${body.emailMessage}</div>`

   try {
     await SendGrid.send(email);
   }catch(error){
     throw error;

    context.res!.status = 200;
    context.res!.body = {
      message: "Email successful! Check email for the message."
    }
  }else{
    context.res!.status = 400;
    context.res!.body = {
     message: "Form submission is invalid. Please try again."
   }
}

export default httpTrigger;
```

Prior to the function code the SendGrid Mail Service package is imported.
Immediately following the setApiKey method is called and the environment
variable, stored as an application setting, is passed in. The SendGrid package
is now initialized and ready to be used in the code that sends the email. The
api key is typecast as a string here, because in this example
[TypeScript](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node#typescript)
has been selected as the language. If you are not using TypeScript this typecast
should be removed as it is not needed.

The serverless function code first checks to make sure the form was submit with
the field data entered. If the form submission was valid and an email options
object is created with the form data. ES6 template literals are used here to,
instead of standard string concatenation, build the email message that is saved
as the email object html key. It is called html because SendGrid permits the
sending of html emails. The result of using ES6 template literals are a concise
and readable block of code can be easily adjusted in the future if needed.

The email object is then passed to the SendGrid send method provided by the
SendGrid Mail Service npm package. Notice, that since this is an async method it
must be awaited before allowing the code execution to proceed. The send method
call is also wrapped in a try catch block. This way if the email service fails
the serverless function will return a server error notifying the client.

Using Sendgrid makes it even easier to manage and prevents potential issues with
spam filters. This approach can be useful if we are building a site with the
[Jamstack](https://jamstack.org/), since a server is not required. Additionally,
if the email usage limits are within the free plan of SendGrid, the cost savings
can be quite substantial. It is also worth noting that when using Azure
Serverless Functions, we can use the same Azure account to create and link to a
Sendgrid account, which includes tens of thousands of free emails per month. To
find it search for SendGrid in the Azure Portal dashboard, and follow the setup
instructions from there.
