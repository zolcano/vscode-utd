import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import {
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
} from "./extension-static";

import { researchDir, htmlResearch, tsResearch, findJsonKeys } from "./analyze";
import { UtdTreeProjectDataProvider } from "./project-tree-views";
import { UtdTreeSettingsDataProvider } from "./settings-tree-views";
import { json } from "stream/consumers";

function activate(context: vscode.ExtensionContext) {
	vscode.commands.executeCommand("utd.refreshEntry");

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
		} else {
			showErrorNoOpenProject();
		}
	});

	let createConfigFile = vscode.commands.registerCommand(
		"utd.createConfigFile",
		async () => {
			const ROOT_PATH: string | undefined = getRootPath();
			if (ROOT_PATH) {
				const CONFIG_PATH: string = getConfigFilePath(ROOT_PATH);
				if (!fs.existsSync(CONFIG_PATH)) {
					await fs.promises.writeFile(CONFIG_PATH, getConfigFileExample());
					vscode.commands.executeCommand("utd.refreshEntry");
					vscode.commands.executeCommand("utd.showConfigFile");
					showInfoFileCreated(CONFIG_PATH);
				} else {
					showErrorFileExist();
				}
			} else {
				showErrorNoOpenProject();
			}
		}
	);

	let createExcludeFile = vscode.commands.registerCommand(
		"utd.createExcludeFile",
		async () => {
			const ROOT_PATH: string | undefined = getRootPath();
			if (ROOT_PATH) {
				const EXCLUDE_PATH: string = getExcludeFilePath(ROOT_PATH);
				if (!fs.existsSync(EXCLUDE_PATH)) {
					await fs.promises.writeFile(EXCLUDE_PATH, getExcludeFileExample());
					vscode.commands.executeCommand("utd.refreshEntry");
					vscode.commands.executeCommand("utd.showExcludeFile");
					showInfoFileCreated(EXCLUDE_PATH);
				} else {
					showErrorFileExist();
				}
			} else {
				showErrorNoOpenProject();
			}
		}
	);

	let showConfigFile = vscode.commands.registerCommand(
		"utd.showConfigFile",
		() => {
			const ROOT_PATH: string | undefined = getRootPath();
			if (ROOT_PATH) {
				const CONFIG_PATH: string = getConfigFilePath(ROOT_PATH);
				if (fs.existsSync(CONFIG_PATH)) {
					vscode.workspace.openTextDocument(CONFIG_PATH).then((document) => {
						vscode.window.showTextDocument(document);
					});
				} else {
					showErrorFileNotExist(CONFIG_PATH);
				}
			} else {
				showErrorNoOpenProject();
			}
		}
	);

	let showExcludeFile = vscode.commands.registerCommand(
		"utd.showExcludeFile",
		() => {
			const ROOT_PATH: string | undefined = getRootPath();
			if (ROOT_PATH) {
				const EXCLUDE_PATH: string = getExcludeFilePath(ROOT_PATH);
				if (fs.existsSync(EXCLUDE_PATH)) {
					vscode.workspace.openTextDocument(EXCLUDE_PATH).then((document) => {
						vscode.window.showTextDocument(document);
					});
				} else {
					showErrorFileNotExist(EXCLUDE_PATH);
				}
			} else {
				showErrorNoOpenProject();
			}
		}
	);

	let analyze = vscode.commands.registerCommand(
		"utd.analyze",
		async function (
			PROJECT_PATH: string,
			JSON_PATH: string,
			outputFolder: string,
			projectName: string,
			excludeFilePath: string
		) {
			const ROOT_PATH = getRootPath();

			if (ROOT_PATH) {
				if (fs.existsSync(JSON_PATH)) {
					showInfoAnalyzeStarted(projectName);
					let outputChannel = vscode.window.createOutputChannel("utd");
					outputChannel.show(true);

					let tsFilesList: string[] = [];
					let htmlFilesList: string[] = [];
					let jsonKeysList: [string, number][] = [];
					let excludedKeys: string[] = [];
					if (!outputFolder) {
						outputFolder = ROOT_PATH;
					}

					(async () => {
						await Promise.all([
							researchDir(PROJECT_PATH, tsFilesList, htmlFilesList),
							findJsonKeys(JSON_PATH, jsonKeysList),
						]);

						if (excludeFilePath) {
							fs.readFile(excludeFilePath, "utf-8", (err, data) => {
								if (err) {
								}
								excludedKeys = data.split("\n");
								for (let excludedKey of excludedKeys) {
									for (let i = 0; i < jsonKeysList.length; i++) {
										if (jsonKeysList[i][0] === excludedKey) {
											jsonKeysList.splice(i, 1);
											i--;
										}
									}
								}
							});
						}

						let outputFile = path.join(
							outputFolder,
							`udt-output-${projectName}.txt`
						);

						await htmlResearch(htmlFilesList, jsonKeysList, outputChannel);
						await tsResearch(tsFilesList, jsonKeysList, outputChannel);

						let counter: number = 0;
						for (let jsonKey of jsonKeysList) {
							if (jsonKey[1] === 0) {
								counter += 1;
							}
						}

						fs.writeFile(
							outputFile,
							`***** INFO *****\n\nProject : ${projectName}\nUnused Json key : ${counter} of ${jsonKeysList.length}\nIgnored keys : ${excludedKeys.length}\nHTML files analyzed : ${htmlFilesList.length}\nTypeScript files analyzed : ${tsFilesList.length}\n\n***** EXCLUDED KEYS *****\n\n`,
							(err) => {}
						);

						for (let excludedKey of excludedKeys) {
							fs.appendFile(outputFile, `${excludedKey}\n`, (err) => {});
						}
						fs.appendFile(
							outputFile,
							"\n\n***** UNUSED KEYS *****\n\n",
							(err) => {}
						);

						for (let jsonKey of jsonKeysList) {
							if (jsonKey[1] === 0) {
								fs.appendFile(outputFile, `${jsonKey[0]}\n`, (err) => {});
							}
						}

						vscode.window.showInformationMessage(
							`Output file created and written to: ${outputFile}`
						);
						vscode.workspace.openTextDocument(outputFile).then((document) => {
							vscode.window.showTextDocument(document);
						});
					})();
				} else {
					showErrorFileNotExist(JSON_PATH);
				}
			} else {
				showErrorNoOpenProject();
			}
		}
	);

	context.subscriptions.push(
		refreshEntry,
		createConfigFile,
		showConfigFile,
		showExcludeFile,
		createExcludeFile,
		analyze
	);
}

export function deactivate() {}

module.exports = {
	activate,
};
