// Handle user's choice input
import { VoiceResponse, storyNodes, getUserSession, updateUserSession, checkRateLimit, validatePhoneNumber } from './shared.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }


  const twiml = new VoiceResponse();
  const phoneNumber = req.body.From;
  const choice = req.body.Digits;

  // Validate phone number format
  if (!validatePhoneNumber(phoneNumber)) {
    console.error(`🚫 Invalid phone number format: ${phoneNumber}`);
    twiml.say({ voice: 'alice' }, 'Sorry, there was an issue with your phone number.');
    twiml.hangup();
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());
  }

  // Check rate limit (30 requests per minute for choices - higher than voice calls)
  if (!checkRateLimit(phoneNumber, 30, 60000)) {
    console.error(`🚫 Rate limit exceeded for: ${phoneNumber}`);
    twiml.say({ voice: 'alice' }, 'You\'re pressing buttons too quickly. Please wait a moment.');
    twiml.redirect('/api/voice');
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());
  }

  console.log(`🎮 User ${phoneNumber} chose: ${choice}`);

  try {
    const userSession = await getUserSession(phoneNumber);

    if (userSession) {
      const currentNode = storyNodes[userSession.current_node];
      const nextNode = currentNode.choices[choice];

      if (nextNode) {
        // Valid choice - update user's position
        console.log(`✅ Moving ${phoneNumber} from ${userSession.current_node} to ${nextNode}`);
        await updateUserSession(phoneNumber, nextNode);
        twiml.redirect('/api/voice');
      } else {
        // Invalid choice
        console.log(`❌ Invalid choice ${choice} for ${phoneNumber} at ${userSession.current_node}`);
        twiml.say({
          voice: 'alice'
        }, 'Sorry, that\'s not a valid option. Let me repeat the choices.');
        twiml.redirect('/api/voice');
      }
    } else {
      // Session lost - restart
      console.log(`🔄 Session lost for ${phoneNumber}, restarting`);
      await updateUserSession(phoneNumber, 'start');
      twiml.redirect('/api/voice');
    }
  } catch (error) {
    console.error('Error in /api/handle-choice endpoint:', error);
    twiml.say({ voice: 'alice' }, 'Sorry, something went wrong. Let me restart the game.');
    await updateUserSession(phoneNumber, 'start');
    twiml.redirect('/api/voice');
  }

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
}
