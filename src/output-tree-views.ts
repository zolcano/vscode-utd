import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getConfigFilePath, getRootPath } from "./extension-static";

// This class implements the TreeDataProvider interface for the ProjectItem type.
// It provides data for the tree view in the VS Code extension.
export class UtdTreeOutputDataProvider
	implements vscode.TreeDataProvider<outputItem>
{
	// Array to hold the project items
	private items: outputItem[] = [];
	constructor() {
		const configFilePath: string | undefined = getConfigFilePath();

		if (configFilePath && fs.existsSync(configFilePath)) {
			//recover the output folder in the configuration file
			const jsonData: any = JSON.parse(
				fs.readFileSync(configFilePath, "utf-8")
			);
			//if no configuration found, the output folder is the root folder of opened in VsCode
			let outputFolder: string = jsonData.utdConfig[0].outputFolder;
			const rootPath: string | undefined = getRootPath();
			if (!outputFolder && rootPath) {
				outputFolder = rootPath;
			}

			//recover all files that start with "utd-output and initialize outputItem object with"
			fs.readdir(outputFolder, (err, files) => {
				files.forEach((file) => {
					if (file.startsWith("utd-output")) {
						this.items.push(new outputItem(file, outputFolder));
					}
				});
			});
		}
	}

	onDidChangeTreeData?:
		| vscode.Event<void | outputItem | outputItem[] | null | undefined>
		| undefined;
	getTreeItem(
		element: outputItem
	): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	getChildren(
		element?: outputItem | undefined
	): vscode.ProviderResult<outputItem[]> {
		return this.items;
	}
}

// Class representing a project item in the tree view.
class outputItem extends vscode.TreeItem {
	constructor(label: string, outputFolder: string) {
		super(label);
		//associate a command to the label in the tree
		this.command = {
			command: "utd.openFile",
			title: "show this file",
			arguments: [path.join(outputFolder, label)],
		};
		this.iconPath = new vscode.ThemeIcon(
			"output",
			new vscode.ThemeColor("charts.blue")
		);
	}
}
