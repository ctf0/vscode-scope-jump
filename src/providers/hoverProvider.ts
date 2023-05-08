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
        const symbol: any = await findSymbol(await getFileSymbols(uri), currentLine, uri);

        if (symbol) {
            const start = symbol.range.start;
            const end = symbol.range.end;
            const selectionStart = symbol.selectionRange.start;
            const selectionEnd = symbol.selectionRange.end;

            const atStart = start.line === currentLine;
            const atEnd = end.line === currentLine;
            const atSelectionStart = selectionStart.line === currentLine;
            const atSelectionEnd = selectionEnd.line === currentLine;

            const link = new vscode.MarkdownString('', true);
            link.isTrusted = true;

            if (atStart || atSelectionStart) {
                const argsJump = prepareArgs(new vscode.Range(end, end), 'down');
                const jumpEnd = vscode.Uri.parse(`command:scopeJump.jumpToLine?${argsJump}`);

                const argsSelect = prepareArgs(new vscode.Range(start, end), 'down');
                const selectEnd = vscode.Uri.parse(`command:scopeJump.jumpToLine?${argsSelect}`);

                link.appendMarkdown(`[${jump.text}${jump.icon.down}](${jumpEnd})`);
                link.appendMarkdown(separator);
                link.appendMarkdown(`[${select.text}${select.icon}](${selectEnd})`);

                return new vscode.Hover(link, new vscode.Range(start, start));
            }

            if (atEnd || atSelectionEnd) {
                const argsJump = prepareArgs(new vscode.Range(start, start), 'up');
                const jumpStart = vscode.Uri.parse(`command:scopeJump.jumpToLine?${argsJump}`);

                const argsSelect = prepareArgs(new vscode.Range(end, start), 'up');
                const selectStart = vscode.Uri.parse(`command:scopeJump.jumpToLine?${argsSelect}`);

                link.appendMarkdown(`[${jump.text}${jump.icon.up}](${jumpStart})`);
                link.appendMarkdown(separator);
                link.appendMarkdown(`[${select.text}${select.icon}](${selectStart})`);

                return new vscode.Hover(link, new vscode.Range(end, end));
            }
        }
    }
}

function findSymbol(symbols: vscode.DocumentSymbol[] | undefined, currentLine: number, uri: vscode.Uri) {
    return new Promise(async (resolve, reject) => {
        const symbolsList = filterSameLineSymbols(symbols);

        if (symbolsList && symbolsList.length) {
            for (const symbol of symbolsList) {
                const start = symbol.range.start;
                const end = symbol.range.end;
                const selectionStart = symbol.selectionRange.start;
                const selectionEnd = symbol.selectionRange.end;

                const atStart = start.line === currentLine;
                const atEnd = end.line === currentLine;
                const atSelectionStart = selectionStart.line === currentLine;
                const atSelectionEnd = selectionEnd.line === currentLine;

                if (atStart || atEnd || atSelectionStart || atSelectionEnd) {
                    resolve(symbol);
                    break;
                }

                if (symbol.children) {
                    try {
                        resolve(await findSymbol(symbol.children, currentLine, uri));
                        break;
                    } catch (error) { }
                }
            }
        }

        reject(undefined);
    });
}

function prepareArgs(range: vscode.Range, to: string): string {
    return encodeURIComponent(JSON.stringify([{
        range,
        to,
    }]));
}

async function getFileSymbols(uri: vscode.Uri) {
    return vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', uri);
}


function filterSameLineSymbols(symbols: vscode.DocumentSymbol[] | undefined): vscode.DocumentSymbol[] | undefined {
    return symbols?.filter((symbol: vscode.DocumentSymbol) => symbol.range.isSingleLine === false);
}
