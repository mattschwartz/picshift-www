using System;

namespace WebsiteLambda.Exceptions
{
    class DataModelValidationException : Exception
    {
        public string FailedArgument { get; private set; }

        public string Reason { get; private set; }

        public DataModelValidationException(string failedArgument, string reason)
        {
            FailedArgument = failedArgument;
            Reason = reason;
        }

        public string ToJson()
        {
            return $"{{ \"failedArgument\": \"{FailedArgument}\", \"reason\": \"{Reason}\" }}";
        }
    }
}
