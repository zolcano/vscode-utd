import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import {
	getConfigFilePath,
	getRootPath,
	showErrorFileNotExist,
} from "./extension-static";

export class UtdTreeProjectDataProvider
	implements vscode.TreeDataProvider<ProjectItem>
{
	private items: ProjectItem[] = [];

	constructor() {
		const ROOT_PATH: string | undefined = getRootPath();
		let configFile: string = "";
		if (ROOT_PATH) {
			configFile = getConfigFilePath(ROOT_PATH);
		}

		if (fs.existsSync(configFile) && configFile) {
			const JSON_DATA: string = fs.readFileSync(configFile, "utf-8");
			const DATA: any = JSON.parse(JSON_DATA);
			this.items = DATA.projectConfig.map((item: any) => {
				const rootProjectItem = new ProjectItem(
					item.labelName,
					vscode.TreeItemCollapsibleState.Collapsed
				);
				const moreInfoProjectItem = new ProjectItem(
					"more info",
					vscode.TreeItemCollapsibleState.Collapsed
				);
				rootProjectItem.children.push(moreInfoProjectItem);
				rootProjectItem.children.push(
					new ProjectItem(
						"start analysis",
						vscode.TreeItemCollapsibleState.None,
						item.rootPath,
						item.jsonPath,
						DATA.utdConfig[0].outputFolder,
						item.labelName,
						item.excludeFilePath
					)
				);

				moreInfoProjectItem.children.push(
					new ProjectItem(
						"root path",
						vscode.TreeItemCollapsibleState.None,
						item.rootPath
					)
				);

				moreInfoProjectItem.children.push(
					new ProjectItem(
						"json path",
						vscode.TreeItemCollapsibleState.None,
						item.jsonPath
					)
				);

				if (item.excludeFilePath) {
					moreInfoProjectItem.children.push(
						new ProjectItem(
							"exclude file",
							vscode.TreeItemCollapsibleState.None,
							item.excludeFilePath
						)
					);
				}

				return rootProjectItem;
			});
		} else {
			showErrorFileNotExist(configFile);
		}
	}

	onDidChangeTreeData?:
		| vscode.Event<void | ProjectItem | ProjectItem[] | null | undefined>
		| undefined;
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
	getParent?(element: ProjectItem): vscode.ProviderResult<ProjectItem> {
		throw new Error("Method not implemented.");
	}
	resolveTreeItem?(
		item: vscode.TreeItem,
		element: ProjectItem,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.TreeItem> {
		throw new Error("Method not implemented.");
	}
}

class ProjectItem extends vscode.TreeItem {
	public children: ProjectItem[] = [];
	private args: any[] = [];
	constructor(
		label: string,
		collapsed: vscode.TreeItemCollapsibleState,
		...ARGS: string[]
	) {
		super(label, collapsed);
		if (label === "start analysis") {
			this.args = ARGS;
			this.command = {
				command: "utd.analyze",
				title: "start analysis",
				arguments: [
					this.args[0],
					this.args[1],
					this.args[2],
					this.args[3],
					this.args[4],
				],
			};
			this.iconPath = new vscode.ThemeIcon(
				"play",
				new vscode.ThemeColor("charts.green")
			);
		} else if (label === "root path") {
			this.label = ARGS[0];
		} else if (label === "exclude file") {
			this.label = ARGS[0];
		} else if (label === "json path") {
			this.label = ARGS[0];
		}
	}
}
