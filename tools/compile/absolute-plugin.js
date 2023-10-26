import ts from "typescript";
import path from "path";
import fs from "fs";

function visitExportNode(exportNode, sourceFile) {
    if (exportNode.typeOnly){
        console.log('type olnly')
        return ;
    }
    const file = exportNode.moduleSpecifier?.text ?? exportNode.test;
    if (!file || !file.startsWith('.'))
        return;
    const sourceFileDir = path.dirname(sourceFile.path);
    const abs = path.resolve(sourceFileDir, file);
    if (/\.(less|css|scss|sass|svg|png|html)$/.test(file)) {
        const absSource = path.join(options.outDir, path.relative(options.baseUrl, sourceFileDir));
        const relFile = path.relative(absSource, abs).replaceAll(path.sep, '/');
        return ts.updateExportDeclaration(exportNode, exportNode.decorators, exportNode.modifiers, exportNode.exportClause, ts.createStringLiteral(relFile), exportNode.typeOnly);
    }
    if (fs.existsSync(abs + '.ts') || fs.existsSync(abs + '.tsx')) {
        return ts.updateExportDeclaration(exportNode, exportNode.decorators, exportNode.modifiers, exportNode.exportClause, ts.createStringLiteral(file + '.js'), exportNode.typeOnly);
    }
    if (fs.existsSync(abs + '/')) {
        const indexFile = `${file}/index.js`;
        return ts.updateExportDeclaration(exportNode, exportNode.decorators, exportNode.modifiers, exportNode.exportClause, ts.createStringLiteral(indexFile), exportNode.typeOnly);
    }
}

function visitImportNode(importNode, sourceFile, options, context) {
    const factory = context.factory;
    const file = importNode.moduleSpecifier?.text;
    if (!file || !file.startsWith('.'))
        return;
    const caseSensitiveFileNames = context.getEmitHost().useCaseSensitiveFileNames();
    const formatPath = caseSensitiveFileNames ? x => x : x => x.toLowerCase();
    const sourceFileDir = path.dirname(sourceFile.path);
    const abs = formatPath(path.resolve(sourceFileDir, formatPath(file)));
    if (/\.(less|css|scss|sass|svg|png|html)$/.test(file)) {
        const absSource = formatPath(path.join(options.outDir, formatPath(path.relative(options.baseUrl, sourceFileDir))));
        const relFile = path.relative(absSource, abs).replaceAll(path.sep, '/');
        return factory.updateImportDeclaration(importNode, importNode.decorators, importNode.modifiers, importNode.importClause, factory.createStringLiteral(relFile));
    }
    if (/\.(json|tsx?|jsx?)$/.test(file))
        return;
    if (fs.existsSync(abs + '.ts') || fs.existsSync(abs + '.tsx')) {
        return factory.updateImportDeclaration(importNode, importNode.decorators, importNode.modifiers, importNode.importClause, factory.createStringLiteral(file + '.js'));
    }
    if (fs.existsSync(abs + '/')) {
        const indexFile = `${file}/index.js`;
        return factory.updateImportDeclaration(importNode, importNode.decorators, importNode.modifiers, importNode.importClause, factory.createStringLiteral(indexFile));
    }
}

function visitRequireNode(importNode, sourceFile) {
    if (!(importNode.expression.kind == ts.SyntaxKind.Identifier &&
        importNode.expression.escapedText == "require")) {
        return;
    }
    const file = importNode.arguments[0].text;
    if (/\.(less|css|scss|sass|svg|png|html)/.test(file)) {
        const sourceFileDir = path.dirname(sourceFile.path);
        const abs = path.join(sourceFileDir, file);
        const absSource = path.join(options.outDir, path.relative(options.baseUrl, sourceFileDir));
        const relFile = path.relative(absSource, abs).replaceAll(path.sep, '/');
        return ts.updateCall(importNode, importNode.expression, undefined, [ts.createStringLiteral(relFile)]);
    }
}

export const lessToStringTransformer = function (context) {
    const options = context.getCompilerOptions();
    return (sourceFile) => {
        function visitor(node) {
            // if (node && node.kind == ts.SyntaxKind.ImportDeclaration) {
            //     return visitImportNode(node as ts.ImportDeclaration);
            // }
            if (!node)
                return ts.visitEachChild(node, visitor, context);
            if (ts.isCallExpression(node)) {
                const result = visitRequireNode(node, sourceFile);
                if (result)
                    return result;
            }
            if (ts.isImportDeclaration(node)) {
                const result = visitImportNode(node, sourceFile, options, context);
                if (result)
                    return result;
            }
            if (ts.isExportDeclaration(node)) {
                const result = visitExportNode(node, sourceFile);
                if (result)
                    return result;
            }
            return ts.visitEachChild(node, visitor, context);
        }

        return ts.visitEachChild(sourceFile, visitor, context);
    };
};