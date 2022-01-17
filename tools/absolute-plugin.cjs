const ts = require("typescript");
const path_1 = require("path");

function visitRequireNode(importNode) {
    if (importNode.expression.kind == ts.SyntaxKind.Identifier &&
        importNode.expression.escapedText == "require") {
        const file = importNode.arguments[0].text;
        if (/\.(less|css|scss|sass|svg|png|html)/.test(file)) {
            const currentFileName = importNode.getSourceFile().fileName;
            const absolute = path_1.join(path_1.dirname(currentFileName), file);
            return ts.updateCall(importNode, importNode.expression, undefined, [ts.createStringLiteral(absolute)]);
        }
    }
    return null;
}

const lessToStringTransformer = function (context) {
    return (sourceFile) => {
        function visitor(node) {
            // if (node && node.kind == ts.SyntaxKind.ImportDeclaration) {
            //     return visitImportNode(node as ts.ImportDeclaration);
            // }
            if (node && ts.isCallExpression(node)) {
                const result = visitRequireNode(node);
                if (result)
                    return result;
            }
            return ts.visitEachChild(node, visitor, context, visitor, visitor);
        }

        return ts.visitEachChild(sourceFile, visitor, context, visitor, visitor);
    };
};
exports.default = function (program, pluginOptions) {
    return lessToStringTransformer;
}
