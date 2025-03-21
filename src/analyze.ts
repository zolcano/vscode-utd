import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * Recursively searches through a directory and collects TypeScript (.ts) and HTML (.html) files.
 * @param projectPath - The path of the project directory to search.
 * @param tsFilesList - Array to store paths of TypeScript files found.
 * @param htmlFilesList - Array to store paths of HTML files found.
 */
export async function researchDir(
	projectPath: string,
	tsFilesList: string[],
	htmlFilesList: string[]
) {
	const content = await fs.promises.readdir(projectPath);
	for (const file of content) {
		const contentPath = path.join(projectPath, file);
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

/**
 * Analyzes HTML files to count occurrences of specified JSON keys.
 * @param htmlFilesList - Array of paths to HTML files to be analyzed.
 * @param jsonKeysList - Array of JSON keys to search for, along with their count.
 * @param outputChannel - VS Code output channel to log information.
 */
export async function htmlResearch(
	htmlFilesList: string[],
	jsonKeysList: [string, number][],
	outputChannel: vscode.OutputChannel
) {
	let log = 1;
	for (const htmlFile of htmlFilesList) {
		const htmlFileLine = await fs.promises.readFile(htmlFile, "utf-8");
		for (const jsonKey of jsonKeysList) {
			if (htmlFileLine.includes(jsonKey[0])) {
				jsonKey[1] += 1;
			}
		}
		outputChannel.append(
			`# [INFO] ${log.toString()} HTML file.s analyzed by ${htmlFilesList.length.toString()}\n`
		);
		log += 1;
	}
}

/**
 * Analyzes TypeScript files to count occurrences of specified JSON keys.
 * @param tsFilesList - Array of paths to TypeScript files to be analyzed.
 * @param jsonKeysList - Array of JSON keys to search for, along with their count.
 * @param outputChannel - VS Code output channel to log information.
 */
export async function tsResearch(
	tsFilesList: string[],
	jsonKeysList: [string, number][],
	outputChannel: vscode.OutputChannel
) {
	let log = 1;
	for (const tsFile of tsFilesList) {
		const tsFileLine = await fs.promises.readFile(tsFile, "utf-8");
		for (const jsonKey of jsonKeysList) {
			if (tsFileLine.includes(jsonKey[0])) {
				jsonKey[1] += 1;
			}
		}
		outputChannel.append(
			`# [INFO] ${log.toString()} TS files analyzed by ${tsFilesList.length.toString()}\n`
		);
		log += 1;
	}
}

/**
 * Finds all keys in the JSON file containing the translation keys and initializes their count to zero.
 * @param JSON_PATH - Path to the JSON file.
 * @param jsonKeysList - Array to store JSON keys and their count.
 */
export async function findJsonKeys(
	JSON_PATH: string,
	jsonKeysList: [string, number][]
) {
	const DATA = JSON.parse(await fs.promises.readFile(JSON_PATH, "utf-8"));
	await findJsonKeysRecursive(DATA, "", jsonKeysList);
}

/**
 * Recursively finds all keys in a JSON object and initializes their count to zero.
 * @param DATA - JSON data to search through.
 * @param path - Current path of the key in the JSON structure.
 * @param jsonKeysList - Array to store JSON keys and their count.
 */
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
