import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const animations = {
  // Timing configurations
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },
  
  // Easing curves (for Animated API)
  easing: {
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
    spring: [0.68, -0.55, 0.265, 1.55],
  },
  
  // Micro-interactions
  scale: {
    press: 0.96,
    hover: 1.02,
    active: 0.98,
  },
  
  // Slide distances
  slide: {
    small: 20,
    medium: 50,
    large: 100,
    full: width,
  },
  
  // Rotation degrees
  rotate: {
    small: '5deg',
    medium: '15deg',
    large: '45deg',
    full: '360deg',
  },
  
  // Opacity levels
  opacity: {
    hidden: 0,
    subtle: 0.3,
    medium: 0.6,
    visible: 1,
  },
  
  // Blur amounts
  blur: {
    light: 10,
    medium: 20,
    heavy: 30,
  },
};

export default animations;
