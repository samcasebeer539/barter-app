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
    trade: '#FFA600',      // Yellow/Orange - Trade/exchange
    counter: '#ff19d9',    // Pink - Counter offer
    query: '#9232ff',      // Purple - Question
    decline: '#ff2121',    // Red - Decline/reject
    accept: '#00d81d',     // Green - Accept
  },

  // Post Type Colors
  cardTypes: {
    service: '#ff536a',    // Yellow/Orange - Service icon
    good: '#FFA600',       // Coral/Red - Good icon
  },


  // UI Element Colors
  ui: {
    secondary: '#5c5579',     // Secondary button color (purple-grey)
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