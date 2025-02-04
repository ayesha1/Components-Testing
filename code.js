figma.showUI(__html__, { width: 600, height: 750 });

const getPages = () => {
    const pages = figma.root.children
        .filter(node => node.type === "PAGE")
        .map(page => ({ name: page.name, id: page.id }));

    figma.ui.postMessage({ type: 'displayPages', data: pages });
};

const getComponentVariants = async (selectedPages) => {
    const componentSets = figma.root.children
        .filter(page => selectedPages.includes(page.id))
        .flatMap(page => page.findAll(node => node.type === "COMPONENT_SET"));

    const results = await Promise.all(componentSets.map(async (componentSet) => {
        const variants = await Promise.all(componentSet.children.map(async (variant) => ({
            name: variant.name,
            properties: variant.variantProperties || {},
            image: "",
            instanceCount: 0,
            instanceParents: []
        })));

        return { name: componentSet.name, variants };
    }));

    figma.ui.postMessage({ type: 'displayVariants', data: results });
};

figma.ui.onmessage = (msg) => {
    if (msg.type === 'pagesSelected') {
        getComponentVariants(msg.selectedPages);
    } else if (msg.type === 'close-plugin') {
        figma.closePlugin();
    }
};

getPages();
