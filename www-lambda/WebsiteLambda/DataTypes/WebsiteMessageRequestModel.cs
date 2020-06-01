using Newtonsoft.Json;

namespace WebsiteLambda.DataTypes
{
    public class WebsiteMessageRequestModel
    {
        /// <summary>
        /// Who sent the message.
        /// </summary>
        [JsonProperty("fromEmail")]
        public string FromEmail { get; set; }

        /// <summary>
        /// The contents of the message.
        /// </summary>
        [JsonProperty("messageContents")]
        public string MessageContents { get; set; }

        public override string ToString()
        {
            return $"[{nameof(FromEmail)}= '{FromEmail}', {nameof(MessageContents)}= '{MessageContents}']";
        }
    }
}
