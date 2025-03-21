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

import { researchDir, htmlResearch, tsResearch, findJsonKeys } from "./analyze";
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
				vscode.commands.executeCommand("utd.showConfigFile");
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
				vscode.commands.executeCommand("utd.showExcludeFile");
			} else {
				showErrorNoOpenProject();
			}
		}
	);

	/**
	 * Register the command "utd.showConfigFile" to show the configuration file
	 * and assign the function to it.
	 *
	 * The function use the VsCode API to open the config file in the editor.
	 */
	let showConfigFile = vscode.commands.registerCommand(
		"utd.showConfigFile",
		() => {
			if (getRootPath()) {
				const configFilePath: string | undefined = getConfigFilePath();
				if (configFilePath && fs.existsSync(configFilePath)) {
					vscode.workspace.openTextDocument(configFilePath).then((document) => {
						vscode.window.showTextDocument(document);
					});
				} else {
					showErrorFileNotExist("utd.config.json");
				}
			} else {
				showErrorNoOpenProject();
			}
		}
	);

	/**
	 * Register the command "utd.showExcludeFile" to show the configuration file
	 * and assign the function to it.
	 *
	 * The function use the VsCode API to open the exclude file in the editor.
	 */

	let showExcludeFile = vscode.commands.registerCommand(
		"utd.showExcludeFile",
		() => {
			if (getRootPath()) {
				const excludeFilePath: string | undefined = getExcludeFilePath();
				if (excludeFilePath && fs.existsSync(excludeFilePath)) {
					vscode.workspace
						.openTextDocument(excludeFilePath)
						.then((document) => {
							vscode.window.showTextDocument(document);
						});
				} else {
					showErrorFileNotExist("utd.exclude.txt");
				}
			} else {
				showErrorNoOpenProject();
			}
		}
	);

	/**
	 Register the command "utd.showOutputFile" to show the output file selected
	 * and assign the function to it.
	 *
	 * The function use the VsCode API to open the exclude file in the editor.
	 */
	let showOutputFile = vscode.commands.registerCommand(
		"utd.showOutputFile",
		(filePath: string) => {
			if (getRootPath()) {
				if (filePath && fs.existsSync(filePath)) {
					vscode.workspace.openTextDocument(filePath).then((document) => {
						vscode.window.showTextDocument(document);
					});
				} else {
					showErrorFileNotExist(filePath);
				}
			} else {
				showErrorNoOpenProject();
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
			projectPath: string,
			jsonPath: string,
			excludeFilePath: string | undefined,
			outputFolder: string | undefined
		) {
			if (!fs.existsSync(jsonPath)) {
				showErrorFileNotExist(jsonPath);
			} else {
				showInfoAnalyzeStarted(projectName);
				const outputChannel = vscode.window.createOutputChannel("utd");
				outputChannel.show(true);

				const tsFilesList: string[] = [];
				const htmlFilesList: string[] = [];
				const jsonKeysList: [string, number][] = [];
				let excludedKeyList: string[] = [];

				await Promise.all([
					researchDir(projectPath, tsFilesList, htmlFilesList),
					findJsonKeys(jsonPath, jsonKeysList),
				]);

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

				await htmlResearch(htmlFilesList, jsonKeysList, outputChannel);
				await tsResearch(tsFilesList, jsonKeysList, outputChannel);

				// Initialize output information object
				let outputInfo: OutputInfo = {
					projectName: projectName,
					jsonKeysListLength: jsonKeysList.length,
					excludedKeyListLength: excludedKeyList.length,
					htmlFilesListLength: htmlFilesList.length,
					tsFilesListLength: tsFilesList.length,
					excludedKeyListOutput: "",
					jsonKeysOutput: "",
					unusedJsonKey: 0,
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
				vscode.workspace.openTextDocument(outputFilePath).then((document) => {
					vscode.window.showTextDocument(document);
				});
			}
			vscode.commands.executeCommand("utd.refreshEntry");
		}
	);

	// Add the command to the context's subscriptions
	context.subscriptions.push(
		refreshEntry,
		createConfigFile,
		showConfigFile,
		showExcludeFile,
		showOutputFile,
		createExcludeFile,
		analyze
	);
}

export function deactivate() {}

module.exports = {
	activate,
};
