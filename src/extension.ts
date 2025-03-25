import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
// Import utility functions and the interface from extension-static modules
import {
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
} from "./extension-static";

import { researchDir, fileResearch, findJsonKeys } from "./analyze";
import { UtdTreeProjectDataProvider } from "./project-tree-views";
import { UtdTreeSettingsDataProvider } from "./settings-tree-views";
import { UtdTreeOutputDataProvider } from "./output-tree-views";

/**
 * Function to activate the VsCode extension. Automatically called by VsCode.
 * @param context - The extension context.
 */

function activate(context: vscode.ExtensionContext) {
	// Execute the command to refresh the UTD entry at startup.
	vscode.commands.executeCommand("utd.refreshEntry");

	/**
	 * Register the command "utd.refreshEntry" to refresh the UTD entry,
	 * and assign the function to it.
	 *
	 * The function declares new data provider Class object who initialize the view tree.
	 */
	let refreshEntry = vscode.commands.registerCommand("utd.refreshEntry", () => {
		if (getRootPath()) {
			vscode.window.registerTreeDataProvider(
				"utd-project",
				new UtdTreeProjectDataProvider()
			);
			vscode.window.registerTreeDataProvider(
				"utd-settings",
				new UtdTreeSettingsDataProvider()
			);
			vscode.window.registerTreeDataProvider(
				"utd-output",
				new UtdTreeOutputDataProvider()
			);
		} else {
			showErrorNoOpenProject();
		}
	});

	/**
	 * Register the command "utd.openFile" to show the given file in VsCode,
	 * and assign the function to it.
	 *
	 * The function takes the given file path and opens it.
	 */
	let openFile = vscode.commands.registerCommand(
		"utd.openFile",
		(filePath: string) => {
			if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
				vscode.workspace.openTextDocument(filePath).then((document) => {
					vscode.window.showTextDocument(document);
				});
			} else {
				showErrorFileNotExist(filePath);
			}
		}
	);

	/**
	 * Register the command "utd.createConfigFile" to initialize an example of configuration file
	 * in the root of opened project and assign the function to it.
	 *
	 * The function write "utd.config.json" file at the root project opened.
	 */
	let createConfigFile = vscode.commands.registerCommand(
		"utd.createConfigFile",
		async () => {
			if (getRootPath()) {
				const configFilePath: string | undefined = getConfigFilePath();
				if (configFilePath && !fs.existsSync(configFilePath)) {
					await fs.promises.writeFile(configFilePath, getConfigFileExample());
					showInfoFileCreated(configFilePath);
					vscode.commands.executeCommand("utd.refreshEntry");
				} else {
					showErrorFileExist("utd.config.json");
				}
				vscode.commands.executeCommand("utd.openFile", configFilePath);
			} else {
				showErrorNoOpenProject();
			}
		}
	);

	/**
	 * Register the command "utd.createExcludeFile" to initialise an example of exclude file
	 * in the root of opened project and assign the function to it.
	 *
	 * The function write "utd.exclude.txt" file at the root project opened.
	 */

	let createExcludeFile = vscode.commands.registerCommand(
		"utd.createExcludeFile",
		async () => {
			if (getRootPath()) {
				const excludeFilePath: string | undefined = getExcludeFilePath();
				if (excludeFilePath && !fs.existsSync(excludeFilePath)) {
					await fs.promises.writeFile(excludeFilePath, getExcludeFileExample());
					showInfoFileCreated(excludeFilePath);
					vscode.commands.executeCommand("utd.refreshEntry");
				} else {
					showErrorFileExist("utd.exclude.txt");
				}
				vscode.commands.executeCommand("utd.openFile", excludeFilePath);
			} else {
				showErrorNoOpenProject();
			}
		}
	);

	let openHighlightedPath = vscode.commands.registerCommand(
		"utd.openHighlightedPath",
		() => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				const selection = editor.selection;
				const data = editor.document.getText(selection);
				const filePath = data.replace(/[\r\n]+/g, "");

				vscode.commands.executeCommand("utd.openFile", filePath);
			}
		}
	);

	/**
	 * Register the command "utd.analyze" to analyze a project
	 * and assign the function to it.
	 */
	let analyze = vscode.commands.registerCommand(
		"utd.analyze",
		async function (
			projectName: string,
			rootPaths: string[],
			jsonPath: string,
			extensions: string[],
			excludeFilePath: string | undefined,
			outputFolder: string | undefined
		) {
			if (!fs.existsSync(jsonPath)) {
				showErrorFileNotExist(jsonPath);
			} else {
				showInfoAnalyzeStarted(projectName);
				const outputChannel = vscode.window.createOutputChannel("utd");
				outputChannel.show(true);

				const filesList: string[] = [];
				const jsonKeysList: [string, number][] = [];
				let excludedKeyList: string[] = [];

				type lineinfo = [string, number];
				let composedKey: [string, [string, number]][] = [];

				for (let rootPath of rootPaths) {
					await researchDir(rootPath, filesList, extensions);
				}
				await findJsonKeys(jsonPath, jsonKeysList);

				if (excludeFilePath) {
					const data = fs.readFileSync(excludeFilePath, "utf-8");
					excludedKeyList = data
						.split("\n")
						.map((str) => str.replace(/[\r\n]+/g, ""));

					// Remove excluded keys from JSON keys list
					for (let excludedKey of excludedKeyList) {
						for (let i = 0; i < jsonKeysList.length; i++) {
							if (jsonKeysList[i][0] === excludedKey) {
								jsonKeysList.splice(i, 1);
								i--;
							}
						}
					}
				}

				await fileResearch(filesList, jsonKeysList, composedKey, outputChannel);

				// Initialize output information object
				let outputInfo: OutputInfo = {
					projectName: projectName,
					jsonKeysListLength: jsonKeysList.length,
					excludedKeyListLength: excludedKeyList.length,
					filesListLength: filesList.length,
					filesExtensions: extensions,
					excludedKeyListOutput: "",
					jsonKeysOutput: "",
					unusedJsonKey: 0,
					composedKeyOutput: "",
					composedKeyNumber: 0,
				};

				for (let excludedKey of excludedKeyList) {
					// Append the excluded key to the output string
					outputInfo.excludedKeyListOutput += `${excludedKey}\n`;
				}

				for (let jsonKey of jsonKeysList) {
					if (jsonKey[1] === 0) {
						// Append the json key to the output string
						outputInfo.jsonKeysOutput += `${jsonKey[0]}\n`;
						// Increment the count of unused JSON keys
						outputInfo.unusedJsonKey += 1;
					}
				}

				//Append the composedKeyOuput key to the ouput string.
				//Array format : [path, [linetext, linenumber],[linetext, linenumber],[...]],[path,...]
				for (let file of composedKey) {
					outputInfo.composedKeyOutput += `${file[0]}\n`;
					for (let line of file) {
						if (Array.isArray(line)) {
							outputInfo.composedKeyOutput += `  -line ${line[1]} : ${line[0]}\n`;
							outputInfo.composedKeyNumber += 1;
						}
					}
					outputInfo.composedKeyOutput += "\n";
				}

				let outputFilePath: string = "";
				const rootPath: string | undefined = getRootPath();
				if (outputFolder && rootPath) {
					outputFilePath = path.join(
						outputFolder,
						`utd-output-${projectName}.txt`
					);
				} else if (rootPath) {
					outputFilePath = path.join(rootPath, `utd-output-${projectName}.txt`);
				}

				// Write the output information to the output file
				fs.writeFileSync(outputFilePath, getOutputFile(outputInfo));
				showInfoFileCreated(outputFilePath);

				// Open the output file in the editor
				vscode.commands.executeCommand("utd.openFile", outputFilePath);
			}
			vscode.commands.executeCommand("utd.refreshEntry");
		}
	);

	// Add the command to the context's subscriptions
	context.subscriptions.push(
		refreshEntry,
		createConfigFile,
		openFile,
		createExcludeFile,
		analyze,
		openHighlightedPath
	);
}

export function deactivate() {}

module.exports = {
	activate,
};
