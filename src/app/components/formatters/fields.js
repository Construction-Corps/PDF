import React, { useEffect, useRef } from 'react';
import currency from 'currency.js';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

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

export const HTMLTooltip = ({ children, html, options = {} }) => {
  const tooltipRef = useRef(null);

  useEffect(() => {
    const instance = tippy(tooltipRef.current, {
      content: html,
      placement: 'top',
      arrow: true,
      animation: 'fade',
      theme: 'light',
      allowHTML: true,
      ...options
    });

    return () => {
      instance.destroy();
    };
  }, [html, options]);

  return React.cloneElement(children, { ref: tooltipRef });
};

export const TextTooltip = ({ children, text, options = {} }) => {
  const tooltipRef = useRef(null);

  useEffect(() => {
    const instance = tippy(tooltipRef.current, {
      content: text,
      placement: 'top',
      arrow: true,
      animation: 'fade',
      theme: 'light',
      ...options
    });

    return () => {
      instance.destroy();
    };
  }, [text, options]);

  return React.cloneElement(children, { ref: tooltipRef });
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

// Usage examples:
// HTML Tooltip:
// HTMLTooltip 
//   html={`
//     <div>
//       <strong>Name:</strong> ${task.name}<br>
//       <strong>Description:</strong> ${task.description}
//     </div>
//   `}
// >
//   <button>Hover me</button>
//
// Text Tooltip:
// TextTooltip text={`Name: ${task.name}\nDescription: ${task.description}`}>
//   <div>Hover me</div>
// </TextTooltip>
//
// With custom options:
// HTMLTooltip 
//   html={content}
//   options={{
//     placement: 'bottom',
//     delay: [300, 0],
//     duration: [300, 250],
//     theme: 'dark'
//   }}
// >
//   <span>Hover me</span>
// </HTMLTooltip>
