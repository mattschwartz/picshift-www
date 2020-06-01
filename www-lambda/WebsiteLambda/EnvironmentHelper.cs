using System;

namespace WebsiteLambda
{
    static class EnvironmentHelper
    {
        private static readonly string EmailAddressMaxLengthEnvironmentVariable = "emailAddressMaxLength";
        private static readonly string MessageContentsMaxLengthEnvironmentVariable = "messageContentsMaxLength";
        private static readonly string SnsEmailTopicArnEnvironmentVariable = "snsEmailTopicArn";

        public static string GetEmailTopicArn()
        {
            return Environment.GetEnvironmentVariable(SnsEmailTopicArnEnvironmentVariable);
        }

        internal static int GetEmailAddressMaxLength()
        {
            string environmentValueString = Environment.GetEnvironmentVariable(EmailAddressMaxLengthEnvironmentVariable);
            if (int.TryParse(environmentValueString, out int result))
            {
                return result;
            }

            throw new ArgumentException($"Received invalid environment variable for {EmailAddressMaxLengthEnvironmentVariable}: {environmentValueString}");
        }

        internal static int GetMessageContentsMaxLength()
        {
            string environmentValueString = Environment.GetEnvironmentVariable(MessageContentsMaxLengthEnvironmentVariable);
            if (int.TryParse(environmentValueString, out int result))
            {
                return result;
            }

            throw new ArgumentException($"Received invalid environment variable for {MessageContentsMaxLengthEnvironmentVariable}: {environmentValueString}");
        }
    }
}
