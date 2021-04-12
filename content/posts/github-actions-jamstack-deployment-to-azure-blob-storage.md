---
title: Deploy a Jamstack website to Azure Blob Storage with GitHub Actions
metaDescription: Automate the build and deployment process of a Jamstack website using a static site generator with GitHub Actions and Azure Storage Static Website hosting.
author: James Edwards
tags:
  - CI/CD
  - Git
guid: 9f269f3f-5eeb-443a-b378-df31830c7267
---

[GitHub Actions](https://github.com/features/actions) are included with Github Repositories and can be used to automate project workflows like building and deploying code. In this example we will see how to automate the build process and deployment of a site built with the [Jamstack](https://jamstack.org/). We can use GitHub Actions to checkout a specific branch in a git repository, and then execute a build process that is common to Jamstack sites that are created with a static site generator like [Next.js](https://nextjs.org/) or [Eleventy](https://www.11ty.dev/). On completion of the static site generator build process, the static site folder will then be uploaded to [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/), utilizing the [static website hosting](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website-how-to?tabs=azure-portal) feature included with Azure Blob Storage.

### Azure Blob Storage Static Website Hosting

In order to use the static website hosting feature included with Azure Blob Storage you need to [create an Azure account](https://azure.microsoft.com/en-us/free/) if you do not already have one. Once you have created your account and logged in you will need to create the Storage Account resource that will provide the Blob Storage service. In the Azure portal select create a new resource and then search for "storage account". Then click create and follow the setup steps that are displayed to give the storage account a name and region. You can leave any pre-configured settings as the default setting.

![Create Storage Account in Azure Portal](/images/portal-storage-account-create.png)

Within the Azure portal navigate to your newly created storage account and in the left side navigation find the section labelled "Settings" and then within that section select the "Static website" feature.

![Storage Account Static website settings](/images/portal-storage-account-static-website.png)

#### Configure Index Document Name and Error Document Path

In the static website settings, enabling the static website feature will automatically generate the primary endpoint based on the storage account name. In the "Index document name" and "Error document path" fields enter the following:

![Storage Account Static Website document name and path settings](/images/portal-storage-account-static-website-enabled.png)

Based on how your static website is configured, or the static site generator that you are using, the "Error document path" might be different than what is shown for this example, however the "Index document name" will most likely remain as "index.html". Make sure to update these settings to correspond to the configuration that you are using. The storage account static website is now available and you can go to the primary endpoint and you will see this:

![static website content does not exist](/images/portal-storage-static-website-not-found.png)

This is good and it means that the static website is setup and publicly available. Now we can setup GitHub Actions to automated deployments anytime there is a commit pushed to the main branch in our GitHub repository.

### Create Remote GitHub Repository and Configure Local Repository Remote

If you haven't already go ahead and [create a new repository for your project](https://docs.github.com/en/github/getting-started-with-github/create-a-repo), and after doing so follow the directions that are displayed to create a new repository from the command line on your local computer. This should result in a new repository that can push to the remote repository created on GitHub and any commits that we make will be applied to the main branch which is named "main". Make sure that you are able to push commits to GitHub and you can see them in your GitHub remote repository interface before proceeding.

**Note:** The following steps that configure the GitHub Actions workflow require that the branch name is set to "main".

#### Add .gitignore File

Additionally you will want to add a ".gitignore" file to your project that minimally contains:

```bash
node_modules
_output
```

The "\_output" folder is included because this is created by the static site generator build process that is configured in the next step. This folder will always contain generated files so it does not need to be tracked by git.

### Setup Static Site Generator

If you already have a repository, that includes a Jamstack site setup with a static site generator, you can proceed without this step. In order to illustrate the [git-centric](https://www.netlify.com/blog/2019/09/27/git-centric-workflow-the-one-api-to-rule-them-all/) deployment process that is promoted by GitHub Actions we can use, [morphic](https://www.npmjs.com/package/@protolith/morphic) a static site generator built with Node.js and TypeScript. You don't need to use a static site generator in order to use GitHub Actions or the Static Website feature included with Azure Blob Storage, however it can be useful since GitHub Actions can execute commands that will invoke the static site generator build process and upon completion carry out the cloud deployment.

#### Install Node.js and Configure package.json

Before proceeding make sure to have [Node.js](https://nodejs.org/en/) and [npm installed](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

In your project folder run the command <kbd>npm init</kbd> and follow the prompts that are displayed to create a package.json file for your project. Then run the command <kbd>npm install @protolith/morphic</kbd>. This will install the morphic static site generator and its dependencies.

#### Add Static Website Content as Markdown Files

In the project folder where the package.json file was created you can then run this series of commands to create some site content.

```bash
mkdir content/pages
```

```bash
mkdir templates
```

```bash
cd content/pages
```

```bash
echo '---
title: Home
---
# <%%= model.title %%>
home page content

<a href="/about/">Go to About Page</a>' > index.md
```

```bash
echo '---
title: Page Not Found
---

The page you are looking for may have been moved or deleted.

[Go to Homepage](/)' > 404.md
```

```bash
echo '---
title: About
---
# <%%= model.title %%>
This is the about page.

<a href="/">Go to Home Page</a>' > about.md
```

```bash
cd ../../templates
```

```bash
echo '<!DOCTYPE html>
<html>
  <head>
    <title><%%= model.title %%></title>
  </head>
  <body>
    <%%- model.content %%>
  </body>
</html>' > index.ejs
```

```bash
cd ..
```

**Note**: make sure the files created (both ".md" and ".ejs" files) are encoded as UTF-8, or the static site generation process will not work. In Visual Studio Code you can change the file encoding by selecting the file and then in the bottom right hand corner toolbar the encoding is displayed. Click the encoding display in the bottom right toolbar to save with the UTF-8 encoding if needed.

#### Build and Serve Static Site Generator Locally

To make sure that morphic is setup correctly and generating the appropriate files you can run the command <kbd>npx morphic --serve</kbd>, and a browser window should open with the home page displaying a link to the about page. You can navigate back and forth from the home page and about pages. Also you can verify the 404 page was generated by going to the path "404.html" so the full url when running locally might be "http://localhost:3000/404.html", which corresponds to the error document path setting configured in the Azure Blob Storage Static Website settings.

### Github Actions Workflow To Deploy Static Site to Azure Blob Storage

We now have our static site configured and ready to deploy with a GitHub Actions Workflow. To create a new GitHub Actions Workflow, that will build and deploy the static site from our GitHub repository, add a new folder within the current project folder named ".github". In the ".github" folder add another folder named "workflows" and within the "workflows" folder create a new workflow YAML file named "main.yml". The "main.yml" file is where we will create the GitHub Actions workflow that will build and deploy a Jamstack site to the Azure Blob Storage Static website. Here is the [complete reference documentation for creating workflows](https://docs.github.com/en/actions/reference) provided by GitHub. We will only use a subset of the available features in our "main.yml" file to build and deploy on a git push command to the main branch in the repository we created. In the "main.yml" file add the following code:

```yml
name: MAIN

on:
  push:
    branches: [main]

env:
  BUILD_COMMAND: npx morphic

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0

      - name: Install Dependencies
        run: npm ci

      - name: Build
        run: ${{ env.BUILD_COMMAND }}

      - name: Update Blobs
        uses: azure/cli@v1.0.0
        with:
          inlineScript: |
            az storage blob sync -c '$web' -s _output --connection-string '${{ secrets.AZURE_STORAGE_CONNECTION_STRING }}'
```

This workflow will be activated anytime there is a git push command for the main branch in the remote git repository. It will setup a GitHub Actions environment that is running on the latest version of the Ubuntu operating system, and then checkout the latest version of the code from the main branch. After checking out the main branch, the workflow invokes the <kbd>npm ci</kbd> command, which is similar to the <kbd>npm install</kbd> command, and is suitable for continuous integration environments. This is required to install the morphic static site generator npm package, similar to how we ran the static site generator locally in a previous step.

With the package.json dependencies installed the "Build" step in the workflow will run the "BUILD_COMMAND" specified as an environment variable. In our case, with the morphic static site generator, this command is the same one as we used before <kbd>npx morphic</kbd>, except this time the <kbd>--serve</kbd> flag is omitted since the files will be deployed to Azure Blob Storage Static Website hosting.

After running the Build command the workflow will have access to the site output folder: "\_output" in our case, and this is what will be used in the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/what-is-azure-cli) portion of the workflow with name "Update Blobs". This uses the [Azure CLI Action](https://github.com/marketplace/actions/azure-cli-action) to permit the use of Azure CLI commands. In this case we want to use the [az storage blob sync](https://docs.microsoft.com/en-us/cli/azure/storage/blob?view=azure-cli-latest#az_storage_blob_sync) command to ensure that "$web" blob container is synced to the the current build "\_output" folder that was just created during the Build step of the workflow file.

In order to sync the files to the Azure Blob container named "$web", we need to pass in the "--connection-string" value that acts an access password for the storage account. Instead of creating a security risk by including the blob storage connection string directly in our publicly available workflow we can use [GitHub Actions Repository Secrets](https://docs.github.com/en/actions/reference/encrypted-secrets) to store secret variables that only the automated workflow environment can access.

### Git Commit Project and Workflow Files

The workflow configuration file is now included in the project, so we can commit the example static files we created and the workflow file using the commands <kbd>git add .</kbd> and then <kbd>git commit -m 'adding website files and workflow'</kbd>. However, before we push these changes to the remote GitHub repository we need to configure the "AZURE_STORAGE_CONNECTION_STRING" GitHub Actions secret value that is referenced in the workflow file.

### Github Actions Secret

In the Azure portal, the storage account connection string can be copied by going to the Storage Account that was created previously. In the left sidebar find the settings section that contains the Access keys configuration.

![Azure Storage connection string settings](/images/portal-storage-account-settings-connection-string.png)

You can choose the connection string for key1 or key2, but make sure to use the connection string field value and not the Key field value.

![Azure storage connection strings](/images/portal-storage-account-access-keys.png)

Copy the connection string from the Azure portal settings and go to your GitHub repository interface, and in the top navigation there will be a section labelled "Settings". Clicking on "Settings" will bring you to a new page with a left side navigation that contains a section labelled "Secrets". This is where we will use the copied Azure Blob storage connection string to create a new GitHub Actions secret. On the Secrets page click the button to add a "New repository secret".

![GitHub Actions add new repository secret](/images/github-actions-secret.png)

Then add the secret name that matches the variable name from the "main.yml" workflow file, in this example it is AZURE_STORAGE_CONNECTION_STRING, and paste the Azure Storage connection string into the Value field.

![GitHub Actions save new repository secret](/images/github-actions-secret-create.png)

Then click "Add Secret" and our GitHub Actions Workflow can now access the Azure Storage connection string to sync files to Azure Blob Storage. Our GitHub Actions secret is now configured and ready for use.

### Git Push to Deploy Static Website with GitHub Actions to Azure Blob Storage Static Website

Now you can run the command <kbd>git push -u origin main</kbd> from your local project and you should see the commit made previously has been pushed to the remote repository in the GitHub interface. In the top navigation of the GitHub repository, the "Actions" tab should now show the workflow automation is underway.

![GitHub Actions workflow build](/images/github-actions-workflow-build.png)

When the workflow build and deployment process completes, navigate to the primary endpoint for the Azure Blob Storage static website, that was displayed in the first step.

![Static site available at Azure Blob Storage static website primary endpoint](/images/github-actions-static-website-deployed.png)

You should see the home page now displays the content of our site and you can navigate to the About page that was created earlier. If you accidentally navigate to a page that does not exist, the error document path is set to 404.html, and Azure Blob Storage will return the 404.md page content that was added as a page within the static site.

Anytime you want to make changes to your site in the future, you can follow the same process as this example by first committing the changes to the main branch and then pushing the changes to the remote GitHub repository. This will trigger the GitHub Actions workflow and the changes will be automatically updated on the static website.
