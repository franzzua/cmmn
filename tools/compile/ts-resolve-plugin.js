import ts from "typescript";
import path from "path";
import fs from "fs";
import { ImportPathsResolver } from '@zerollup/ts-helpers'

class Visitor {
    /**
     * @type {ImportPathsResolver}
     */
    resolver;
    /**
     * @type {ts.TransformationContext}
     */
    context;
    /**
     * @type {ts.CompilerOptions}
     */
    options;
    /**
     * @type {{
     *     copy: RegExp;
     *     import: RegExp;
     * }}
     */
    config;
    /**
     *
     * @param context {ts.TransformationContext}
     */
    constructor(context, config) {
        this.context = context;
        this.options = context.getCompilerOptions();
        this.resolver = new ImportPathsResolver({
            paths: this.options.paths,
            baseUrl: this.options.baseUrl,
            exclude: []
        });
        this.config = {
            copy: /\.(less|css|scss|sass|png|jpg|ico)$/,
            import: /\.(txt|sql|svg|html)$/,
            ...config
        }
    }
    findFile(importPath, sourceFile) {
        const sourceFileDir = path.dirname(sourceFile.path);

        return [
            importPath,
            importPath + "/index.ts",
            importPath + ".ts",
            importPath + ".tsx",
            importPath + "/index.js",
            importPath + ".js",
            importPath + ".jsx",
            importPath.replace(/\.js$/, ".ts")
        ].find(x => fs.existsSync(path.resolve(sourceFileDir, x)))?.replace(/(\.ts)x?$/, '.js');
    }
    resolveFile(importPath, sourceFile){
        const sourceFileDir = path.dirname(sourceFile.path);
        const existed = this.findFile(importPath, sourceFile);
        if (existed) return existed;
        const suggestions = this.resolver.getImportSuggestions(importPath, sourceFileDir) ?? [];
        for (let suggestion of suggestions) {
            const existed = this.findFile(suggestion, sourceFile)
            if (existed) return existed;
        }
        return importPath;
    }
    /**
     * @param importPath {string}
     * @param sourceFile {ts.SourceFile}
     */
    resolve(importPath, sourceFile){
        importPath = this.resolveFile(importPath, sourceFile);
        const sourceFileDir = path.dirname(sourceFile.path);
        const caseSensitiveFileNames = this.context.getEmitHost().useCaseSensitiveFileNames();
        const formatPath = caseSensitiveFileNames ? x => x : x => x.toLowerCase();
        const absSource = path.join(this.options.outDir, path.relative(this.options.baseUrl, sourceFileDir));
        const abs = path.resolve(sourceFileDir, importPath);
        if (this.config.import.test(importPath)) {
            const content = fs.readFileSync(path.resolve(sourceFileDir, importPath), 'utf-8');
            const outFile = path.resolve(absSource, importPath).replaceAll(path.sep, '/') + '.js';
            fs.mkdirSync(path.dirname(outFile), {recursive: true});
            fs.writeFileSync(outFile, 'export default `'+content.replaceAll('`','\\`')+'`', 'utf-8');
            return importPath+".js";
        }
        if (this.config.copy.test(importPath)) {
            // console.log(abs, absSource, path.relative(absSource,abs));
            // const outFile = path.resolve(absSource, importPath).replaceAll(path.sep, '/');
            // fs.cpSync(path.resolve(sourceFileDir, importPath), outFile);
            return  path.relative(absSource,abs);
        }
        return importPath;
    }

    visitSourceFile = sourceFile => ts.visitEachChild(sourceFile, node => this.visit(node,sourceFile), this.context);

    /**
     * @param node {ts.Node}
     * @param sourceFile {ts.SourceFile}
     */
    visit(node,sourceFile){
        // if (node && node.kind == SyntaxKind.ImportDeclaration) {
        //     return visitImportNode(node as ts.ImportDeclaration);
        // }
        if (!node)
            return ts.visitEachChild(node, this.visit, this.context);
        if (ts.isCallExpression(node)) {
            const result = this.visitRequireNode(node, sourceFile);
            if (result)
                return result;
        }
        if (ts.isImportDeclaration(node)) {
            const result = this.visitImportNode(node, sourceFile);
            if (result)
                return result;
        }
        if (ts.isExportDeclaration(node)) {
            const result = this.visitExportNode(node, sourceFile);
            if (result)
                return result;
        }
        return ts.visitEachChild(node, node => this.visit(node, sourceFile), this.context);
    }


