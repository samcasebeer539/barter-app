// Global Fonts
export const globalFonts = {
  regular: 'YourFontName-Regular',
  bold: 'YourFontName-Bold',
  extrabold: 'YourFontName-ExtraBold'
};

export const defaultTextStyle = {
  fontFamily: globalFonts.regular,
};

// Color Palette
export const colors = {
  // Trade Action Colors
  actions: {
    offer: '#1686ff',      // Blue - Initial offer
    trade: '#e01e72',      // Yellow/Orange - Trade/exchange
    counter: '#ff31dd',    // Pink - Counter offer
    query: '#6a50ff',      // Purple - Question
    decline: '#ff3232',    // Red - Decline/reject
    accept: '#06f52e',     // Green - Accept
    location: '#229bff',
    time: '#fb5c21',
  },

  // Post Type Colors
  cardTypes: {
    service: '#ff536a',    // Yellow/Orange - Service icon
    good: '#FFA600',       // Coral/Red - Good icon
  },


  // UI Element Colors
  ui: {
    secondary: '#4a4468',     // Secondary button color (purple-grey) 5c5579
    secondarydisabled: '#908aa7',
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