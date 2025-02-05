figma.showUI(__html__, { width: 1000, height: 600 });

// Fetch the top-level pages from the Figma file
const pages = figma.root.children;
console.log('Fetched Pages:', pages);

// Map the pages to get the names
const pageNames = pages.map(page => page.name);
console.log('Page Names:', pageNames);  // Log the names of the pages

// Check if pageNames is correctly populated
if (pageNames.length > 0) {
    console.log('Pages are available:', pageNames);
} else {
    console.error('No pages found in the Figma file.');
}

// Send the page names to the UI to display in the checklist
figma.ui.postMessage({
    type: 'displayPages',
    pages: pageNames // Send the array of page names to the UI
});

// Handle when the UI sends a message about selected pages
figma.ui.onmessage = (msg) => {
    if (msg.type === 'pagesSelected') {
        const selectedPages = msg.pages;
        console.log('Selected pages:', selectedPages); // Log selected pages
    } else if (msg.type === 'close-plugin') {
        figma.closePlugin();
    }
};

figma.notify('Fetching page names...');
