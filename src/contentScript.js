'use strict';

const pageTitle = document.head.getElementsByTagName('title')[0].innerHTML;

// get weekly attenion token data
let attentionUsage = localStorage.getItem('attentionUsage') || {
  total: 0,
  weekly: {
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0,
  }
}

console.log(
  `Page title is: '${pageTitle}' - evaluated by Chrome extension's 'contentScript.js' file`
);

let previousVisibleText = '';

function getVisibleText() {
  const isVisible = (elem) => {
    const style = window.getComputedStyle(elem);
    return style.display !== 'none' && style.visibility !== 'hidden' && elem.offsetParent !== null;
  };

  const getTextNodes = (elem) => {
    let textNodes = [];
    if (elem.nodeType === Node.TEXT_NODE) {
      textNodes.push(elem);
    } else {
      for (let child of elem.childNodes) {
        textNodes = textNodes.concat(getTextNodes(child));
      }
    }
    return textNodes;
  };

  const body = document.body;
  const allTextNodes = getTextNodes(body);
  const visibleTextNodes = allTextNodes.filter(node => isVisible(node.parentElement));
  const visibleText = visibleTextNodes.map(node => node.textContent.trim()).filter(text => text.length > 0).join(' ');
  
  return visibleText;
}

function getNewVisibleText() {
  const currentVisibleText = getVisibleText();
  const newText = currentVisibleText.replace(previousVisibleText, '').trim();
  previousVisibleText = currentVisibleText;
  return newText;
}

function updateVisibleText(mutationList, observer) {
  const visibleText = getNewVisibleText();
  console.log(`Visible text: '${visibleText}'`);
}

// Observe changes in the body
const observer = new MutationObserver(updateVisibleText);

// Configure the observer
const config = {
  childList: true,
  subtree: true,
  characterData: true
};

// Start observing the body for changes
observer.observe(document.body, config);

// Initial call to log the visible text
updateVisibleText();

// listen for page change
