figma.showUI(__html__, { width: 1000, height: 600 });

// Fetch the pages from the Figma file
const pages = figma.root.children
    .filter(node => node.type === "PAGE")  // Only select pages
    .map(page => page.name);  // Get the name of each page

// Log the fetched pages for verification
console.log('Fetched Pages:', pages);

// Create a message object with the correct structure
const message = {
    type: 'displayPages',  // Define the message type
    pages: pages           // Attach the page names
};

// Log the message that is being sent
console.log('Message being sent to the UI:', message);

// Send the message to the UI
// CHANGE 1 figma.ui.postMessage(message);
figma.ui.postMessage({ type: 'displayPages', pages });
