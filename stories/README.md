# Stories Directory

This directory contains story files for the Telephone Gamebook application.

## How to Create a New Story

1. **Create a new .js file** in this directory (e.g., `my-story.js`)

2. **Use this template structure:**
```javascript
// My Amazing Story
export const storyInfo = {
  name: 'My Amazing Story',
  description: 'A brief description of your story',
  author: 'Your Name',
  version: '1.0.0'
};

export const storyNodes = {
  continue_menu: {
    text: 'Welcome back! I see you were in the middle of an adventure. Press 1 to continue where you left off, or press 2 to start a brand new adventure.',
    choices: {
      '1': 'continue_game',
      '2': 'start'
    }
  },
  start: {
    text: 'Welcome to my story! Press 1 for option A, or press 2 for option B.',
    choices: {
      '1': 'nodeA',
      '2': 'nodeB'
    }
  },
  nodeA: {
    text: 'You chose option A! This is the end.',
    choices: {} // Empty choices = story ends
  },
  nodeB: {
    text: 'You chose option B! Press 1 to continue the adventure.',
    choices: {
      '1': 'nodeC'
    }
  },
  nodeC: {
    text: 'The adventure continues! This is the end.',
    choices: {}
  }
};
```

3. **Add your story to index.js:**
```javascript
'my-story': {
  name: 'My Amazing Story',
  description: 'A brief description of your story',
  file: 'my-story.js'
}
```

## Required Nodes

Every story MUST include:
- `continue_menu` - For returning users
- `start` - The beginning of your story

## Story Node Structure

Each node should have:
- `text` - What the voice will say to the user
- `choices` - Object mapping keypad numbers (1-9) to next node names
- Empty `choices: {}` = story ending

## Tips

- Keep text concise and clear for voice
- Use simple language that sounds natural when spoken
- Limit choices to 2-3 options per node
- Test your story flow on paper first
- Remember: users only hear the content, they can't see it

## Switching Stories

To use a different story, set the `STORY_NAME` environment variable:
```
STORY_NAME=space-adventure
```

Default story is `mystic-forest` if no environment variable is set.