import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export async function researchDir(
	PROJECT_PATH: string,
	tsFilesList: string[],
	htmlFilesList: string[]
) {
	const content = await fs.promises.readdir(PROJECT_PATH);
	for (const file of content) {
		const contentPath = path.join(PROJECT_PATH, file);
		const stats = await fs.promises.stat(contentPath);
		if (stats.isDirectory()) {
			await researchDir(contentPath, tsFilesList, htmlFilesList);
		} else {
			const extension = path.extname(file);
			if (extension === ".ts") {
				tsFilesList.push(contentPath);
			} else if (extension === ".html") {
				htmlFilesList.push(contentPath);
			}
		}
	}
}

export async function htmlResearch(
	htmlFilesList: string[],
	jsonKeysList: [string, number][],
	OUTPUTCHANNEL: vscode.OutputChannel
) {
	let log = 1;
	for (const htmlFile of htmlFilesList) {
		const htmlFileLine = await fs.promises.readFile(htmlFile, "utf-8");
		for (const jsonKey of jsonKeysList) {
			if (htmlFileLine.includes(jsonKey[0])) {
				jsonKey[1] += 1;
			}
		}
		OUTPUTCHANNEL.append(
			`# [INFO] ${log.toString()} HTML file.s analyzed by ${htmlFilesList.length.toString()}\n`
		);
		log += 1;
	}
}

export async function tsResearch(
	tsFilesList: string[],
	jsonKeysList: [string, number][],
	OUTPUTCHANNEL: vscode.OutputChannel
) {
	let log = 1;
	for (const tsFile of tsFilesList) {
		const tsFileLine = await fs.promises.readFile(tsFile, "utf-8");
		for (const jsonKey of jsonKeysList) {
			if (tsFileLine.includes(jsonKey[0])) {
				jsonKey[1] += 1;
			}
		}
		OUTPUTCHANNEL.append(
			`# [INFO] ${log.toString()} TS files analyzed by ${tsFilesList.length.toString()}\n`
		);
		log += 1;
	}
}

export async function findJsonKeys(
	JSON_PATH: string,
	jsonKeysList: [string, number][]
) {
	const DATA = JSON.parse(await fs.promises.readFile(JSON_PATH, "utf-8"));
	await findJsonKeysRecursive(DATA, "", jsonKeysList);
}

async function findJsonKeysRecursive(
	DATA: any,
	path: string = "",
	jsonKeysList: [string, number][]
) {
	if (typeof DATA === "object" && DATA !== null && !Array.isArray(DATA)) {
		for (const [key, value] of Object.entries(DATA)) {
			let newPath = path ? `${path}.${key}` : key;
			await findJsonKeysRecursive(value, newPath, jsonKeysList);
		}
	} else {
		jsonKeysList.push([path, 0]);
	}
}
