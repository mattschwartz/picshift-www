using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.SimpleNotificationService;
using Amazon.SimpleNotificationService.Model;
using Ganss.XSS;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Mail;
using WebsiteLambda.DataTypes;
using WebsiteLambda.Exceptions;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace WebsiteLambda
{
    public class Function
    {
        private readonly int _emailAddressMaxLength;
        private readonly int _messageContentsMaxLength;
        private readonly string _emailTopicArn;
        private readonly HtmlSanitizer _htmlSanitizer;
        private readonly AmazonSimpleNotificationServiceClient _snsClient;

        public Function()
        {
            _emailAddressMaxLength = EnvironmentHelper.GetEmailAddressMaxLength();
            _messageContentsMaxLength = EnvironmentHelper.GetMessageContentsMaxLength();
            _emailTopicArn = EnvironmentHelper.GetEmailTopicArn();
            _htmlSanitizer = new HtmlSanitizer(
                new List<string>(),
                new List<string>(),
                new List<string>(),
                new List<string>(),
                new List<string>(),
                new List<string>());
            _snsClient = new AmazonSimpleNotificationServiceClient();
        }

        public APIGatewayProxyResponse FunctionHandler(APIGatewayProxyRequest request)
        {
            try
            {
                return ProcessRequest(request);
            }
            catch (DataModelValidationException ex)
            {
                Console.WriteLine($"[WRN] Got a badddd request: {ex.Message}, {ex.StackTrace}");
                return new APIGatewayProxyResponse
                {
                    StatusCode = (int)HttpStatusCode.BadRequest,
                    Headers = new Dictionary<string, string>
                    {
                        ["Content-Type"] = "application/json",
                        ["Access-Control-Allow-Origin"] = "*",
                    },
                    Body = ex.ToJson()
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERR] Undefined exception: {ex.Message}, {ex.StackTrace}");
                return new APIGatewayProxyResponse
                {
                    StatusCode = (int)HttpStatusCode.InternalServerError,
                    Headers = new Dictionary<string, string>
                    {
                        ["Content-Type"] = "application/json",
                        ["Access-Control-Allow-Origin"] = "*",
                    },
                    Body = $"{{ \"message\": \"Sorry chief, but we messed up. Try again later.\" }}"
                };
            }
        }

        private APIGatewayProxyResponse ProcessRequest(APIGatewayProxyRequest request)
        {
            Console.WriteLine($"Received API request: '{request.RequestContext.RequestId}'.");
            Console.WriteLine($"Request body: '{request.Body}'.");

            WebsiteMessageRequestModel requestModel = SafeBuildRequestModel(request.Body);
            Console.WriteLine($"Received input: {requestModel}");

            PublishResponse snsPublishResponse = PublishToSns(requestModel);

            return new APIGatewayProxyResponse
            {
                StatusCode = (int)snsPublishResponse.HttpStatusCode,
                Headers = new Dictionary<string, string>
                {
                    ["Content-Type"] = "application/json",
                    ["Access-Control-Allow-Origin"] = "*",
                },
                Body = $"{{ \"message\": \"Your response has been sent dutifully.\" }}"
            };
        }

        private PublishResponse PublishToSns(WebsiteMessageRequestModel requestModel)
        {
            var snsModel = new SnsMessageModel
            {
                FromEmail = requestModel.FromEmail,
                CreatedAt = DateTime.UtcNow,
                MessageBody = requestModel.MessageContents
            };
            string snsMessage = snsModel.GetSnsMessage();

            Console.WriteLine($"Posting message to SNS: {snsMessage}");

            PublishResponse response = _snsClient.PublishAsync(_emailTopicArn, snsMessage).Result;

            Console.WriteLine("Received SNS publish response: [{0}= '{1}', {2}= '{3}'].",
                nameof(PublishResponse.HttpStatusCode),
                response.HttpStatusCode,
                nameof(PublishResponse.MessageId),
                response.MessageId);

            return response;
        }

        private WebsiteMessageRequestModel SafeBuildRequestModel(string body)
        {
            var unsafeModel = JsonConvert.DeserializeObject<WebsiteMessageRequestModel>(body);

            if (unsafeModel == null)
            {
                throw new DataModelValidationException(null, "Invalid request");
            }

            string safeEmailAddress = SafeGetEmailAddress(unsafeModel.FromEmail);
            string safeMessageContents = SafeGetMessageContents(unsafeModel.MessageContents);

            return new WebsiteMessageRequestModel
            {
                FromEmail = safeEmailAddress,
                MessageContents = safeMessageContents
            };
        }

        /// <summary>
        /// Hopefully safe
        /// </summary>
        /// <param name="email"></param>
        /// <returns></returns>
        private string SafeGetEmailAddress(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                throw new DataModelValidationException(nameof(WebsiteMessageRequestModel.FromEmail), "You must provide a valid email address.");
            }

            if (email.Length > _emailAddressMaxLength)
            {
                throw new DataModelValidationException(nameof(WebsiteMessageRequestModel.FromEmail), "That email address looks off. It's way too big. Take it down a notch, bud.");
            }

            MailAddress emailAddress;
            try
            {
                emailAddress = new MailAddress(email);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to parse email address '{email}': {ex.Message}");
                throw new DataModelValidationException(nameof(WebsiteMessageRequestModel.FromEmail), "You provided an invalid email address, bud.");
            }

            return emailAddress.Address;
        }

        /// <summary>
        /// Hopefully safe
        /// </summary>
        /// <param name="messageContents"></param>
        /// <returns></returns>
        private string SafeGetMessageContents(string messageContents)
        {
            if (string.IsNullOrWhiteSpace(messageContents))
            {
                throw new DataModelValidationException(nameof(WebsiteMessageRequestModel.MessageContents), "You must provide a message.");
            }

            if (messageContents.Length > _messageContentsMaxLength)
            {
                throw new DataModelValidationException(nameof(WebsiteMessageRequestModel.MessageContents), "Your message is too long. Trim it down a bit, bud.");
            }

            string sanitizedMessageContents = _htmlSanitizer.Sanitize(messageContents);
            if (string.IsNullOrWhiteSpace(sanitizedMessageContents))
            {
                throw new DataModelValidationException(nameof(WebsiteMessageRequestModel.MessageContents), "You provided an invalid message there, bud.");
            }

            return sanitizedMessageContents;
        }
    }
}
