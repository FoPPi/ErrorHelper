import * as vscode from 'vscode';
import axios from 'axios';

let panel: vscode.WebviewPanel | undefined = undefined;

function activate(context: vscode.ExtensionContext) {
  const fixCodeLine = vscode.commands.registerCommand('errorhelper.fixCodeLine', async () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.selection) {
      const selectedText = editor.document.getText(editor.selection);
      const language = editor.document.languageId;
      const codeLine = encodeURIComponent(selectedText);

      const apiUrl = `https://errorhelperfastapi.onrender.com/helper/${language}/${codeLine}`;

      axios.get(apiUrl)
        .then(response => {

        const replacementText = response.data.response;

        if (response.data.response_type === "OK") {
          editor.edit((editBuilder) => {
            editBuilder.replace(editor.selection, replacementText);
          });

          vscode.window.showInformationMessage("Success.\n" + replacementText);
        } else {
          if (panel) {
            panel.title = 'AI Response';
            panel.webview.html = getWebviewContent(replacementText, response.data.full_response);
          } else {
            panel = vscode.window.createWebviewPanel(
              'errorhelperWebview',
              'AI Response',
              vscode.ViewColumn.One,
              {}
            );

            panel.webview.html = getWebviewContent(replacementText, response.data.full_response);

            panel.onDidDispose(() => {
              panel = undefined;
            });
          }
        }
      })
      .catch(error => {
        vscode.window.showErrorMessage(error.message);
      });
    }
  });

  context.subscriptions.push(fixCodeLine);
}

function getWebviewContent(replacementText: string, fullResponse: string): string {

  return `
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
        }
        h1 {
          font-size: 20px;
        }
        pre {
          background-color: #181818;
          padding: 10px;
          border: 1px solid #0078d4;
          border-radius: 5px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      </style>
    </head>
    <body>
      <h1>AI Response</h1>
      <pre>${replacementText}</pre>
      <p><strong>Full AI Response:</strong></p>
      <pre>${fullResponse}</pre>
    </body>
    </html>
  `;
}

exports.activate = activate;
