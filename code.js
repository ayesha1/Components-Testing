figma.showUI(__html__, { width: 600, height: 400 });

const getComponentVariants = async () => {
    const componentSets = figma.currentPage.findAll(node => node.type === "COMPONENT_SET");

    const results = await Promise.all(componentSets.map(async (componentSet) => {
        try {
            let frameLink = "Not Available";
            let currentNode = componentSet;

            // Traverse up to find the first FRAME or PAGE ancestor
            while (currentNode && currentNode.parent) {
                if (currentNode.parent.type === "FRAME" || currentNode.parent.type === "PAGE") {
                    frameLink = `https://www.figma.com/file/${figma.fileKey}?node-id=${encodeURIComponent(currentNode.parent.id)}`;
                    break;
                }
                currentNode = currentNode.parent;
            }

            const variantInstances = figma.currentPage.findAll(node =>
                node.type === "INSTANCE" && node.mainComponent && node.mainComponent.parent === componentSet
            );

            const instanceCount = variantInstances.length;
            const instanceParents = Array.from(new Set(variantInstances.map(inst => (inst.parent ? inst.parent.name : "Unknown"))));

            const variants = componentSet.children.map(variant => ({
                name: variant.name,
                properties: Object.entries(variant.variantProperties || {}).reduce((acc, [key, value]) => {
                    if (!acc[key]) acc[key] = new Set();
                    acc[key].add(value);
                    return acc;
                }, {})
            })).filter(variant => Object.keys(variant.properties).length > 0);

            return {
                name: componentSet.name,
                link: frameLink,
                instanceCount,
                instanceParents,
                variants
            };
        } catch (error) {
            console.error(`Error processing component set: ${componentSet.name}`, error);
            return { name: componentSet.name, link: "Not Available", instanceCount: 0, instanceParents: [], variants: [] };
        }
    }));

    return results.filter(set => set.variants.length > 0);
};

// Send variant data to UI
getComponentVariants().then(data => {
    figma.ui.postMessage({ type: "displayVariants", data });
});

// Listen for messages from UI
figma.ui.onmessage = (msg) => {
    if (msg.type === "close-plugin") {
        figma.closePlugin();
    }
};

figma.notify("Scanning components for variants...");
