import currency from 'currency.js';

export const formatUSD = (value) => {
  return currency(value || 0, { 
    symbol: '$', 
    precision: 2,
    formatWithSymbol: true,
    errorOnInvalid: false
  }).format();
};

export const roundUp = (value) => {
  const num = Number(value || 0);
  
  const tiers = [
    { threshold: 1e12, suffix: 't' },  // trillion
    { threshold: 1e9, suffix: 'b' },   // billion
    { threshold: 1e6, suffix: 'm' },   // million
    { threshold: 1e3, suffix: 'k' },   // thousand
  ];

  for (let { threshold, suffix } of tiers) {
    if (num >= threshold) {
      const shortened = (num / threshold).toFixed(1);
      const formatted = shortened.endsWith('.0') 
        ? shortened.slice(0, -2) 
        : shortened;
      return `$${formatted}${suffix}`;
    }
  }
  
  // For numbers less than 1000, just show the whole number
  return `$${Math.round(num)}`;
};

// Examples:
// formatUSD(1)           -> "$1.00"
// formatUSD(100)         -> "$100.00"
// formatUSD(10101)       -> "$10,101.00"

// roundUp(1)             -> "$1"
// roundUp(100)           -> "$100"
// roundUp(1234)          -> "$1.2k"
// roundUp(10000)         -> "$10k"
// roundUp(540000)        -> "$540k"
// roundUp(540000.31)     -> "$540k"
// roundUp(540500)        -> "$540.5k"
// roundUp(1234567)       -> "$1.2m"
// roundUp(1234567890)    -> "$1.2b"
// roundUp(1234567890000) -> "$1.2t"
