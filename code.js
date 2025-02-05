figma.showUI(__html__, { width: 1000, height: 600 });

// Debugging: Log pages when they are sent to the UI
const pages = figma.root.children
    .filter(node => node.type === "PAGE")
    .map(page => page.name);

console.log("All pages in the file:", pages);

figma.ui.postMessage({ type: 'displayPages', pages });

// Function to fetch components from selected pages
const getComponentVariantsFromPages = async (selectedPages) => {
    console.log("Fetching components from selected pages:", selectedPages);

    const selectedPageNodes = figma.root.children.filter(page => selectedPages.includes(page.name));

    if (selectedPageNodes.length === 0) {
        console.log("No matching pages found for selection.");
        return [];
    }

    const componentSets = selectedPageNodes.flatMap(page => {
        console.log(`Processing page: ${page.name}`);
        const components = page.findAll(node => node.type === "COMPONENT_SET");
        console.log(`Components found in ${page.name}:`, components.map(c => c.name));
        return components;
    });

    const results = await Promise.all(componentSets.map(async (componentSet) => {
        try {
            let frameLink = `https://www.figma.com/file/${figma.fileKey}?node-id=${encodeURIComponent(componentSet.id)}`;

            let allProperties = {};
            const variants = await Promise.all(componentSet.children.map(async (variant) => {
                console.log(`Processing variant: ${variant.name}`);
                const properties = variant.variantProperties || {};
                console.log(`Properties:`, properties);

                Object.entries(properties).forEach(([key, value]) => {
                    if (!allProperties[key]) allProperties[key] = new Set();
                    allProperties[key].add(value);
                });

                const instances = figma.currentPage.findAll(node =>
                    node.type === "INSTANCE" && node.mainComponent === variant
                );

                return {
                    name: variant.name,
                    properties,
                    image: "",
                    instanceCount: instances.length,
                    instanceParents: Array.from(new Set(instances.map(inst => inst.parent ? inst.parent.name : "Unknown")))
                };
            }));

            console.log(`Component Set Processed: ${componentSet.name}, Variants found:`, variants);
            return { name: componentSet.name, link: frameLink, allProperties, variants };
        } catch (error) {
            console.error(`Error processing component set: ${componentSet.name}`, error);
            return { name: componentSet.name, link: "Not Available", allProperties: {}, variants: [] };
        }
    }));

    console.log("Final processed component data:", results);
    return results.filter(set => set.variants.length > 0);
};

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
    if (msg.type === "pagesSelected") {
        const selectedPages = msg.pages;
        console.log("Received selected pages:", selectedPages);

        const componentData = await getComponentVariantsFromPages(selectedPages);
        console.log("Sending components to UI:", componentData);
        figma.ui.postMessage({ type: "displayComponents", data: componentData });
    } else if (msg.type === "close-plugin") {
        figma.closePlugin();
    }
};

figma.notify("Fetching pages...");
