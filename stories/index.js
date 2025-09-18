// Available Stories Index
// This file lists all available stories for easy reference

export const availableStories = {
  'mystic-forest': {
    name: 'Mystic Forest Adventure',
    description: 'A magical adventure through an enchanted forest',
    file: 'mystic-forest.js'
  },
  'space-adventure': {
    name: 'Space Adventure',
    description: 'An exciting journey through the galaxy',
    file: 'space-adventure.js'
  }
};

// Helper function to get story list
export function getAvailableStories() {
  return availableStories;
}

// Helper function to validate story name
export function isValidStory(storyName) {
  return storyName in availableStories;
}