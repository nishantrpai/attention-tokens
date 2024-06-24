'use strict';


// get weekly attenion token data
let attentionUsage;

chrome.storage.sync.get('attentionUsage', function (data) {
  attentionUsage = data.attentionUsage || {
    total: 0,
    weekly: {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0
    }
  };

  // Now you can use attentionUsage object here
  console.log(attentionUsage);
});


let previousVisibleText = '';
let previousVisibleImages = [];
let currentTokensUsed = 0;

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

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
  const visibleTextNodes = allTextNodes.filter(node => isVisible(node.parentElement) && isElementInViewport(node.parentElement));
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
  try {
    const visibleText = getNewVisibleText();
    const visibleImages = logNewVisibleImages();
    visibleImages.forEach(img => {
      currentTokensUsed += 3 * (img.width * img.height)
      console.log('token from image', 3 * (img.width * img.height))
    })
    currentTokensUsed += visibleText.length / 4;
      attentionUsage.total += currentTokensUsed || 0;
      attentionUsage.weekly[new Date().getDay()] += currentTokensUsed;
      chrome.storage.sync.set({ attentionUsage: attentionUsage }, function () {
        console.log('Attention usage saved');
      });
  
      console.log(`Total tokens used: ${attentionUsage.total}`);
      console.log(`Current tokens used: ${currentTokensUsed}`);
  
  } catch(e) {
    console.log(e);
  }
    
}

function getVisibleImages() {
  const isVisible = (elem) => {
    const style = window.getComputedStyle(elem);
    return style.display !== 'none' && style.visibility !== 'hidden' && elem.offsetParent !== null;
  };

  const isElementInViewport = (el) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  const newVisibleImages = Array.from(document.querySelectorAll('img'))
    .filter(img => isVisible(img) && isElementInViewport(img))
    .map(img => ({
      src: img.src,
      width: img.width,
      height: img.height
    }));

  return newVisibleImages;
}

function getNewVisibleImages() {
  const currentVisibleImages = getVisibleImages();
  const newImages = currentVisibleImages.filter(img => !previousVisibleImages.some(prevImg => prevImg.src === img.src));
  previousVisibleImages = currentVisibleImages;
  return newImages;
}

function logNewVisibleImages() {
  const newVisibleImages = getNewVisibleImages();
  console.log('Newly Visible Images:', newVisibleImages.length);
  return newVisibleImages;
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
logNewVisibleImages();
