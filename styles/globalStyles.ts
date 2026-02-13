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
    offer: '#1686ff',  
    trade: '#ab57ff',  
    counter: '#ff31dd',  
    query: '#6a50ff',    
    decline: '#ff3232',    
    accept: '#06f52e',     
    location: '#229bff',
    time: '#fb4921',
    verify: '#00f3ef'
  },

  // Post Type Colors
  cardTypes: {
    service: '#ff3a86',    // Yellow/Orange - Service icon
    good: '#FFA600',       // Coral/Red - Good icon
    user: '#1686ff', 
    times: '#FFA600', 
    locations:'#FFA600', 
  },


  // UI Element Colors
  ui: {
    secondary: '#372788',     // Secondary button color (purple-grey) 5c5579  4a4468
    secondarydisabled: '#6b5bbe',
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