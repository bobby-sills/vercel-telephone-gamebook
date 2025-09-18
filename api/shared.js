// Shared utilities for serverless functions
import dotenv from 'dotenv';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const { twiml: { VoiceResponse } } = twilio;

// Story data structure
export const storyNodes = {
  start: {
    text: "Welcome to the Mystic Forest Adventure! You find yourself at a crossroads. Press 1 to go left toward the dark cave, or press 2 to go right toward the sunny meadow.",
    choices: {
      '1': 'cave',
      '2': 'meadow'
    }
  },
  cave: {
    text: "You enter the dark cave and hear strange noises. Press 1 to investigate the sounds, or press 2 to turn back.",
    choices: {
      '1': 'monster',
      '2': 'start'
    }
  },
  meadow: {
    text: "You walk into a beautiful sunny meadow filled with flowers. Press 1 to pick flowers, or press 2 to rest under a tree.",
    choices: {
      '1': 'flowers',
      '2': 'rest'
    }
  },
  monster: {
    text: "Oh no! You've awakened a sleeping dragon! The adventure ends here. Thanks for playing! Goodbye.",
    choices: {}
  },
  flowers: {
    text: "You pick beautiful flowers and find a magic potion! You win! Thanks for playing! Goodbye.",
    choices: {}
  },
  rest: {
    text: "You rest peacefully and feel refreshed. Press 1 to explore more of the meadow, or press 2 to return to the crossroads.",
    choices: {
      '1': 'flowers',
      '2': 'start'
    }
  }
};

// Create Supabase client
export function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Database helper functions
export async function getUserSession(phoneNumber) {
  try {
    const supabase = createSupabaseClient();
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

export async function updateUserSession(phoneNumber, currentNode) {
  try {
    const supabase = createSupabaseClient();
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

export async function deleteUserSession(phoneNumber) {
  try {
    const supabase = createSupabaseClient();
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

// Security functions
const rateLimitMap = new Map();


// Rate limiting per phone number
export function checkRateLimit(phoneNumber, maxRequests = 20, windowMs = 60000) {
  if (!phoneNumber) return false;

  const now = Date.now();
  const key = phoneNumber;

  // Clean up old entries
  for (const [phone, data] of rateLimitMap.entries()) {
    if (now - data.resetTime > windowMs) {
      rateLimitMap.delete(phone);
    }
  }

  // Get or create rate limit data
  let limitData = rateLimitMap.get(key);
  if (!limitData || now - limitData.resetTime > windowMs) {
    limitData = {
      count: 0,
      resetTime: now
    };
  }

  limitData.count++;
  rateLimitMap.set(key, limitData);

  const isAllowed = limitData.count <= maxRequests;

  if (!isAllowed) {
    console.warn(`Rate limit exceeded for ${phoneNumber}: ${limitData.count}/${maxRequests}`);
  }

  return isAllowed;
}

// Validate phone number format (basic validation)
export function validatePhoneNumber(phoneNumber) {
  if (!phoneNumber) return false;

  // Remove spaces and check for valid format
  const cleaned = phoneNumber.replace(/\s+/g, '');

  // Must start with + and have 10-15 digits
  const phoneRegex = /^\+\d{10,15}$/;
  return phoneRegex.test(cleaned);
}

export { VoiceResponse };