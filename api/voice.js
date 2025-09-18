// Main webhook endpoint for incoming calls
import { VoiceResponse, getStoryNodes, getUserSession, updateUserSession, deleteUserSession, checkRateLimit, validatePhoneNumber, createStorySelectionMenu, reloadStory } from './shared.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }


  const twiml = new VoiceResponse();
  const phoneNumber = req.body.From;

  // Validate phone number format
  if (!validatePhoneNumber(phoneNumber)) {
    console.error(`🚫 Invalid phone number format: ${phoneNumber}`);
    twiml.say({ voice: 'alice' }, 'Sorry, there was an issue with your phone number.');
    twiml.hangup();
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());
  }

  // Check rate limit (20 requests per minute per phone number)
  if (!checkRateLimit(phoneNumber, 20, 60000)) {
    console.error(`🚫 Rate limit exceeded for: ${phoneNumber}`);
    twiml.say({ voice: 'alice' }, 'You\'re calling too frequently. Please wait a moment and try again.');
    twiml.hangup();
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());
  }

  console.log(`📞 Incoming call from: ${phoneNumber}`);

  try {
    // Get or create user session
    let userSession = await getUserSession(phoneNumber);
    if (!userSession) {
      console.log(`🆕 New user, showing story selection menu for: ${phoneNumber}`);
      await updateUserSession(phoneNumber, 'story_selection');
      userSession = { current_node: 'story_selection' };
    } else {
      console.log(`👋 Returning user at node: ${userSession.current_node}`);

      // Load the user's chosen story if they have one
      if (userSession.story_name) {
        console.log(`📚 Loading user's story: ${userSession.story_name}`);
        await reloadStory(userSession.story_name);
      }

      // If user is at start, continue normally
      // If user is in middle of game, offer continue/restart menu
      if (userSession.current_node !== 'start' && userSession.current_node !== 'story_selection') {
        console.log('🔄 User has existing progress, showing continue/restart menu');
        // Store their current progress before showing menu
        await updateUserSession(phoneNumber, 'continue_menu', userSession.current_node);
        userSession = { current_node: 'continue_menu', previous_node: userSession.current_node };
      }
    }

    let currentNode;

    // Handle special story selection menu
    if (userSession.current_node === 'story_selection') {
      currentNode = await createStorySelectionMenu();
      console.log('📋 Generated story selection menu');
    } else if (userSession.current_node === 'continue_menu') {
      // Get the continue menu content from story nodes
      const storyNodes = await getStoryNodes();
      currentNode = storyNodes['continue_menu'];
    } else {
      const storyNodes = await getStoryNodes();
      currentNode = storyNodes[userSession.current_node];
    }

    if (!currentNode) {
      console.error(`❌ Invalid node: ${userSession.current_node}`);
      // Reset to start if we hit an invalid node
      await updateUserSession(phoneNumber, 'start');
      twiml.say({ voice: 'alice' }, 'Something went wrong. Let\'s start over.');
      twiml.redirect('/api/voice');
    } else {
      // Speak the story text
      twiml.say({
        voice: 'alice',
        rate: '0.9'
      }, currentNode.text);

      // If there are choices, gather input
      if (Object.keys(currentNode.choices).length > 0) {
        twiml.gather({
          numDigits: 1,
          action: '/api/handle-choice',
          method: 'POST',
          timeout: 10
        });

        twiml.pause({ length: 2 });
        twiml.say({
          voice: 'alice',
          rate: '0.9'
        }, 'Please make your choice now.');

        // If no input received, repeat the options
        twiml.redirect('/api/voice');
      } else {
        // End of story - clean up session
        console.log(`🎯 Game ended for: ${phoneNumber}`);
        await deleteUserSession(phoneNumber);
        twiml.hangup();
      }
    }
  } catch (error) {
    console.error('Error in /api/voice endpoint:', error);
    twiml.say({ voice: 'alice' }, 'Sorry, something went wrong. Please try calling back.');
    twiml.hangup();
  }

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
}
