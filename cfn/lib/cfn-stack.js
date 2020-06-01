"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const iam = require("@aws-cdk/aws-iam");
const sns = require("@aws-cdk/aws-sns");
const subs = require("@aws-cdk/aws-sns-subscriptions");
const lambda = require("@aws-cdk/aws-lambda");
const apigateway = require("@aws-cdk/aws-apigateway");
const snsTopicEmailAddress = 'contact@cassiius.dev';
const lambdaResourceId = 'MessageMeLambda';
const buildSnsPublishTopic = (scope) => {
    const topic = new sns.Topic(scope, `${lambdaResourceId}-Topic`, {
        displayName: 'SNS topic for the MessageMe system',
    });
    topic.addSubscription(new subs.EmailSubscription(snsTopicEmailAddress));
    return topic;
};
const buildLambdaRole = (scope, topic) => {
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
};
const buildMessageMeLambda = (scope, topic, role) => {
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
};
const addCorsOptions = (apiResource) => {
    apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
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
    }), {
        methodResponses: [{
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Credentials': true,
                    'method.response.header.Access-Control-Allow-Origin': true,
                },
            }],
    });
};
const buildLambdaApiGateway = (scope, lambda) => {
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
    });
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
};
/**
 * Define the stack for synthesis.
 */
class WebsiteStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const topic = buildSnsPublishTopic(this);
        const lambdaRole = buildLambdaRole(this, topic);
        const messageMeLambda = buildMessageMeLambda(this, topic, lambdaRole);
        buildLambdaApiGateway(this, messageMeLambda);
    }
}
exports.WebsiteStack = WebsiteStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2ZuLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2ZuLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQXNDO0FBQ3RDLHdDQUF5QztBQUN6Qyx3Q0FBeUM7QUFDekMsdURBQXdEO0FBQ3hELDhDQUErQztBQUMvQyxzREFBdUQ7QUFFdkQsTUFBTSxvQkFBb0IsR0FBRyxzQkFBc0IsQ0FBQztBQUNwRCxNQUFNLGdCQUFnQixHQUFHLGlCQUFpQixDQUFDO0FBRTNDLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxLQUFvQixFQUFFLEVBQUU7SUFDbEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLGdCQUFnQixRQUFRLEVBQUU7UUFDNUQsV0FBVyxFQUFFLG9DQUFvQztLQUNwRCxDQUFDLENBQUM7SUFDSCxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztJQUV4RSxPQUFPLEtBQUssQ0FBQztBQUNqQixDQUFDLENBQUE7QUFFRCxNQUFNLGVBQWUsR0FBRyxDQUFDLEtBQW9CLEVBQUUsS0FBZ0IsRUFBRSxFQUFFO0lBQy9ELE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxnQkFBZ0IsZ0JBQWdCLEVBQUU7UUFDeEUsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDO0tBQzlELENBQUMsQ0FBQztJQUNILEtBQUssQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFL0IsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxHQUFHLGdCQUFnQix1QkFBdUIsRUFBRTtRQUNuRixVQUFVLEVBQUU7WUFDUiwyREFBMkQ7WUFDM0QsSUFBSSxHQUFHLENBQUMsZUFBZSxD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dkMsWUFBWSxLQUFvQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUNoRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QyxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2hELE1BQU0sZUFBZSxHQUFHLG9CQUFvQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdEUscUJBQXFCLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQ2pELENBQUM7Q0FDSjtBQVRELG9DQVNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNkayA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2NvcmUnKTtcbmltcG9ydCBpYW0gPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtaWFtJyk7XG5pbXBvcnQgc25zID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLXNucycpO1xuaW1wb3J0IHN1YnMgPSByZXF1aXJlKCdAYXdzLWNkay9hd3Mtc25zLXN1YnNjcmlwdGlvbnMnKTtcbmltcG9ydCBsYW1iZGEgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtbGFtYmRhJyk7XG5pbXBvcnQgYXBpZ2F0ZXdheSA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5Jyk7XG5cbmNvbnN0IHNuc1RvcGljRW1haWxBZGRyZXNzID0gJ2NvbnRhY3RAY2Fzc2lpdXMuZGV2JztcbmNvbnN0IGxhbWJkYVJlc291cmNlSWQgPSAnTWVzc2FnZU1lTGFtYmRhJztcblxuY29uc3QgYnVpbGRTbnNQdWJsaXNoVG9waWMgPSAoc2NvcGU6IGNkay5Db25zdHJ1Y3QpID0+IHtcbiAgICBjb25zdCB0b3BpYyA9IG5ldyBzbnMuVG9waWMoc2NvcGUsIGAke2xhbWJkYVJlc291cmNlSWR9LVRvcGljYCwge1xuICAgICAgICBkaXNwbGF5TmFtZTogJ1NOUyB0b3BpYyBmb3IgdGhlIE1lc3NhZ2VNZSBzeXN0ZW0nLFxuICAgIH0pO1xuICAgIHRvcGljLmFkZFN1YnNjcmlwdGlvbihuZXcgc3Vicy5FbWFpbFN1YnNjcmlwdGlvbihzbnNUb3BpY0VtYWlsQWRkcmVzcykpO1xuXG4gICAgcmV0dXJuIHRvcGljO1xufVxuXG5jb25zdCBidWlsZExhbWJkYVJvbGUgPSAoc2NvcGU6IGNkay5Db25zdHJ1Y3QsIHRvcGljOiBzbnMuVG9waWMpID0+IHtcbiAgICBjb25zdCBsYW1iZGFSb2xlID0gbmV3IGlhbS5Sb2xlKHNjb3BlLCBgJHtsYW1iZGFSZXNvdXJjZUlkfS1FeGVjdXRpb25Sb2xlYCwge1xuICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICB9KTtcbiAgICB0b3BpYy5ncmFudFB1Ymxpc2gobGFtYmRhUm9sZSk7XG5cbiAgICBjb25zdCBpbmxpbmVQb2xpY3kgPSBuZXcgaWFtLlBvbGljeShzY29wZSwgYCR7bGFtYmRhUmVzb3VyY2VJZH0tQ2xvdWRXYXRjaExvZ3NQb2xpY3lgLCB7XG4gICAgICAgIHN0YXRlbWVudHM6IFtcbiAgICAgICAgICAgIC8vIEFsbG93cyBmb3IgY3JlYXRpbmcgbG9nIHN0cmVhbXMgYW5kIHdyaXRpbmcgbG9ncyB0byB0aGVtXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgYWN0aW9uczogWydsb2dzOkNyZWF0ZUxvZ1N0cmVhbScsICdsb2dzOlB1dExvZ0V2ZW50cyddLFxuICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtgYXJuOmF3czpsb2dzOiR7Y2RrLkF3cy5SRUdJT059OiR7Y2RrLkF3cy5BQ0NPVU5UX0lEfTpsb2ctZ3JvdXA6KmBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGxvZyBncm91cCBhcyBuZWNlc3NhcnlcbiAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ2xvZ3M6Q3JlYXRlTG9nR3JvdXAnXSxcbiAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICBdXG4gICAgfSk7XG5cbiAgICBsYW1iZGFSb2xlLmF0dGFjaElubGluZVBvbGljeShpbmxpbmVQb2xpY3kpO1xuXG4gICAgcmV0dXJuIGxhbWJkYVJvbGU7XG59XG5cbmNvbnN0IGJ1aWxkTWVzc2FnZU1lTGFtYmRhID0gKHNjb3BlOiBjZGsuQ29uc3RydWN0LCB0b3BpYzogc25zLlRvcGljLCByb2xlOiBpYW0uUm9sZSkgPT4ge1xuICAgIGNvbnN0IG1lc3NhZ2VNZUxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24oc2NvcGUsIGxhbWJkYVJlc291cmNlSWQsIHtcbiAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuYXNzZXQoJy4uL3d3dy1sYW1iZGEvV2Vic2l0ZUxhbWJkYS9iaW4vUmVsZWFzZS9uZXRjb3JlYXBwMi4xL1dlYnNpdGVMYW1iZGEuemlwJyksXG4gICAgICAgIGhhbmRsZXI6ICdXZWJzaXRlTGFtYmRhOjpXZWJzaXRlTGFtYmRhLkZ1bmN0aW9uOjpGdW5jdGlvbkhhbmRsZXInLFxuICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLkRPVE5FVF9DT1JFXzJfMSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICAgIGVtYWlsQWRkcmVzc01heExlbmd0aDogJzEwMjQnLFxuICAgICAgICAgICAgbWVzc2FnZUNvbnRlbnRzTWF4TGVuZ3RoOiAnMjU2JyxcbiAgICAgICAgICAgIHNuc0VtYWlsVG9waWNBcm46IHRvcGljLnRvcGljQXJuLFxuICAgICAgICB9LFxuICAgICAgICByb2xlOiByb2xlLFxuICAgICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWVzc2FnZU1lTGFtYmRhO1xufVxuXG5jb25zdCBhZGRDb3JzT3B0aW9ucyA9IChhcGlSZXNvdXJjZTogYXBpZ2F0ZXdheS5JUmVzb3VyY2UpID0+IHtcbiAgICBhcGlSZXNvdXJjZS5hZGRNZXRob2QoJ09QVElPTlMnLFxuICAgICAgICBuZXcgYXBpZ2F0ZXdheS5Nb2NrSW50ZWdyYXRpb24oe1xuICAgICAgICAgICAgaW50ZWdyYXRpb25SZXNwb25zZXM6IFt7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogJzIwMCcsXG4gICAgICAgICAgICAgICAgcmVzcG9uc2VQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiBcIidDb250ZW50LVR5cGUsWC1BbXotRGF0ZSxBdXRob3JpemF0aW9uLFgtQXBpLUtleSxYLUFtei1TZWN1cml0eS1Ub2tlbixYLUFtei1Vc2VyLUFnZW50J1wiLFxuICAgICAgICAgICAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5BY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiBcIicqJ1wiLFxuICAgICAgICAgICAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5BY2Nlc3MtQ29udHJvbC1BbGxvdy1DcmVkZW50aWFscyc6IFwiJ2ZhbHNlJ1wiLFxuICAgICAgICAgICAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5BY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogXCInT1BUSU9OUyxQT1NUJ1wiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIHBhc3N0aHJvdWdoQmVoYXZpb3I6IGFwaWdhdGV3YXkuUGFzc3Rocm91Z2hCZWhhdmlvci5ORVZFUixcbiAgICAgICAgICAgIHJlcXVlc3RUZW1wbGF0ZXM6IHtcbiAgICAgICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6ICd7IFwic3RhdHVzQ29kZVwiOiAyMDAgfScsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICAge1xuICAgICAgICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbe1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6ICcyMDAnLFxuICAgICAgICAgICAgICAgIHJlc3BvbnNlUGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5BY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfV0sXG4gICAgICAgIH0pXG59XG5cbmNvbnN0IGJ1aWxkTGFtYmRhQXBpR2F0ZXdheSA9IChzY29wZTogY2RrLkNvbnN0cnVjdCwgbGFtYmRhOiBsYW1iZGEuRnVuY3Rpb24pID0+IHtcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFSZXN0QXBpKHNjb3BlLCBgJHtsYW1iZGFSZXNvdXJjZUlkfS1BcGlHYXRld2F5YCwge1xuICAgICAgICBoYW5kbGVyOiBsYW1iZGEsXG4gICAgICAgIHByb3h5OiBmYWxzZSxcbiAgICB9KTtcbiAgICBjb25zdCBsYW1iZGFJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYSk7XG5cbiAgICBjb25zdCB2MSA9IGFwaS5yb290LmFkZFJlc291cmNlKCd2MScpO1xuICAgIGNvbnN0IG1lc3NhZ2VzID0gdjEuYWRkUmVzb3VyY2UoJ21lc3NhZ2VzJyk7XG5cbiAgICBhZGRDb3JzT3B0aW9ucyhtZXNzYWdlcyk7XG5cbiAgICBjb25zdCBwb3N0TWVzc2FnZU1vZGVsID0gbmV3IGFwaWdhdGV3YXkuTW9kZWwoc2NvcGUsIGAke2xhbWJkYVJlc291cmNlSWR9LUFwaUdhdGV3YXlNZXNzYWdlTWVSZXF1ZXN0TW9kZWxgLCB7XG4gICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIHJlc3RBcGk6IGFwaSxcbiAgICAgICAgbW9kZWxOYW1lOiAnTWVzc2FnZU1lUmVxdWVzdEJvZHknLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01vZGVsIHNjaGVtYSBmb3IgdGhlIE1lc3NhZ2VNZSByZXF1ZXN0IGJvZHknLFxuICAgICAgICBzY2hlbWE6IHtcbiAgICAgICAgICAgIHNjaGVtYTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVmVyc2lvbi5EUkFGVDQsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgZnJvbUVtYWlsOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICAgICAgbWVzc2FnZUNvbnRlbnRzOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgcG9zdE1lc3NhZ2VFcnJvck1vZGVsID0gbmV3IGFwaWdhdGV3YXkuTW9kZWwoc2NvcGUsIGAke2xhbWJkYVJlc291cmNlSWR9LUFwaUdhdGV3YXlNZXNzYWdlTWVFcnJvclJlc3BvbnNlTW9kZWxgLCB7XG4gICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIHJlc3RBcGk6IGFwaSxcbiAgICAgICAgbW9kZWxOYW1lOiAnTWVzc2FnZU1lRXJyb3JSZXNwb25zZU1vZGVsJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNZXNzYWdlTWUgRXJyb3IgbW9kZWwgcmVzcG9uc2UnLFxuICAgICAgICBzY2hlbWE6IHtcbiAgICAgICAgICAgIHNjaGVtYTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVmVyc2lvbi5EUkFGVDQsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfSlcblxuICAgIG1lc3NhZ2VzLmFkZE1ldGhvZCgnUE9TVCcsIGxhbWJkYUludGVncmF0aW9uLCB7XG4gICAgICAgIGFwaUtleVJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgcmVxdWVzdE1vZGVsczoge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBwb3N0TWVzc2FnZU1vZGVsLFxuICAgICAgICB9LFxuICAgICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgICAgICAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IG5ldyBhcGlnYXRld2F5LkVtcHR5TW9kZWwoKSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc3BvbnNlUGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5BY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAnNDAwJyxcbiAgICAgICAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IHBvc3RNZXNzYWdlRXJyb3JNb2RlbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc3BvbnNlUGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5BY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAnNTAyJyxcbiAgICAgICAgICAgICAgICByZXNwb25zZU1vZGVsczoge1xuICAgICAgICAgICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IHBvc3RNZXNzYWdlRXJyb3JNb2RlbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc3BvbnNlUGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5BY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGFwaTtcbn1cblxuLyoqXG4gKiBEZWZpbmUgdGhlIHN0YWNrIGZvciBzeW50aGVzaXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJzaXRlU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgICAgIGNvbnN0IHRvcGljID0gYnVpbGRTbnNQdWJsaXNoVG9waWModGhpcyk7XG4gICAgICAgIGNvbnN0IGxhbWJkYVJvbGUgPSBidWlsZExhbWJkYVJvbGUodGhpcywgdG9waWMpO1xuICAgICAgICBjb25zdCBtZXNzYWdlTWVMYW1iZGEgPSBidWlsZE1lc3NhZ2VNZUxhbWJkYSh0aGlzLCB0b3BpYywgbGFtYmRhUm9sZSk7XG4gICAgICAgIGJ1aWxkTGFtYmRhQXBpR2F0ZXdheSh0aGlzLCBtZXNzYWdlTWVMYW1iZGEpO1xuICAgIH1cbn1cbiJdfQ==