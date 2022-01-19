const ts = require("typescript");
const path = require("path");

function visitRequireNode(importNode, sourceFile) {
    if (importNode.expression.kind == ts.SyntaxKind.Identifier &&
        importNode.expression.escapedText == "require") {
        const file = importNode.arguments[0].text;
        if (/\.(less|css|scss|sass|svg|png|html)/.test(file)) {
            const sourceFileDir = path.dirname(sourceFile.path);
            const real = path.join(sourceFileDir, file);
            return ts.updateCall(importNode, importNode.expression, undefined, [ts.createStringLiteral(real)]);
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
                const result = visitRequireNode(node, sourceFile);
                if (result)
                    return result;
            }
            return ts.visitEachChild(node, visitor, context);
        }

        return ts.visitEachChild(sourceFile, visitor, context);
    };
};
exports.default = function (program, pluginOptions) {
    return lessToStringTransformer;
}
