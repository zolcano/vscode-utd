import * as vscode from "vscode";
import * as fs from "fs";
import { getConfigFilePath, getExcludeFilePath } from "./extension-static";

// Class definition for UtdTreeSettingsDataProvider which implements vscode.TreeDataProvider interface
export class UtdTreeSettingsDataProvider
	implements vscode.TreeDataProvider<SettingItem>
{
	// Array to hold SettingItem objects
	private items: SettingItem[] = [];
	constructor() {
		// Get the file paths for exclude and config files
		const excludeFilePath: string | undefined = getExcludeFilePath();
		const configFilePath: string | undefined = getConfigFilePath();

		let settingItem: SettingItem;
		if (configFilePath && fs.existsSync(configFilePath)) {
			settingItem = new SettingItem("show config");
		} else {
			settingItem = new SettingItem("create config");
		}
		this.items.push(settingItem);

		if (excludeFilePath && fs.existsSync(excludeFilePath)) {
			settingItem = new SettingItem("show exclude");
		} else {
			settingItem = new SettingItem("create exclude");
		}
		this.items.push(settingItem);
	}

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

// Class definition for SettingItem which extends vscode.TreeItem
class SettingItem extends vscode.TreeItem {
	constructor(label: string) {
		super(label);

		// Set the command and icon based on the label
		if (label === "show config") {
			this.command = {
				command: "utd.showConfigFile",
				title: "show config",
			};
			this.iconPath = new vscode.ThemeIcon(
				"output",
				new vscode.ThemeColor("charts.blue")
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
				"output",
				new vscode.ThemeColor("charts.blue")
			);
		}
	}
}
