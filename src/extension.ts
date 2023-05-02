import * as vscode from 'vscode';
import HoverProvider from './providers/hoverProvider';

export function activate(context: vscode.ExtensionContext) {
    readConfig();

    context.subscriptions.push(
        // config
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration(PACKAGE_NAME)) {
                readConfig();
            }
        }),
        // cmnd
        vscode.commands.registerCommand('scopeJump.jumpToLine', async (args) => {
            const editor = vscode.window.activeTextEditor;

            if (editor) {
                const to = args.to;
                const isDown = to == 'down';
                const start = args.range[0];
                const end = args.range[1];

                const range = new vscode.Range(
                    new vscode.Position(start.line, start.character),
                    new vscode.Position(end.line, end.character),
                );

                editor.selection = isDown
                    ? new vscode.Selection(range.start, range.end)
                    : new vscode.Selection(range.end, range.start);

                await vscode.commands.executeCommand('revealLine', {
                    lineNumber : isDown ? range.end.line : range.start.line,
                    at         : 'center',
                });

                await vscode.window.showTextDocument(editor.document);
            }
        }),
        // hover
        vscode.languages.registerHoverProvider('*', new HoverProvider(config)),
    );
}

/* Config ------------------------------------------------------------------- */
export const PACKAGE_NAME = 'scopeJump';
let config: vscode.WorkspaceConfiguration;

export function readConfig() {
    config = vscode.workspace.getConfiguration(PACKAGE_NAME);
}

export function deactivate() { }
