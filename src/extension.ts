import * as vscode from 'vscode';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

let panel: vscode.WebviewPanel | undefined = undefined;

dotenv.config({ path: path.join(__dirname, '..', '.env') });

function activate(context: vscode.ExtensionContext) {
  const fixCodeLine = vscode.commands.registerCommand('errorhelper.fixCodeLine', async () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.selection) {
      const selectedText = editor.document.getText(editor.selection);
      const language = editor.document.languageId;
      const codeLine = encodeURIComponent(selectedText);

      const apiUrl = `${process.env.SERVER_IP}/helper/${language}/${codeLine}`;

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
    else{
      vscode.window.showErrorMessage("Select code line");
    }
  });

  const openResponseWebView = vscode.commands.registerCommand('errorhelper.openResponseWebView', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.selection) {
      const selectedText = editor.document.getText(editor.selection);
      const language = editor.document.languageId;
      const codeLine = encodeURIComponent(selectedText);

      const apiUrl = `${process.env.SERVER_IP}/helper/${language}/${codeLine}`;

      axios.get(apiUrl)
        .then(response => {
        const replacementText = response.data.response;
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
      })
      .catch(error => {
        vscode.window.showErrorMessage(error.message);
      });
    }
    else{
      vscode.window.showErrorMessage("Select code line");
    }
  });

  context.subscriptions.push(fixCodeLine);
  context.subscriptions.push(openResponseWebView);
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
          font-family: Arial, sans-serif;
          font-size: 16px;
          padding: 10px;
          border: 1px solid #0078d4;
          border-radius: 5px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      </style>
    </head>
    <body markdown="block">
      <h1>AI Response</h1>
      <pre>${replacementText}</pre>
      <h2>Full AI Response:</h1>
      <pre>${fullResponse}</pre>
    </body>
    </html>
  `;
}

exports.activate = activate;
