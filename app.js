import "dotenv/config";

import { JSONFilePreset } from "lowdb/node";
import axios from "axios";
import { createWriteStream } from "fs";
import path from "path";

const PUZZLE_URL = "https://www.thetimes.com/puzzles/printable";
const DOWNLOAD_PATH = process.env.PUZZLE_DIR;
const dbPath = new URL("puzzleScraperDatabase.json", import.meta.url).pathname;

const defaultData = { puzzles: [] };
const db = await JSONFilePreset(dbPath, defaultData);

/**
 * Fetch a URL with optional response type.
 * @param {string} url
 * @param {string} resType
 * @returns {{data:string}}
 */
async function fetchPuzzles(url, resType = "text") {
	try {
		return await axios.get(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (X11; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0",
			},
			responseType: resType,
		});
	} catch (error) {
		console.error(`Error fetching ${url}:`, error);
		throw new Error(`Failed to fetch ${url}`);
	}
}

/**
 * Create file-safe date string.
 */
function getFileSafeDate(date) {
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = String(date.getFullYear()).slice(-2);
	return `${day}${month}${year}`;
}

/**
 * Download puzzle from URL and save as PDF.
 */
async function downloadPuzzle(url, name) {
	const response = await fetchPuzzles(url, "stream");

	if (response.status !== 200) {
		throw new Error(`Failed to download puzzle: Got status ${response.status}`);
	}

	const filePath = path.join(DOWNLOAD_PATH, `${name}.pdf`);
	return new Promise((resolve, reject) => {
		const stream = response.data.pipe(createWriteStream(filePath));
		stream.on("finish", resolve);
		stream.on("error", reject);
	});
}

// Main logic
const html = (await fetchPuzzles(PUZZLE_URL)).data;

let match = [
	...html.matchAll(
		new RegExp(
			/"headline":"(.+?)".+?(https:\/\/extras\.thetimes\.com\/web\/public\/pdfs\/[a-z0-9]+?\.pdf)/,
			"gs",
		),
	),
];

if (match.length == 0)
	match = [
		...html.matchAll(
			new RegExp(
				/"headline":"(.+?)".+?(https:\/\/extras\.thetimes\.co\.uk\/web\/public\/pdfs\/[a-z0-9]+?\.pdf)/,
				"gs",
			),
		),
	];

if (match.length > 0) {
	try {
		for (const element of match) {
			const link = element[2];
			let htmlDate = element[1];
			const currentYear = new Date(Date.now()).getFullYear().toString();
			if (!htmlDate.endsWith(currentYear)) htmlDate += ` ${currentYear}`;
			const date = new Date(htmlDate);
			const formattedDate = date.toLocaleDateString();
			const fileSafeDate = getFileSafeDate(date);

			if (db.data.puzzles.includes(fileSafeDate)) continue;

			try {
				await downloadPuzzle(link, fileSafeDate);
				await db.update(({ puzzles }) => puzzles.push(fileSafeDate));
				console.log(`Downloaded puzzle for ${formattedDate}`);
			} catch (e) {
				console.error(`Failed to download puzzle for ${formattedDate}:`, e);
			}
		}
	} catch (error) {
		console.error("Error parsing JSON data:", error);
	}
} else {
	console.error("No regex match!");
}
