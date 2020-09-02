#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config();

import prompts from "prompts";
import { Snipe } from "snipe-it.js";

const snipe = new Snipe(process.env.SNIPE_URL, process.env.SNIPE_TOKEN);

async function asyncFunction() {
	// fetch assets
	const assets = await snipe.hardware.get({ limit: 10000 });
	// fetch status labels
	const locations = await snipe.locations.get({ limit: 1000 });
	// define arrays
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
				console.log(`locationID: ${locationID}, assetID: ${value.AssetID}`);
				if (locationID === "none") await snipe.hardware.checkin(value.AssetID, note).then((result) => console.log(result));
				await snipe.hardware.checkin(value.AssetID, note, locationID).then((result) => console.log(result));
			}
		});
	}
}

asyncFunction();
