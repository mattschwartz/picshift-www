using System;

namespace WebsiteLambda.DataTypes
{
    class SnsMessageModel
    {
        public string FromEmail { get; set; }
        public string MessageBody { get; set; }
        public DateTime CreatedAt { get; set; }

        public string GetSnsMessage()
        {
            return $"[{CreatedAt} UTC] You've received a new message from '{FromEmail}' (content length: {MessageBody?.Length ?? 0} bytes)\n" +
                $"-------------------------------\n" +
                $"BEGIN MESSAGE\n" +
                $"-------------------------------\n\n" +
                $"{MessageBody}\n\n" +
                $"-------------------------------\nEND MESSAGE\n" +
                $"-------------------------------\n\n";
        }
    }
}
