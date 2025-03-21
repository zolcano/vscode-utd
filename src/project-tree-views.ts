import * as vscode from "vscode";
import * as fs from "fs";
import { getConfigFilePath, showErrorFileNotExist } from "./extension-static";

// This class implements the TreeDataProvider interface for the ProjectItem type.
// It provides data for the tree view in the VS Code extension.
export class UtdTreeProjectDataProvider
	implements vscode.TreeDataProvider<ProjectItem>
{
	// Array to hold the project items
	private items: ProjectItem[] = [];
	constructor() {
		const configFilePath: string | undefined = getConfigFilePath();
		if (configFilePath && fs.existsSync(configFilePath)) {
			const jsonData: any = JSON.parse(
				fs.readFileSync(configFilePath, "utf-8")
			);
			this.items = jsonData.projectConfig.map((item: any) => {
				// Create the root project item.
				const rootProjectItem: ProjectItem = new ProjectItem(item.labelName);

				// Create a "more info" item with additional subobject
				const moreInfoProjectItem: ProjectItem = new ProjectItem("more info");
				moreInfoProjectItem.children.push(
					new ProjectItem("root path", item.rootPath)
				);
				moreInfoProjectItem.children.push(
					new ProjectItem("json path", item.jsonPath)
				);
				if (item.excludeFilePath) {
					moreInfoProjectItem.children.push(
						new ProjectItem("exclude file", item.excludeFilePath)
					);
				}
				rootProjectItem.children.push(moreInfoProjectItem);

				// Create the execute button item to start analysis of a project.
				rootProjectItem.children.push(
					new ProjectItem(
						"execute",
						item.labelName,
						item.rootPath,
						item.jsonPath,
						item.excludeFilePath === "" ? undefined : item.excludeFilePath,
						jsonData.utdConfig[0].outputFolder === ""
							? undefined
							: jsonData.utdConfig[0].outputFolder
					)
				);
				return rootProjectItem;
			});
		} else {
			showErrorFileNotExist("utd.config.json");
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
		if (label === "execute") {
			this.command = {
				command: "utd.analyze",
				title: "Start analyse of this project",
				arguments: [...args],
			};
			this.iconPath = new vscode.ThemeIcon(
				"play",
				new vscode.ThemeColor("charts.green")
			);
		} else if (label === "root path") {
			this.label = args[0];
		} else if (label === "json path") {
			this.label = args[0];
		} else if (label === "exclude file") {
			this.label = args[0];
		} else {
			//collapsed items that contain children have no specific properties
			this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		}
	}
}
