figma.showUI(__html__, { width: 1000, height: 600 });

const pages = figma.root.children
    .filter(node => node.type === "PAGE")
    .map(page => page.name);

console.log("All pages in the file:", pages);
figma.ui.postMessage({ type: "displayPages", pages  });

const getComponentVariantsFromPages = async (selectedPages) => {
    console.log("Fetching components from selected pages:", selectedPages);

    const selectedPageNodes = figma.root.children.filter(page => selectedPages.includes(page.name));

    if (selectedPageNodes.length === 0) {
        console.log("No matching pages found.");
        return [];
    }

    const componentSets = selectedPageNodes.flatMap(page => {
        console.log(`Processing page: ${page.name}`);
        return page.findAll(node => node.type === "COMPONENT_SET");
    });

    console.log("Total component sets found:", componentSets.length);

    const results = await Promise.all(componentSets.map(async (componentSet) => {
        try {
            const frameLink = `https://www.figma.com/file/${figma.fileKey}?node-id=${encodeURIComponent(componentSet.id)}`;
            console.log(`Component Set: ${componentSet.name} - Link: ${frameLink}`);

            let allProperties = {};
            const variants = await Promise.all(componentSet.children.map(async (variant) => {
                console.log(`Processing variant: ${variant.name}`);
                const properties = variant.variantProperties || {};

                Object.entries(properties).forEach(([key, value]) => {
                    if (!allProperties[key]) allProperties[key] = new Set();
                    allProperties[key].add(value);
                });

                return {
                    name: variant.name,
                    properties,
                    image: "",
                    instanceCount: 0,
                    instanceParents: []
                };
            }));

            return { name: componentSet.name, link: frameLink, allProperties, variants };
        } catch (error) {
            console.error(`Error processing component set: ${componentSet.name}`, error);
            return { name: componentSet.name, link: "Not Available", allProperties: {}, variants: [] };
        }
    }));

    console.log("Final component data:", results);
    return results.filter(set => set.variants.length > 0);
};

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {

    console.log("message recieved in figma", msg);
    //if (!msg.pluginMessage) {
    //    console.error("Error: Missing 'pluginMessage' in received data", msg);
    //    return;
    //}

    const { type, pages } = msg;

    if (type === "pagesSelected") {
        console.log("Selected pages received:", pages);
        const componentData = await getComponentVariantsFromPages(pages);
        console.log("Sending component data to UI:", componentData);

        // Ensure correct message format
        figma.ui.postMessage({ type: "displayComponents", data: componentData  });
    } else if (type === "close-plugin") {
        figma.closePlugin();
    }
};

figma.notify("Fetching pages...");
