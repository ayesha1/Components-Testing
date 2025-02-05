figma.showUI(__html__, { width: 600, height: 750 });

// Function to fetch all pages in the file
const getPages = () => {
    return figma.root.children.map(page => ({ id: page.id, name: page.name }));
};

// Handle when the UI sends a message about selected pages
figma.ui.onmessage = (msg) => {
    if (msg.type === 'pagesSelected') {
        // Selected pages received from the UI
        const selectedPages = msg.pages;

        // Proceed with operations based on the selected pages
        const pagesData = getPages().filter(page => selectedPages.includes(page.id));

        // Send the data back to the UI for the next step (e.g., displaying components)
        figma.ui.postMessage({ type: 'displayComponents', pages: pagesData });

        // Optional: Show a notification to indicate progress
        figma.notify(`Selected pages: ${pagesData.map(page => page.name).join(', ')}`);

    } else if (msg.type === 'close-plugin') {
        // Close the plugin when requested by the UI
        figma.closePlugin();
    }
};

figma.notify('Please select the pages to proceed...');
