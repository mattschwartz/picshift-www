import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import sns = require('@aws-cdk/aws-sns');
import subs = require('@aws-cdk/aws-sns-subscriptions');
import lambda = require('@aws-cdk/aws-lambda');
import apigateway = require('@aws-cdk/aws-apigateway');

const snsTopicEmailAddress = 'contact@cassiius.dev';
const lambdaResourceId = 'MessageMeLambda';

const buildSnsPublishTopic = (scope: cdk.Construct) => {
    const topic = new sns.Topic(scope, `${lambdaResourceId}-Topic`, {
        displayName: 'SNS topic for the MessageMe system',
    });
    topic.addSubscription(new subs.EmailSubscription(snsTopicEmailAddress));

    return topic;
}

const buildLambdaRole = (scope: cdk.Construct, topic: sns.Topic) => {
    const lambdaRole = new iam.Role(scope, `${lambdaResourceId}-ExecutionRole`, {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    topic.grantPublish(lambdaRole);

    const inlinePolicy = new iam.Policy(scope, `${lambdaResourceId}-CloudWatchLogsPolicy`, {
        statements: [
            // Allows for creating log streams and writing logs to them
            new iam.PolicyStatement({
                actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                effect: iam.Effect.ALLOW,
                resources: [`arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:*`],
            }),
            // Create the log group as necessary
            new iam.PolicyStatement({
                actions: ['logs:CreateLogGroup'],
                effect: iam.Effect.ALLOW,
                resources: ['*'],
            }),
        ]
    });

    lambdaRole.attachInlinePolicy(inlinePolicy);

    return lambdaRole;
}

const buildMessageMeLambda = (scope: cdk.Construct, topic: sns.Topic, role: iam.Role) => {
    const messageMeLambda = new lambda.Function(scope, lambdaResourceId, {
        code: lambda.Code.asset('../www-lambda/WebsiteLambda/bin/Release/netcoreapp2.1/WebsiteLambda.zip'),
        handler: 'WebsiteLambda::WebsiteLambda.Function::FunctionHandler',
        timeout: cdk.Duration.seconds(30),
        runtime: lambda.Runtime.DOTNET_CORE_2_1,
        environment: {
            emailAddressMaxLength: '1024',
            messageContentsMaxLength: '256',
            snsEmailTopicArn: topic.topicArn,
        },
        role: role,
        memorySize: 256,
    });

    return messageMeLambda;
}

const addCorsOptions = (apiResource: apigateway.IResource) => {
    apiResource.addMethod('OPTIONS',
        new apigateway.MockIntegration({
            integrationResponses: [{
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                    'method.response.header.Access-Control-Allow-Origin': "'*'",
                    'method.response.header.Access-Control-Allow-Credentials': "'false'",
                    'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST'",
                },
            }],
            passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
            requestTemplates: {
                'application/json': '{ "statusCode": 200 }',
            },
        }),
        {
            methodResponses: [{
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Credentials': true,
                    'method.response.header.Access-Control-Allow-Origin': true,
                },
            }],
        })
}

const buildLambdaApiGateway = (scope: cdk.Construct, lambda: lambda.Function) => {
    const api = new apigateway.LambdaRestApi(scope, `${lambdaResourceId}-ApiGateway`, {
        handler: lambda,
        proxy: false,
    });
    const lambdaIntegration = new apigateway.LambdaIntegration(lambda);

    const v1 = api.root.addResource('v1');
    const messages = v1.addResource('messages');

    addCorsOptions(messages);

    const postMessageModel = new apigateway.Model(scope, `${lambdaResourceId}-ApiGatewayMessageMeRequestModel`, {
        contentType: 'application/json',
        restApi: api,
        modelName: 'MessageMeRequestBody',
        description: 'Model schema for the MessageMe request body',
        schema: {
            schema: apigateway.JsonSchemaVersion.DRAFT4,
            properties: {
                fromEmail: { type: apigateway.JsonSchemaType.STRING },
                messageContents: { type: apigateway.JsonSchemaType.STRING },
            },
        },
    });

    const postMessageErrorModel = new apigateway.Model(scope, `${lambdaResourceId}-ApiGatewayMessageMeErrorResponseModel`, {
        contentType: 'application/json',
        restApi: api,
        modelName: 'MessageMeErrorResponseModel',
        description: 'MessageMe Error model response',
        schema: {
            schema: apigateway.JsonSchemaVersion.DRAFT4,
            properties: {
                state: { type: apigateway.JsonSchemaType.STRING },
                message: { type: apigateway.JsonSchemaType.STRING },
            },
        }
    })

    messages.addMethod('POST', lambdaIntegration, {
        apiKeyRequired: false,
        requestModels: {
            'application/json': postMessageModel,
        },
        methodResponses: [
            {
                statusCode: '200',
                responseModels: {
                    'application/json': new apigateway.EmptyModel(),
                },
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Credentials': true,
                    'method.response.header.Access-Control-Allow-Origin': true,
                },
            },
            {
                statusCode: '400',
                responseModels: {
                    'application/json': postMessageErrorModel,
                },
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Credentials': true,
                    'method.response.header.Access-Control-Allow-Origin': true,
                },
            },
            {
                statusCode: '502',
                responseModels: {
                    'application/json': postMessageErrorModel,
                },
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Credentials': true,
                    'method.response.header.Access-Control-Allow-Origin': true,
                },
            },
        ]
    });

    return api;
}

/**
 * Define the stack for synthesis.
 */
export class WebsiteStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const topic = buildSnsPublishTopic(this);
        const lambdaRole = buildLambdaRole(this, topic);
        const messageMeLambda = buildMessageMeLambda(this, topic, lambdaRole);
        buildLambdaApiGateway(this, messageMeLambda);
    }
}
