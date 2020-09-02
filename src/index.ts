#!/usr/bin/env node
import configstore from "configstore"; const conf = new configstore("ginit"); // config
import { Snipe } from "snipe-it.js";
import prompts from "prompts";
import chalk from "chalk";
import figlet from "figlet";
import ora from "ora";
const spinner = ora({
	color: "blue",
	spinner: "bouncingBall",
	text: "Loading..."
});

async function asyncFunction() {
	console.clear();
	console.log(
		chalk.magenta(
			figlet.textSync("Snipe-IT\nBulk Checkin", { horizontalLayout: "default" })
		)
	);

	if (!conf.get("snipeURL")) {
		await prompts([
			{
				type: "text",
				name: "snipeURL",
				message: "What's the URL of your Snipe-IT instance?"
			},
			{
				type: "password",
				name: "snipeToken",
				message: "What's your API token?"
			}
		]).then(async (res) => {
			try {
				conf.set("snipeURL", res.snipeURL);
				conf.set("snipeToken", res.snipeToken);
			} catch (err) {
				console.log(`${chalk.red.italic.bold("Error")} - Can't save the credentials\nError: ${err}`);
			}
		});
	}
	const snipe = new Snipe(conf.get("snipeURL"), conf.get("snipeToken"));

	spinner.start("Fetching resources from Snipe-IT...");

	let assets;
	let locations;
	try {
		assets = await snipe.hardware.get({ limit: 10000 });
		locations = await snipe.locations.get({ limit: 1000 });
	} catch (err) {
		spinner.stop();
		console.log(`${chalk.red.italic.bold("Error")} - Can't fetch assets and/or locations.\n${chalk.bold.red("Make sure that you have the correct permissions, URL and API token!")}\nError: ${err}`);
		conf.clear();
		process.exit();
	}
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
