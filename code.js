figma.showUI(__html__, { width: 600, height: 750 });

const saveNodeAsPNG = async (node) => {
    try {
        const imageBytes = await node.exportAsync({ format: "PNG" });
        return `data:image/png;base64,${figma.base64Encode(imageBytes)}`;
    } catch (error) {
        console.error("Error exporting node as PNG:", error);
        return "";
    }
};

const getComponentVariants = async () => {
    const componentSets = figma.currentPage.findAll(node => node.type === "COMPONENT_SET");

    const results = await Promise.all(componentSets.map(async (componentSet) => {
        try {
            let frameLink = "Not Available";
            let currentNode = componentSet;

            while (currentNode && currentNode.parent) {
                if (currentNode.parent.type === "FRAME" || currentNode.parent.type === "PAGE") {
                    frameLink = `https://www.figma.com/file/${figma.fileKey}?node-id=${encodeURIComponent(currentNode.parent.id)}`;
                    break;
                }
                currentNode = currentNode.parent;
            }

            let allProperties = {};
            const variants = await Promise.all(componentSet.children.map(async (variant) => {
                const variantImage = await saveNodeAsPNG(variant);
                const properties = variant.variantProperties || {};

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
                    image: variantImage,
                    instanceCount: instances.length,
                    instanceParents: Array.from(new Set(instances.map(inst => inst.parent ? inst.parent.name : "Unknown")))
                };
            }));

            return { name: componentSet.name, link: frameLink, allProperties, variants };
        } catch (error) {
            console.error(`Error processing component set: ${componentSet.name}`, error);
            return { name: componentSet.name, link: "Not Available", allProperties: {}, variants: [] };
        }
    }));

    return results.filter(set => set.variants.length > 0);
};

getComponentVariants().then(data => {
    figma.ui.postMessage({ type: "displayVariants", data });
});

figma.ui.onmessage = (msg) => {
    if (msg.type === "close-plugin") {
        figma.closePlugin();
    }
};

figma.notify("Scanning components for variants...");
