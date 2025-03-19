import * as vscode from "vscode";
import * as fs from "fs";
import {
	getConfigFilePath,
	getExcludeFilePath,
	getRootPath,
} from "./extension-static";

export class UtdTreeSettingsDataProvider
	implements vscode.TreeDataProvider<SettingItem>
{
	private items: SettingItem[] = [];
	constructor() {
		const ROOT_PATH: string | undefined = getRootPath();
		if (ROOT_PATH) {
			const EXCLUDE_PATH: string = getExcludeFilePath(ROOT_PATH);
			const CONFIG_PATH: string = getConfigFilePath(ROOT_PATH);
			let settingItem: SettingItem;
			if (fs.existsSync(CONFIG_PATH)) {
				settingItem = new SettingItem("show config");
			} else {
				settingItem = new SettingItem("create config");
			}
			this.items.push(settingItem);

			if (fs.existsSync(EXCLUDE_PATH)) {
				settingItem = new SettingItem("show exclude");
			} else {
				settingItem = new SettingItem("create exclude");
			}
			this.items.push(settingItem);
		}
	}

	onDidChangeTreeData?:
		| vscode.Event<void | SettingItem | SettingItem[] | null | undefined>
		| undefined;

	getTreeItem(
		element: SettingItem
	): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	getChildren(
		element?: SettingItem | undefined
	): vscode.ProviderResult<SettingItem[]> {
		return this.items;
	}
}

class SettingItem extends vscode.TreeItem {
	constructor(label: string) {
		super(label);

		if (label === "show config") {
			this.command = {
				command: "utd.showConfigFile",
				title: "show config",
			};
			this.iconPath = new vscode.ThemeIcon(
				"play",
				new vscode.ThemeColor("charts.green")
			);
		} else if (label === "create config") {
			this.command = {
				command: "utd.createConfigFile",
				title: "create config",
			};
			this.iconPath = new vscode.ThemeIcon(
				"play",
				new vscode.ThemeColor("charts.green")
			);
		} else if (label === "create exclude") {
			this.command = {
				command: "utd.createExcludeFile",
				title: "create exclude file",
			};
			this.iconPath = new vscode.ThemeIcon(
				"play",
				new vscode.ThemeColor("charts.green")
			);
		} else if (label === "show exclude") {
			this.command = {
				command: "utd.showExcludeFile",
				title: "show exclude file",
			};
			this.iconPath = new vscode.ThemeIcon(
				"play",
				new vscode.ThemeColor("charts.green")
			);
		}
	}
}
