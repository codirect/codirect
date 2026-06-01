export function getStyleForIndex(index) {
  const palette = [
    '#8f1515', // Deep Red
    '#0369A1', // Deep Sky Blue
    '#15803D', // Deep Green
    '#7E22CE', // Deep Purple
    '#C2410C', // Deep Orange
    '#0F766E', // Deep Teal
    '#BE185D', // Deep Pink
    '#4D7C0F', // Deep Olive
    '#1D4ED8', // Deep Blue
    '#BE123C', // Deep Rose
    '#047857', // Deep Emerald
    '#6D28D9', // Deep Violet
    '#B45309', // Deep Amber
    '#4338CA', // Deep Indigo
    '#A21CAF', // Deep Fuchsia
    '#334155', // Slate
  ];
  
  return {
    backgroundColor: palette[index % palette.length],
    color: '#FFFFFF',
    textShadow: '0 0 4px rgba(0, 0, 0, 0.8)', 
  };
}