    /**
     * @param exportNode {ts.ExportDeclaration}
     * @param sourceFile {ts.SourceFile}
     */
    visitExportNode(exportNode, sourceFile) {
        if (exportNode.typeOnly){
            console.log('type olnly')
            return ;
        }
        const file = exportNode.moduleSpecifier?.text ?? exportNode.text;
        if (!file)
            return;

        const resolved = this.resolve(file, sourceFile);

        const newNode = this.context.factory.updateExportDeclaration(
            exportNode,
            exportNode.decorators,
            exportNode.modifiers,
            exportNode.exportClause,
            this.context.factory.createStringLiteral(resolved),
            exportNode.typeOnly
        );
        if (newNode.flags !== exportNode.flags) {
            newNode.flags = exportNode.flags
        }
        return newNode;
    }

    /**
     * @param importNode {ts.ImportDeclaration}
     * @param sourceFile {ts.SourceFile}
     */
    visitImportNode(importNode, sourceFile) {
        const file = importNode.moduleSpecifier?.text;
        if (!file)
            return;
        const resolved = this.resolve(file, sourceFile);

        const newNode = this.context.factory.updateImportDeclaration(
            importNode,
            importNode.modifiers,
            importNode.importClause,
            this.context.factory.createStringLiteral(resolved),
            importNode.assertClause,
        );
        newNode.flags = importNode.flags;
        return newNode;
        // const caseSensitiveFileNames = this.context.getEmitHost().useCaseSensitiveFileNames();
        // const formatPath = caseSensitiveFileNames ? x => x : x => x.toLowerCase();
        // const sourceFileDir = path.dirname(sourceFile.path);
        // const abs = formatPath(path.resolve(sourceFileDir, formatPath(file)));
        // if (/\.(less|css|scss|sass|svg|png|html)$/.test(file)) {
        //     const absSource = formatPath(path.join(this.options.outDir, formatPath(path.relative(this.options.baseUrl, sourceFileDir))));
        //     const relFile = path.relative(absSource, abs).replaceAll(path.sep, '/');
        //     return this.context.factory.updateImportDeclaration(
        //         importNode,
        //         importNode.decorators,
        //         importNode.modifiers,
        //         importNode.importClause,
        //         importNode.assertClause,
        //         this.context.factory.createStringLiteral(relFile)
        //     );
        // }
        // if (/\.(json|tsx?|jsx?)$/.test(file))
        //     return;
        // if (fs.existsSync(abs + '.ts') || fs.existsSync(abs + '.tsx')) {
        //     return this.context.factory.updateImportDeclaration(
        //         importNode,
        //         importNode.decorators,
        //         importNode.modifiers,
        //         importNode.importClause,
        //         importNode.assertClause,
        //         this.context.factory.createStringLiteral(file + '.js')
        //     );
        // }
        // if (fs.existsSync(abs + '/')) {
        //     const indexFile = `${file}/index.js`;
        //     return this.context.factory.updateImportDeclaration(
        //         importNode,
        //         importNode.decorators,
        //         importNode.modifiers,
        //         importNode.importClause,
        //         importNode.assertClause,
        //         this.context.factory.createStringLiteral(indexFile)
        //     );
        // }
    }

    /**
     * @param importNode {ts.Node}
     * @param sourceFile {ts.SourceFile}
     */
    visitRequireNode(importNode, sourceFile) {
        if (importNode.expression.kind !== ts.SyntaxKind.Identifier ||
            importNode.expression.escapedText !== "require") {
            return;
        }
        const file = importNode.arguments[0].text;
        const resolved = this.resolve(file, sourceFile);
        return this.context.factory.updateCallExpression(
            importNode,
            importNode.expression,
            undefined,
            [this.context.factory.createStringLiteral(resolved)]
        );
    }
}

export const tsResolvePlugin = function (contextOrOptions) {
    if(!contextOrOptions.getCompilerOptions)
        return context => new Visitor(context, contextOrOptions).visitSourceFile;
    return new Visitor(contextOrOptions).visitSourceFile;
};