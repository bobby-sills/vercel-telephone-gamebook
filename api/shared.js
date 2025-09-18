// Shared utilities for serverless functions
import dotenv from 'dotenv';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const { twiml: { VoiceResponse } } = twilio;

// Story loading system
async function loadStory(storyName) {
  try {
    const story = await import(`../stories/${storyName}.js`);
    return {
      info: story.storyInfo,
      nodes: story.storyNodes
    };
  } catch (error) {
    console.error(`Failed to load story "${storyName}":`, error);
    // Fallback to default story
    const defaultStory = await import('../stories/mystic-forest.js');
    return {
      info: defaultStory.storyInfo,
      nodes: defaultStory.storyNodes
    };
  }
}

// Get current story from environment variable or default
const currentStoryName = process.env.STORY_NAME || 'mystic-forest';
let currentStory = null;

// Load story asynchronously
async function initializeStory() {
  if (!currentStory) {
    currentStory = await loadStory(currentStoryName);
    console.log(`📚 Loaded story: ${currentStory.info.name} v${currentStory.info.version}`);
  }
  return currentStory;
}

// Export story nodes (will be loaded when first accessed)
export let storyNodes = null;
export let storyInfo = null;

// Initialize story on module load
initializeStory().then(story => {
  storyNodes = story.nodes;
  storyInfo = story.info;
}).catch(error => {
  console.error('Failed to initialize story:', error);
});

// Function to get story nodes (ensures story is loaded)
export async function getStoryNodes() {
  if (!storyNodes) {
    const story = await initializeStory();
    storyNodes = story.nodes;
    storyInfo = story.info;
  }
  return storyNodes;
}

// Function to reload story (for switching stories)
export async function reloadStory(newStoryName = null) {
  const storyName = newStoryName || currentStoryName;
  currentStory = await loadStory(storyName);
  storyNodes = currentStory.nodes;
  storyInfo = currentStory.info;
  console.log(`🔄 Reloaded story: ${storyInfo.name}`);
  return currentStory;
}

// Generate story selection menu dynamically
export async function createStorySelectionMenu() {
  const { availableStories } = await import('../stories/index.js');
  const storyList = Object.entries(availableStories);

  let menuText = 'Welcome to the Telephone Gamebook! Please choose your adventure: ';
  const choices = {};

  storyList.forEach(([key, info], index) => {
    const number = (index + 1).toString();
    menuText += `Press ${number} for ${info.name}. `;
    choices[number] = `story_${key}`;
  });

  return {
    text: menuText,
    choices: choices
  };
}

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

export async function updateUserSession(phoneNumber, currentNode, previousNode = null, storyName = null) {
  try {
    const supabase = createSupabaseClient();
    const updateData = {
      phone_number: phoneNumber,
      current_node: currentNode,
      updated_at: new Date().toISOString()
    };

    // Store previous node if provided (for continue/restart functionality)
    if (previousNode !== null) {
      updateData.previous_node = previousNode;
    }

    // Store story name if provided
    if (storyName !== null) {
      updateData.story_name = storyName;
    }

    const { error } = await supabase
      .from('user_sessions')
      .upsert(updateData, {
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
