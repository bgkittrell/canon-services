# Setup

## Install/Auth

- Install the AWS CLI ([https://aws.amazon.com/cli/])
- Install the SAM CLI ([https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html])
- Setup AWS auth for CLI ([https://docs.aws.amazon.com/cli/v1/userguide/cli-chap-authentication.html])
  - (I prefer storing the access key, secret and region in `~/.aws/credentials`)

## Development

While SAM does have support for local development, it currently doesn't support JWT auth in api gateways. The best way to test is to deploy live to AWS for now.

Using the following command, SAM will automatically detect changes in your code or SAM templates and deploy accordingly.

`sam sync`

## Logs

You can access the CloudWatch Logs like so...

`sam logs -n FilesApi/getAllFilesFunction --tail`

## Development Environment

At a minimum you should setup Prettier in your IDE to auto format files based on the provided template. This will ensure consistency and help avoid git conflicts.

# Deployment

## Secrets

A deployment of this project on AWS expects the following variables to be setup in the Systems Manager Parameter Store ([https://us-east-1.console.aws.amazon.com/systems-manager/parameters/])

- Prod.AUTH0_CLIENT_ID
- Prod.AUTH0_CLIENT_SECRET
- Prod.AUTH0_DOMAIN
- Prod.ELEVEN_LABS_SECRET
- Prod.OPENAI_API_KEY
- Prod.STRIPE_ENDPOINT_SECRET
- Prod.STRIPE_SECRET_KEY

## Domain name

The templates will automatically setup various domain names and certificates. You must have a hosted zone setup in Route 53. Once that's setup copy the hosted zone id into the properties in `template.yaml` and the respective domain names such as `files.api.bookboost.app` and SAM will do the rest.

## Deployment

Use the following command to build and deploy the project from the root directory.

`sam build && sam deploy`

You can optionally set `--profile my-aws-credentials` or `--region us-east-2` in the deploy command.

## Serverless Image Handler

Uses CloudFront and lambdas to automatically resize images. To setup follow these steps.

- Import the serverless-image-handler.template CloudFormation Template
  - Use the name of the FilesBucket for `SourceBucketsParameter`
- Setup Domain Name in Route 53
- Setup SSL Certificate
- Add Domain as an Alternate Domain in the new CloudFront Distribution
- Set values of VITE_FILES_BUCKET and VITE_CLOUD_FRONT_URI in front end env file

## SES Setup

To send email we need to setup SES. While in sandbox mode you must verify every email address you send to.

- Create identity for the domain you're sending from (https://us-east-1.console.aws.amazon.com/ses/home?region=us-east-1#/identities)
- Ensure DKIM records are created in Route 53
- When ready for production you must "Request production access" from the SES console
