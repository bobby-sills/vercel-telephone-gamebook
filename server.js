// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import twilio from 'twilio';
const { twiml: { VoiceResponse } } = twilio;
import { createClient } from '@supabase/supabase-js';
const app = express();

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection on startup
async function testConnection() {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Database connection failed:', error.message);
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
}

testConnection();

// Middleware
app.use(express.urlencoded({ extended: false }));

// Story data structure
const storyNodes = {
  start: {
    text: 'Welcome to the Mystic Forest Adventure! You find yourself at a crossroads. Press 1 to go left toward the dark cave, or press 2 to go right toward the sunny meadow.',
    choices: {
      '1': 'cave',
      '2': 'meadow'
    }
  },
  cave: {
    text: 'You enter the dark cave and hear strange noises. Press 1 to investigate the sounds, or press 2 to turn back.',
    choices: {
      '1': 'monster',
      '2': 'start'
    }
  },
  meadow: {
    text: 'You walk into a beautiful sunny meadow filled with flowers. Press 1 to pick flowers, or press 2 to rest under a tree.',
    choices: {
      '1': 'flowers',
      '2': 'rest'
    }
  },
  monster: {
    text: 'Oh no! You\'ve awakened a sleeping dragon! The adventure ends here. Thanks for playing! Goodbye.',
    choices: {}
  },
  flowers: {
    text: 'You pick beautiful flowers and find a magic potion! You win! Thanks for playing! Goodbye.',
    choices: {}
  },
  rest: {
    text: 'You rest peacefully and feel refreshed. Press 1 to explore more of the meadow, or press 2 to return to the crossroads.',
    choices: {
      '1': 'flowers',
      '2': 'start'
    }
  }
};

// Database helper functions
async function getUserSession(phoneNumber) {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error getting user session:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error getting user session:', err);
    return null;
  }
}

async function updateUserSession(phoneNumber, currentNode) {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .upsert({
        phone_number: phoneNumber,
        current_node: currentNode,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'phone_number'
      });

    if (error) {
      console.error('Error updating user session:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error updating user session:', err);
    return false;
  }
}

async function deleteUserSession(phoneNumber) {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('phone_number', phoneNumber);

    if (error) {
      console.error('Error deleting user session:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error deleting user session:', err);
    return false;
  }
}

// Main webhook endpoint for incoming calls
app.post('/voice', async (req, res) => {
  const twiml = new VoiceResponse();
  const phoneNumber = req.body.From;

  console.log(`📞 Incoming call from: ${phoneNumber}`);

  try {
    // Get or create user session
    let userSession = await getUserSession(phoneNumber);
    if (!userSession) {
      console.log(`🆕 New user, creating session for: ${phoneNumber}`);
      await updateUserSession(phoneNumber, 'start');
      userSession = { current_node: 'start' };
    } else {
      console.log(`👋 Returning user at node: ${userSession.current_node}`);
    }

    const currentNode = storyNodes[userSession.current_node];

    if (!currentNode) {
      console.error(`❌ Invalid node: ${userSession.current_node}`);
      // Reset to start if we hit an invalid node
      await updateUserSession(phoneNumber, 'start');
      twiml.say({ voice: 'alice' }, 'Something went wrong. Let\'s start over.');
      twiml.redirect('/voice');
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
          action: '/handle-choice',
          method: 'POST',
          timeout: 10
        });

        twiml.pause({ length: 2 });
        twiml.say({
          voice: 'alice',
          rate: '0.9'
        }, 'Please make your choice now.');

        // If no input received, repeat the options
        twiml.redirect('/voice');
      } else {
        // End of story - clean up session
        console.log(`🎯 Game ended for: ${phoneNumber}`);
        await deleteUserSession(phoneNumber);
        twiml.hangup();
      }
    }
  } catch (error) {
    console.error('Error in /voice endpoint:', error);
    twiml.say({ voice: 'alice' }, 'Sorry, something went wrong. Please try calling back.');
    twiml.hangup();
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle user's choice input
app.post('/handle-choice', async (req, res) => {
  const twiml = new VoiceResponse();
  const phoneNumber = req.body.From;
  const choice = req.body.Digits;

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
        twiml.redirect('/voice');
      } else {
        // Invalid choice
        console.log(`❌ Invalid choice ${choice} for ${phoneNumber} at ${userSession.current_node}`);
        twiml.say({
          voice: 'alice'
        }, 'Sorry, that\'s not a valid option. Let me repeat the choices.');
        twiml.redirect('/voice');
      }
    } else {
      // Session lost - restart
      console.log(`🔄 Session lost for ${phoneNumber}, restarting`);
      await updateUserSession(phoneNumber, 'start');
      twiml.redirect('/voice');
    }
  } catch (error) {
    console.error('Error in /handle-choice endpoint:', error);
    twiml.say({ voice: 'alice' }, 'Sorry, something went wrong. Let me restart the game.');
    await updateUserSession(phoneNumber, 'start');
    twiml.redirect('/voice');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Twilio Adventure Game with Supabase',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check database
app.get('/debug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .limit(10);

    if (error) {
      res.json({ error: error.message });
    } else {
      res.json({
        sessions: data,
        count: data.length,
        supabase_url: process.env.SUPABASE_URL ? 'Set' : 'Missing'
      });
    }
  } catch (err) {
    res.json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Debug endpoint: http://localhost:${PORT}/debug`);
  console.log('🌐 Make sure to expose this server for Twilio webhooks');
});
