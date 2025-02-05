figma.showUI(__html__, { width: 1000, height: 600 });

// Function to fetch all pages in the Figma file
const getPages = () => {
    return figma.root.children.map(page => ({ id: page.id, name: page.name }));
};

// When the plugin starts, send the page names to the UI
const pages = getPages();
figma.ui.postMessage({ type: 'displayPages', pages: pages });

// Handle when the UI sends a message about selected pages
figma.ui.onmessage = (msg) => {
    if (msg.type === 'pagesSelected') {
        // Selected pages received from the UI
        const selectedPages = msg.pages;

        // Proceed with operations based on the selected pages
        const pagesData = pages.filter(page => selectedPages.includes(page.id));

        // Send the data back to the UI for the next step (e.g., displaying components)
        figma.ui.postMessage({ type: 'displayComponents', pages: pagesData });

        // Optional: Show a notification to indicate progress
        figma.notify(`Selected pages: ${pagesData.map(page => page.name).join(', ')}`);

    } else if (msg.type === 'close-plugin') {
        // Close the plugin when requested by the UI
        figma.closePlugin();
    }
};

figma.notify('Fetching pages...');
