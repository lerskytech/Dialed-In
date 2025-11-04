const OpenAI = require('openai');
const twilio = require('twilio');

// Initialize clients with API keys from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// A simple in-memory store for conversation state.
// For a production environment, this should be replaced with a persistent database like Redis.
const conversationState = new Map();

class AdvancedSophiaAgent {
  constructor() {
    this.conversations = conversationState;
  }

  /**
   * Initiates a live, AI-powered call to a lead.
   */
  async initiateAdvancedCall(phoneNumber, leadData) {
    const conversationId = `adv_${Date.now()}`;
    const personalizedOpening = await this.generatePersonalizedOpening(leadData);

    const conversation = {
      id: conversationId,
      customerName: leadData?.name,
      businessType: leadData?.category,
      phase: 'opening',
      history: [{ role: 'assistant', content: personalizedOpening }],
      customerProfile: {}
    };
    this.conversations.set(conversationId, conversation);

    // This webhook URL is where Twilio will send the user's spoken responses.
    // IMPORTANT: For local development, this must be a publicly accessible URL.
    // Use a tool like 'ngrok' to expose your localhost server during testing.
    const webhookUrl = `https://60baa96ee117.ngrok-free.app/api/agent/response/${conversationId}`;

    const twiML = new twilio.twiml.VoiceResponse();
    const gather = twiML.gather({
      input: 'speech',
      action: webhookUrl,
      speechTimeout: 'auto',
      speechModel: 'phone_call'
    });
    gather.say({ voice: 'Polly.Joanna-Neural' }, personalizedOpening);

    try {
      const call = await twilioClient.calls.create({
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        twiml: twiML.toString(),
        timeout: 60
      });

      console.log(`Live call initiated to ${phoneNumber}. SID: ${call.sid}`);
      return {
        success: true,
        message: `Live call initiated successfully to ${leadData.name}.`,
        conversationId,
        callSid: call.sid
      };
    } catch (error) {
      console.error('Twilio call failed:', error);
      return { success: false, message: 'Failed to initiate live call.' };
    }
  }

  /**
   * Processes the transcribed response from the user during a call.
   */
  async processAdvancedResponse(conversationId, transcription) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      console.error(`Conversation not found: ${conversationId}`);
      const twiML = new twilio.twiml.VoiceResponse();
      twiML.say({ voice: 'Polly.Joanna-Neural' }, "I'm sorry, there was a system error. Goodbye.");
      twiML.hangup();
      return twiML.toString();
    }

    conversation.history.push({ role: 'user', content: transcription });

    const sophiaResponse = await this.generateIntelligentResponse(conversation);
    conversation.history.push({ role: 'assistant', content: sophiaResponse });
    this.conversations.set(conversationId, conversation); // Update conversation state

    const webhookUrl = `https://60baa96ee117.ngrok-free.app/api/agent/response/${conversationId}`;
    const twiML = new twilio.twiml.VoiceResponse();
    const gather = twiML.gather({
      input: 'speech',
      action: webhookUrl,
      speechTimeout: 'auto',
      speechModel: 'phone_call'
    });
    gather.say({ voice: 'Polly.Joanna-Neural' }, sophiaResponse);

    // Fallback if the user doesn't say anything
    twiML.say({ voice: 'Polly.Joanna-Neural' }, "It seems you've been quiet. If you're still there, I'm here to help.");
    twiML.hangup();

    return twiML.toString();
  }

  /**
   * Generates an intelligent, contextual response using GPT-4o.
   */
  async generateIntelligentResponse(conversation) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are Sophia, an expert B2B sales AI. You are in a live phone call. Your goal is to understand the customer's needs, qualify them, and book a meeting. Keep your responses concise and natural. Current conversation context: ${JSON.stringify(conversation)}`
          },
          ...conversation.history
        ],
        temperature: 0.8,
        max_tokens: 150
      });

      return response.choices[0].message.content || "I see. Could you tell me more about that?";
    } catch (error) {
      console.error('Error generating intelligent response:', error);
      return "I'm sorry, I'm having a little trouble processing that. Could you please repeat it?";
    }
  }

  /**
   * Generates a personalized opening line for the call.
   */
  async generatePersonalizedOpening(leadData) {
    if (!leadData) {
      return "Hi! This is Sophia calling from EVE Marketing. We help local businesses get more qualified customers. Do you have a quick moment?";
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are Sophia, an expert B2B sales professional. Create a personalized, natural, and engaging opening for a business owner. Reference their business type and create curiosity. Keep it under 25 seconds. Business context: ${JSON.stringify(leadData)}`
          },
          {
            role: "user",
            content: `Create opening for: ${leadData.name} (${leadData.category}) in ${leadData.address}`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      return response.choices[0].message.content || "Hi! This is Sophia calling from EVE Marketing...";
    } catch (error) {
      console.error('Error generating personalized opening:', error);
      return "Hi! This is Sophia calling from EVE Marketing. We help local businesses get more qualified customers. Do you have a quick moment?";
    }
  }
}

module.exports = new AdvancedSophiaAgent();
