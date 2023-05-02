import * as vscode from 'vscode';

export default class HoverProvider implements vscode.HoverProvider {

    config: vscode.WorkspaceConfiguration;

    constructor(config) {
        this.config = config;
    }

    async provideHover(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | undefined> {
        if (!document || document?.isClosed) {
            return;
        }

        const { uri } = document;

        const config = this.config;
        const jump = config.linkText.jump;
        const select = config.linkText.select;
        const separator = ' $(kebab-vertical) ';

        const currentLine = position.line;
        const symbols: vscode.DocumentSymbol[] | undefined = filterSameLineSymbols(getAllSymbols(await getFileSymbols(uri)));

        if (symbols && symbols.length) {
            for (const symbol of symbols) {
                const start = symbol.range.start;
                const end = symbol.range.end;
                const atStart = start.line === currentLine;
                const atEnd = end.line === currentLine;

                const selectionStart = symbol.selectionRange.start;
                const selectionEnd = symbol.selectionRange.end;
                const atSelectionStart = selectionStart.line === currentLine;
                const atSelectionEnd = selectionEnd.line === currentLine;

                if (atStart || atEnd || atSelectionStart || atSelectionEnd) {
                    const link = new vscode.MarkdownString('', true);
                    link.isTrusted = true;

                    if (atStart) {
                        const argsJump = prepareArgs(new vscode.Range(end, end), 'down');
                        const jumpEnd = vscode.Uri.parse(`command:scopeJump.jumpToLine?${argsJump}`);

                        const argsSelect = prepareArgs(new vscode.Range(start, end), 'down');
                        const selectEnd = vscode.Uri.parse(`command:scopeJump.jumpToLine?${argsSelect}`);

                        link.appendMarkdown(`[${jump.text}${jump.icon.down}](${jumpEnd})`);
                        link.appendMarkdown(separator);
                        link.appendMarkdown(`[${select.text}${select.icon}](${selectEnd})`);

                        return new vscode.Hover(link, new vscode.Range(start, start));
                    }

                    if (atSelectionStart) {
                        const argsJump = prepareArgs(new vscode.Range(end, end), 'down');
                        const jumpEnd = vscode.Uri.parse(`command:scopeJump.jumpToLine?${argsJump}`);

                        const argsSelect = prepareArgs(new vscode.Range(selectionStart, end), 'down');
                        const selectEnd = vscode.Uri.parse(`command:scopeJump.jumpToLine?${argsSelect}`);

                        link.appendMarkdown(`[${jump.text}${jump.icon.down}](${jumpEnd})`);
                        link.appendMarkdown(separator);
                        link.appendMarkdown(`[${select.text}${select.icon}](${selectEnd})`);

                        return new vscode.Hover(link, new vscode.Range(selectionStart, selectionStart));
                    }

                    if (atEnd) {
                        const argsJump = prepareArgs(new vscode.Range(start, start), 'up');
                        const jumpStart = vscode.Uri.parse(`command:scopeJump.jumpToLine?${argsJump}`);

                        const argsSelect = prepareArgs(new vscode.Range(end, start), 'up');
                        const selectStart = vscode.Uri.parse(`command:scopeJump.jumpToLine?${argsSelect}`);

                        link.appendMarkdown(`[${jump.text}${jump.icon.up}](${jumpStart})`);
                        link.appendMarkdown(separator);
                        link.appendMarkdown(`[${select.text}${select.icon}](${selectStart})`);

                        return new vscode.Hover(link, new vscode.Range(end, end));
                    }
                } else {
                    continue;
                }
            }
        }
    }
}

function prepareArgs(range: vscode.Range, to: string): string {
    return encodeURIComponent(JSON.stringify([{
        range,
        to,
    }]));
}

async function getFileSymbols(uri: vscode.Uri): Promise<vscode.DocumentSymbol[] | undefined> {
    return vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', uri);
}

function getAllSymbols(symbols: vscode.DocumentSymbol[] | undefined): vscode.DocumentSymbol[] {
    const list: vscode.DocumentSymbol[] = [];

    if (symbols && symbols.length) {
        for (const symbol of symbols) {
            list.push(symbol);

            if (symbol.children.length) {
                list.push(...getAllSymbols(symbol.children));
            }
        }
    }

    return list;
}

function filterSameLineSymbols(symbols: vscode.DocumentSymbol[] | undefined): vscode.DocumentSymbol[] | undefined {
    return symbols?.filter((symbol: vscode.DocumentSymbol) => symbol.range.isSingleLine === false);
}
