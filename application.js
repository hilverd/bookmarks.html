function forestFromText(data) {
    let res = [], levels = [res];
    for (let line of data.split('\n')) {
        let
            level = line.search(/\S/) >> 1  // (index of first non whitespace char) / 2, assuming indentation is 2 spaces
            , trimmed = line.trim()
            , children = []
            ;
        if (!trimmed) continue;

        const i = trimmed.indexOf(':');
        let name = trimmed;

        let href = null;
        if (i !== -1) {
            name = trimmed.slice(0, i).trim();
            href = trimmed.slice(i + 1).trim();
        }

        levels[level].push({ name: name, href: href, children: children });
        levels[++level] = children;
    }
    return res;
}

function treePaths(tree) {
    if (tree.children.length === 0) {
        return [{ names: [tree.name], label: tree.name, href: tree.href }];
    } else {
        return tree.children
            .map((child) => treePaths(child))
            .flat()
            .map((flattenedTree) => {
                return { names: [tree.name, ...flattenedTree.names], label: `${tree.name} / ${flattenedTree.label}`, href: flattenedTree.href }
            });
    }
}

function forestPaths(forest) {
    return forest.map((tree) => treePaths(tree)).flat().sort((a, b) => a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1);
}

function forestFromPreElement() {
    const forestText = document.getElementById('bookmarks').innerText.trim();
    return forestFromText(forestText);
}

function xHtmlForTree(tree) {
    if (tree.children.length === 0) {
        return `<li><a href="${tree.href}">${tree.name}</a></li>`;
    } else {
        const xHtmlForChildrenArray = tree.children.map((child) => xHtmlForTree(child));
        const xHtmlForChildren = xHtmlForChildrenArray.map((xHtmlForChild) => `<ul>${xHtmlForChild}</ul>`).join('\n');

        return `<li><span class="font-medium text-gray-500">${tree.name}</span>\n${xHtmlForChildren}</li>`;
    }
}

document.addEventListener('alpine:init', () => {
    const forest = forestFromPreElement();
    const paths = forestPaths(forest);

    Alpine.data('bookmarks', () => ({
        xHtmlForForest: forest.map((tree) => `<ul>${xHtmlForTree(tree)}</ul>`),
        searchString: '',
        activeSearchResultIndex: 0,

        search() {
            if (this.searchString.trim() === "")
                return [];

            const normalisedSearchString = this.searchString.trim().toLowerCase();
            const searchStringParts = normalisedSearchString.split(/\s+/);

            return paths.filter((path) =>
                searchStringParts.every((searchStringPart) => path.names.some((name) => name.toLowerCase().includes(searchStringPart))) ||
                path.href.toLowerCase().includes(normalisedSearchString)
            );
        }
    }))
})