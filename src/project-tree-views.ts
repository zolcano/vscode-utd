import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getConfigFilePath, showErrorFileNotExist } from "./extension-static";

// Constants for repeated labels
const LABEL_START_ANALYZE = "start analyze";
const LABEL_QUICK_ANALYZE = "quick analyze";
const LABEL_FOLDER = "folder";
const LABEL_PROJECT_DOCUMENTS = "project documents";
const LABEL_EXTENSIONS = "extensions";
const LABEL_MORE_INFO = "more info";
const LABEL_FOLDERS_TO_SCAN = "folders to scan";

// This class implements the TreeDataProvider interface for the ProjectItem type.
// It provides data for the tree view in the VS Code extension.
export class UtdTreeProjectDataProvider
	implements vscode.TreeDataProvider<ProjectItem>
{
	// Array to hold the project items
	private items: ProjectItem[] = [];
	constructor() {
		const configFilePath: string | undefined = getConfigFilePath();
		if (!configFilePath || !fs.existsSync(configFilePath)) {
			showErrorFileNotExist("utd.config.json");
			return;
		}

		const jsonData: any = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
		for (let item of jsonData.utdConfig) {
			const rootProjectItem = new ProjectItem(item.labelName);
			const moreInfoProjectItem: ProjectItem = new ProjectItem(LABEL_MORE_INFO);
			const foldersToScan: ProjectItem = new ProjectItem(LABEL_FOLDERS_TO_SCAN);

			rootProjectItem.children.push(
				new ProjectItem(
					LABEL_START_ANALYZE,
					item.labelName,
					item.rootPaths,
					item.jsonPath,
					item.fileToAnalyze,
					item.excludePath ? item.excludePath : undefined,
					jsonData.globalConfig[0].outputFolder
						? jsonData.globalConfig[0].outputFolder
						: undefined
				)
			);

			rootProjectItem.children.push(
				new ProjectItem(
					LABEL_QUICK_ANALYZE,
					item.labelName,
					item.rootPaths,
					item.jsonPath,
					item.fileToAnalyze,
					item.excludePath ? item.excludePath : undefined,
					jsonData.globalConfig[0].outputFolder
						? jsonData.globalConfig[0].outputFolder
						: undefined
				)
			);

			for (let rootPath of item.rootPaths) {
				foldersToScan.children.push(
					new ProjectItem(LABEL_FOLDER, path.basename(rootPath), rootPath)
				);
			}
			moreInfoProjectItem.children.push(foldersToScan);

			moreInfoProjectItem.children.push(
				new ProjectItem(
					LABEL_PROJECT_DOCUMENTS,
					path.basename(item.jsonPath),
					item.jsonPath
				)
			);

			//optionnal
			if (item.excludePath) {
				moreInfoProjectItem.children.push(
					new ProjectItem(
						LABEL_PROJECT_DOCUMENTS,
						path.basename(item.excludePath),
						item.excludePath
					)
				);
			}

			moreInfoProjectItem.children.push(
				new ProjectItem(LABEL_EXTENSIONS, JSON.stringify(item.fileToAnalyze))
			);

			rootProjectItem.children.push(moreInfoProjectItem);

			this.items.push(rootProjectItem);
		}
	}
	getTreeItem(
		element: ProjectItem
	): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	getChildren(element?: ProjectItem): vscode.ProviderResult<ProjectItem[]> {
		if (element === undefined) {
			return this.items;
		}
		return element.children.length ? element.children : [];
	}
}

// Class representing a project item in the tree view.
class ProjectItem extends vscode.TreeItem {
	// Array to hold the children of the project item.
	public children: ProjectItem[] = [];
	constructor(label: string, ...args: (string | undefined)[]) {
		super(label);

		// Set properties based on the label.
		if (label === LABEL_START_ANALYZE) {
			this.command = {
				command: "utd.analyze",
				title: "Start analyse of this project",
				arguments: [false, ...args],
			};
			this.iconPath = new vscode.ThemeIcon(
				"play",
				new vscode.ThemeColor("charts.green")
			);
		} else if (label === LABEL_QUICK_ANALYZE) {
			this.command = {
				command: "utd.analyze",
				title: "Start analyse of this project",
				arguments: [true, ...args],
			};
			this.iconPath = new vscode.ThemeIcon(
				"play",
				new vscode.ThemeColor("charts.green")
			);
		} else if (label === LABEL_FOLDER) {
			this.label = args[0];
			this.description = args[1];
			this.iconPath = new vscode.ThemeIcon(
				"folder",
				new vscode.ThemeColor("charts.yellow")
			);
		} else if (label === LABEL_PROJECT_DOCUMENTS) {
			this.command = {
				command: "utd.openFile",
				title: "open the file",
				arguments: [args[1]],
			};
			this.label = args[0];
			this.description = args[1];
			this.iconPath = new vscode.ThemeIcon(
				"json",
				new vscode.ThemeColor("charts.blue")
			);
		} else if (label === LABEL_EXTENSIONS) {
			this.description = args[0];
			this.iconPath = new vscode.ThemeIcon(
				"symbol-type-parameter",
				new vscode.ThemeColor("charts.yellow")
			);
		} else {
			//collapsed items that contain children have no specific properties
			this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		}
	}
}
