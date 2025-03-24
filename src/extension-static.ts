import * as vscode from "vscode";
import * as path from "path";

// Define an interface to structure the output information
interface OutputInfo {
	projectName: string;
	jsonKeysListLength: number;
	excludedKeyListLength: number;
	filesListLength: number;
	filesExtensions: string[];
	excludedKeyListOutput: string;
	jsonKeysOutput: string;
	unusedJsonKey: number;
}

/**
 * Function to get a sample configuration file
 * @returns Jsonfile content of udt configuration
 */
function getConfigFileExample(): string {
	return `{
	"utdConfig": [
		{
			"labelName": "example",
			"rootPaths": ["C:/path/to/project/folder1", "C:/path/to/project/folder2"],
			"jsonPath": "C:/path/to/your/file.json",
			"excludePath": "C:/path/to/your/utd.exclude.txt",
			"fileToAnalyze": [".ts", ".html"]
		}
	],
	"globalConfig": [
		{
			"outputFolder": ""
		}
	]
}`;
}

/**
 * Function to get a sample exclude file
 * @returns TXT file content to refer in the utd configuration file
 */
function getExcludeFileExample(): string {
	return `key1
key2
key3
...`;
}

/**
 * Function to format the output information into a string
 * @param outputInfo Object of OutputInfo interface containing all data to write in the output file.
 */
function getOutputFile(outputInfo: OutputInfo): string {
	return `***** INFO *****
	
Project : ${outputInfo.projectName}
Unused json keys : ${outputInfo.unusedJsonKey} of ${
		outputInfo.jsonKeysListLength
	}
Ignored keys : ${outputInfo.excludedKeyListLength}
files analyzed : ${outputInfo.filesListLength}
extensions : ${JSON.stringify(outputInfo.filesExtensions)}

***** EXCLUDED KEYS *****

${outputInfo.excludedKeyListOutput}
***** UNUSED KEYS *****

${outputInfo.jsonKeysOutput}
`;
}

/**
 * Function to get the root path of the VsCode workspace
 * @returns String of the root path or undefined if no folder is open in VsCode
 */
function getRootPath(): string | undefined {
	return vscode.workspace.workspaceFolders &&
		vscode.workspace.workspaceFolders.length > 0
		? vscode.workspace.workspaceFolders[0].uri.fsPath
		: undefined;
}

/**
 * Function to get the path to the configuration file
 * @returns String of the configuration file path or undefined if it does not exist
 */
function getConfigFilePath(): string | undefined {
	const rootPath = getRootPath();
	return rootPath ? path.join(rootPath, "utd.config.json") : undefined;
}

/**
 * Function to get the path to the exclude file
 * @returns String of the sample exclude file path or undefined if it does not exist
 */
function getExcludeFilePath(): string | undefined {
	const rootPath = getRootPath();
	return rootPath ? path.join(rootPath, "utd.exclude.txt") : undefined;
}

/**
 * Function to show an error message if no project is open
 */
async function showErrorNoOpenProject(): Promise<void> {
	vscode.window.showErrorMessage("No project currently open");
}

/**
 * Function to show an error message if a file already exists
 * @param file File path or name to display in the message
 */
async function showErrorFileExist(file: string): Promise<void> {
	vscode.window.showErrorMessage(`File already exists : ${file}`);
}

/**
 * Function to show an error message if a file does not exist
 * @param file File path or name to display in the message
 */
async function showErrorFileNotExist(file: string): Promise<void> {
	vscode.window.showErrorMessage(`File not exists : ${file}`);
}

/**
 * Function to show an information message when analysis starts
 * @param projectName Project name to display in the message
 */
async function showInfoAnalyzeStarted(projectName: string): Promise<void> {
	vscode.window.showInformationMessage(`Analyze started : ${projectName}`);
}

/**
 * Function to show an information message when a file is created
 * @param filePath Path of the output file to display in the message
 */
async function showInfoFileCreated(filePath: string): Promise<void> {
	vscode.window.showInformationMessage(
		`File created and written at : ${filePath}`
	);
}

// Export functions and interface for use in other modules
export {
	getRootPath,
	getConfigFileExample,
	getExcludeFileExample,
	getExcludeFilePath,
	getConfigFilePath,
	getOutputFile,
	showErrorNoOpenProject,
	showErrorFileExist,
	showErrorFileNotExist,
	showInfoFileCreated,
	showInfoAnalyzeStarted,
	OutputInfo,
};
