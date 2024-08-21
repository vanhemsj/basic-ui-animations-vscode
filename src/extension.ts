import * as vscode from 'vscode';

interface Config {
  typingEffectColor: string;
  typingEffectDuration: number;
  copyHighlightColor: string;
  pasteHighlightColor: string;
  highlightDuration: number;
}

let isUserPasting = false;
let config: Config;
let decorationTypes: {
  typing: vscode.TextEditorDecorationType;
  copy: vscode.TextEditorDecorationType;
  paste: vscode.TextEditorDecorationType;
};

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "basicUIAnimations" is now active');
  vscode.commands.executeCommand('setContext', 'basicUIAnimations.init', true);

  updateConfig();
  createDecorationTypes();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(handleConfigChange),
    vscode.workspace.onDidChangeTextDocument(handleTextChange),
    vscode.commands.registerCommand("basicUIAnimations.copy", handleCopy),
    vscode.commands.registerCommand("basicUIAnimations.paste", handlePaste)
  );
}

function updateConfig() {
  const wsConfig = vscode.workspace.getConfiguration("basicUIAnimations");
  config = {
    typingEffectColor: wsConfig.get("typingEffectColor") || "rgba(43, 255, 0, 0.6)",
    typingEffectDuration: wsConfig.get("typingEffectDuration") || 75,
    copyHighlightColor: wsConfig.get("copyHighlightColor") || "rgba(230, 97, 89, 0.7)",
    pasteHighlightColor: wsConfig.get("pasteHighlightColor") || "rgba(255, 255, 0, 0.3)",
    highlightDuration: wsConfig.get("highlightDuration") || 200
  };
}

function createDecorationTypes() {
  decorationTypes = {
    typing: vscode.window.createTextEditorDecorationType({
      backgroundColor: config.typingEffectColor
    }),
    copy: vscode.window.createTextEditorDecorationType({
      backgroundColor: config.copyHighlightColor
    }),
    paste: vscode.window.createTextEditorDecorationType({
      backgroundColor: config.pasteHighlightColor
    })
  };
}

function handleConfigChange(event: vscode.ConfigurationChangeEvent) {
  if (event.affectsConfiguration("basicUIAnimations")) {
    updateConfig();
    createDecorationTypes();
  }
}

function handleTextChange(event: vscode.TextDocumentChangeEvent) {
  const editor = vscode.window.activeTextEditor;
  if (editor && event.document === editor.document && !isUserPasting) {
    event.contentChanges.forEach(change => {
      const range = calculateRange(change);
      animateChange(editor, range);
    });
  }
}

async function handleCopy() {
  const editor = vscode.window.activeTextEditor;
  if (editor && !editor.selection.isEmpty) {
    await vscode.commands.executeCommand("editor.action.clipboardCopyAction");
    highlightSelection(editor, editor.selection);
  }
}

async function handlePaste() {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    isUserPasting = true;
    const initialPosition = editor.selection.active;
    await vscode.commands.executeCommand("editor.action.clipboardPasteAction");
    const endPosition = editor.selection.active;
    highlightPastedText(editor, new vscode.Range(initialPosition, endPosition));
    setTimeout(() => {
      isUserPasting = false;
    }, 100);
  }
}

function calculateRange(change: vscode.TextDocumentContentChangeEvent): vscode.Range {
  const { start, end } = change.range;
  if (change.text.length > 0) {
    const lines = change.text.split('\n');
    if (lines.length > 1) {
      return new vscode.Range(start, new vscode.Position(start.line + lines.length - 1, lines[lines.length - 1].length));
    }
    return new vscode.Range(start, start.translate(0, change.text.length));
  }
  return new vscode.Range(start, end);
}

function animateChange(editor: vscode.TextEditor, range: vscode.Range) {
  editor.setDecorations(decorationTypes.typing, [range]);
  setTimeout(() => {
    editor.setDecorations(decorationTypes.typing, []);
  }, config.typingEffectDuration);
}

function highlightSelection(editor: vscode.TextEditor, selection: vscode.Selection) {
  editor.setDecorations(decorationTypes.copy, [selection]);
  setTimeout(() => {
    editor.setDecorations(decorationTypes.copy, []);
  }, config.highlightDuration);
}

function highlightPastedText(editor: vscode.TextEditor, range: vscode.Range) {
  editor.setDecorations(decorationTypes.paste, [range]);
  setTimeout(() => {
    editor.setDecorations(decorationTypes.paste, []);
  }, config.highlightDuration);
}

export function deactivate() {
  console.log('Extension "basicUIAnimations" is now deactivated');
}