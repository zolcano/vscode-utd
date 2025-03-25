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
	filesList: string[],
	extensions: string[]
) {
	const content = await fs.promises.readdir(projectPath);
	for (const file of content) {
		const contentPath = path.join(projectPath, file);
		const stats = await fs.promises.stat(contentPath);
		if (stats.isDirectory()) {
			await researchDir(contentPath, filesList, extensions);
		} else {
			const extfile = path.extname(file);
			for (let extension of extensions) {
				if (extension === extfile) {
					filesList.push(contentPath);
				}
			}
		}
	}
}

/**
 * Analyzes files to count occurrences of specified JSON keys.
 * @param filesList - Array of paths to files to be analyzed.
 * @param jsonKeysList - Array of JSON keys to search for, along with their count.
 * @param outputChannel - VS Code output channel to log information.
 */
export async function fileResearch(
	filesList: string[],
	jsonKeysList: [string, number][],
	composedKey: [string, [string, number]][],
	outputChannel: vscode.OutputChannel
) {
	let log: number = 1;
	for (let file of filesList) {
		const fileContent = await fs.promises.readFile(file, "utf-8");
		for (const jsonKey of jsonKeysList) {
			if (fileContent.includes(jsonKey[0])) {
				jsonKey[1] += 1;
			}

			const fileLines = fileContent
				.split("\n")
				.map((str) => str.replace(/^[\t\s]+|[\r\n]+/g, ""));
			for (
				let lineNumber: number = 0;
				lineNumber < fileLines.length;
				lineNumber++
			) {
				if (
					((fileLines[lineNumber].includes("+") ||
						fileLines[lineNumber].includes("$")) &&
						fileLines[lineNumber].includes("translate")) ||
					fileLines[lineNumber].includes("jsonLocalizer[")
				) {
					let fileExist: boolean = false;
					for (let i: number = 0; i < composedKey.length; i++) {
						if (composedKey[i][0] === file) {
							fileExist = true;
							let lineExist: boolean = false;
							for (let x = 1; x < composedKey[i].length; x++) {
								if (composedKey[i][x][1] === lineNumber + 1) {
									lineExist = true;
								}
							}
							if (!lineExist) {
								composedKey[i].push([fileLines[lineNumber], lineNumber + 1]);
							}
						}
					}
					if (!fileExist) {
						composedKey.push([file, [fileLines[lineNumber], lineNumber + 1]]);
					}
				}
			}
		}
		outputChannel.append(
			`# [INFO] ${log} file.s analyzed of ${filesList.length.toString()}\n`
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
