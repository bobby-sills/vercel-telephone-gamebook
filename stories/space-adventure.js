// Space Adventure Story
export const storyInfo = {
  name: 'Space Adventure',
  description: 'An exciting journey through the galaxy',
  author: 'Claude Code',
  version: '1.0.0'
};

export const storyNodes = {
  continue_menu: {
    text: 'Welcome back, Space Explorer! I see you were in the middle of your mission. Press 1 to continue where you left off, or press 2 to start a brand new mission.',
    choices: {
      '1': 'continue_game',
      '2': 'start'
    }
  },
  start: {
    text: 'Welcome to Space Adventure! You are a space explorer on a distant planet. Press 1 to explore the alien ruins, or press 2 to investigate the crashed spaceship.',
    choices: {
      '1': 'ruins',
      '2': 'spaceship'
    }
  },
  ruins: {
    text: 'You discover ancient alien ruins with glowing symbols. Press 1 to touch the symbols, or press 2 to take photos and retreat.',
    choices: {
      '1': 'portal',
      '2': 'safe_return'
    }
  },
  spaceship: {
    text: 'You find a crashed spaceship with its cargo bay open. Press 1 to enter the ship, or press 2 to search the surrounding area.',
    choices: {
      '1': 'inside_ship',
      '2': 'search_area'
    }
  },
  portal: {
    text: 'The symbols activate and open a portal to another dimension! You are transported to a world of infinite possibilities. Mission accomplished! Thanks for playing!',
    choices: {}
  },
  safe_return: {
    text: 'You safely document the ruins and return to your base camp. Your scientific discovery will help humanity! Mission successful! Thanks for playing!',
    choices: {}
  },
  inside_ship: {
    text: 'Inside the ship, you find alien technology beyond comprehension. Press 1 to try to activate it, or press 2 to carefully study it first.',
    choices: {
      '1': 'activate_tech',
      '2': 'study_tech'
    }
  },
  search_area: {
    text: 'You discover valuable alien artifacts scattered around the crash site. Your expedition is a huge success! Thanks for playing!',
    choices: {}
  },
  activate_tech: {
    text: 'The alien technology malfunctions and creates a dangerous energy surge! You barely escape, but the experience teaches you valuable lessons about alien science. Thanks for playing!',
    choices: {}
  },
  study_tech: {
    text: 'Your careful study reveals the secrets of faster-than-light travel! You make the most important scientific discovery in human history. Thanks for playing!',
    choices: {}
  }
};