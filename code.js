figma.showUI(__html__, { width: 550, height: 750 });

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

            const variants = await Promise.all(componentSet.children.map(async (variant) => {
                const variantImage = await saveNodeAsPNG(variant);
                return {
                    name: variant.name,
                    properties: variant.variantProperties || {},
                    image: variantImage
                };
            }));

            return { name: componentSet.name, link: frameLink, variants };
        } catch (error) {
            console.error(`Error processing component set: ${componentSet.name}`, error);
            return { name: componentSet.name, link: "Not Available", variants: [] };
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
