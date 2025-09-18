// Mystic Forest Adventure Story
export const storyInfo = {
  name: 'Mystic Forest Adventure',
  description: 'A magical adventure through an enchanted forest',
  author: 'Claude Code',
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