// Global Fonts
export const globalFonts = {
  regular: 'YourFontName-Regular',
  bold: 'YourFontName-Bold',
};

export const defaultTextStyle = {
  fontFamily: globalFonts.regular,
};

// Color Palette
export const colors = {
  // Trade Action Colors
  actions: {
    offer: '#007AFF',      // Blue - Initial offer
    trade: '#FFA600',      // Yellow/Orange - Trade/exchange
    counter: '#FF3B81',    // Pink - Counter offer
    query: '#a73bff',      // Purple - Question
    decline: '#ff3b3b',    // Red - Decline/reject
    accept: '#00eb00',     // Green - Accept
  },

  // Post Type Colors
  cardTypes: {
    service: '#ff536a',    // Yellow/Orange - Service icon
    good: '#FFA600',       // Coral/Red - Good icon
  },


  // UI Element Colors
  ui: {
    secondary: '#5c5579',     // Secondary button color (purple-grey)
    buttonPrimary: '#e99700', // Primary action button (used for YOUR TURN)
    background: '#000000',    // Main app background
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',    // Primary text
    secondary: '#E0E0E0',  // Secondary text
    white: '#fff',         // Pure white
  },
};

// Convenience exports for commonly used colors
export const tradeActionColors = colors.actions;

export const textColors = colors.text;
export const postTypeColors = colors.cardTypes;
export const uiColors = colors.ui;

// Default export for easy importing
export default {
  colors,
  
  fonts: globalFonts,
  defaultTextStyle,
};