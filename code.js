figma.showUI(__html__, { width: 600, height: 750 });

const getAllPages = () => {
    return figma.root.children.map(page => page.name);
};

const saveNodeAsPNG = async (node) => {
    try {
        const imageBytes = await node.exportAsync({ format: "PNG" });
        return `data:image/png;base64,${figma.base64Encode(imageBytes)}`;
    } catch (error) {
        console.error("Error exporting node as PNG:", error);
        return "";
    }
};

const getComponentVariants = async (selectedPageIndexes) => {
    const selectedPages = selectedPageIndexes.map(index => figma.root.children[index]);

    const componentSets = selectedPages.flatMap(page =>
        page.findAll(node => node.type === "COMPONENT_SET")
    );

    const results = await Promise.all(componentSets.map(async (componentSet) => {
        let frameLink = `https://www.figma.com/file/${figma.fileKey}?node-id=${encodeURIComponent(componentSet.id)}`;
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
                instanceCount: instances.length
            };
        }));

        return { name: componentSet.name, link: frameLink, allProperties, variants };
    }));

    return results.filter(set => set.variants.length > 0);
};

figma.ui.postMessage({ type: "displayPages", data: getAllPages() });

figma.ui.onmessage = async (msg) => {
    if (msg.type === "selectedPages") {
        const data = await getComponentVariants(msg.data);
        figma.ui.postMessage({ type: "displayVariants", data });
    } else if (msg.type === "close-plugin") {
        figma.closePlugin();
    }
};
