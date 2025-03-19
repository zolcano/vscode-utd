import * as vscode from "vscode";
import * as path from "path";

function getConfigFileExample(): string {
	return `{
    "projectConfig": [
        {
            "labelName": "example",
            "rootPath": "C:/path/to/project/folder",
            "jsonPath": "C:/path/to/your/file.json",
            "excludeFilePath": "C:/path/to/your/utd.exclude.txt"
        }
    ],
    "utdConfig": [
        {
            "outputFolder": ""
        }
    ]
}`;
}

function getExcludeFileExample(): string {
	return `key1\nkey2\nkey3\n...`;
}

function getRootPath(): string | undefined {
	return vscode.workspace.workspaceFolders &&
		vscode.workspace.workspaceFolders.length > 0
		? vscode.workspace.workspaceFolders[0].uri.fsPath
		: undefined;
}

function getConfigFilePath(ROOT_PATH: string): string {
	return path.join(ROOT_PATH, "utd.config.json");
}

function getExcludeFilePath(ROOT_PATH: string): string {
	return path.join(ROOT_PATH, "utd.exclude.txt");
}

function showErrorNoOpenProject(): void {
	vscode.window.showErrorMessage("No project currently open");
}

function showErrorFileExist(): void {
	vscode.window.showErrorMessage("File already exists");
}

function showErrorFileNotExist(FILE_PATH: string): void {
	vscode.window.showErrorMessage(`File not exists ${FILE_PATH}`);
}

function showInfoAnalyzeStarted(projectName: string): void {
	vscode.window.showInformationMessage(
		`Analyze started for ${projectName} project`
	);
}

function showInfoFileCreated(FILE_PATH: string): void {
	vscode.window.showInformationMessage(
		`File created and written to: ${FILE_PATH})}`
	);
}

export {
	getRootPath,
	getConfigFileExample,
	getExcludeFileExample,
	getExcludeFilePath,
	getConfigFilePath,
	showErrorNoOpenProject,
	showErrorFileExist,
	showErrorFileNotExist,
	showInfoFileCreated,
	showInfoAnalyzeStarted,
};
