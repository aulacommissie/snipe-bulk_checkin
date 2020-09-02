#!/usr/bin/env node
import dotenv from "dotenv"; dotenv.config(); // load creds from .env
import { Snipe } from "snipe-it.js";
import prompts from "prompts";
import chalk from "chalk";
import ora from "ora";
const spinner = ora({
	color: "blue",
	spinner: "bouncingBall",
	text: "Loading..."
});

const snipe = new Snipe(process.env.SNIPE_URL, process.env.SNIPE_TOKEN);

async function asyncFunction() {
	spinner.start("Fetching resources from Snipe-IT...");

	const assets = await snipe.hardware.get({ limit: 10000 });
	const locations = await snipe.locations.get({ limit: 1000 });
	const assetArray: { title: string, value: any }[] = [];
	const locationsArray: { title: string, value: any }[] = [];

	assets.forEach((hardware) => {
		assetArray.push({
			title: `${hardware.asset_tag} | ${hardware.name}`,
			value: hardware.id
		});
	});
	locations.forEach((location) => {
		locationsArray.push({
			title: location.name,
			value: location.id
		});
	});
	assetArray.push({
		title: "Stop",
		value: "stop"
	});
	locationsArray.push({
		title: "None",
		value: "none"
	});

	let locationID: any;
	let note: string;

	spinner.stop();

	await prompts([
		{
			type: "autocomplete",
			name: "location",
			message: "Location (None if no location!)",
			choices: locationsArray,
			limit: 5
		},
		{
			type: "text",
			name: "note",
			message: "Note"
		}]).then(async (value) => {
		locationID = value.location;
		note = value.note;
	});
	let x: boolean;
	x = true;
	while (x) {
		await prompts([
			{
				type: "autocomplete",
				name: "AssetID",
				message: "Asset Tag (Stop to quit!)",
				choices: assetArray,
				limit: 5
			}]).then(async (value) => {
			if (value.AssetID === "stop") {
				console.log("ok bye bye");
				x = false;
			} else {
				spinner.start("Sending request to Snipe-IT");
				if (locationID === "none") locationID = null;
				await snipe.hardware.checkin(value.AssetID, note, locationID).then((res) => {
					spinner.stop();
					if (res.status === "error") {
						console.log(`${chalk.red.italic.bold("Error")} - ${res.messages}`);
					} else {
						console.log(`${chalk.green.italic("Success")} - ${res.messages}`);
					}
				});
			}
		});
	}
}

asyncFunction();
