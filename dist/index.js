#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const configstore_1 = __importDefault(require("configstore"));
const conf = new configstore_1.default("ginit");
const snipe_it_js_1 = require("snipe-it.js");
const prompts_1 = __importDefault(require("prompts"));
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
const ora_1 = __importDefault(require("ora"));
const spinner = ora_1.default({
    color: "blue",
    spinner: "bouncingBall",
    text: "Loading..."
});
async function asyncFunction() {
    console.clear();
    console.log(chalk_1.default.magenta(figlet_1.default.textSync("Snipe\nBulk Checkin", { horizontalLayout: "default" })));
    if (!conf.get("snipeURL")) {
        await prompts_1.default([
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
            }
            catch (err) {
                console.log(`${chalk_1.default.red.italic.bold("Error")} - Can't save the credentials\nError: ${err}`);
            }
        });
    }
    const snipe = new snipe_it_js_1.Snipe(conf.get("snipeURL"), conf.get("snipeToken"));
    spinner.start("Fetching resources from Snipe-IT...");
    let assets;
    let locations;
    try {
        assets = await snipe.hardware.get({ limit: 10000 });
        locations = await snipe.locations.get({ limit: 1000 });
    }
    catch (err) {
        spinner.stop();
        console.log(`${chalk_1.default.red.italic.bold("Error")} - Can't fetch assets and/or locations.\n${chalk_1.default.bold.red("Make sure that you have the correct permissions, URL and API token!")}\nError: ${err}`);
        conf.clear();
        process.exit();
    }
    const assetArray = [];
    const locationsArray = [];
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
    let locationID;
    let note;
    spinner.stop();
    await prompts_1.default([
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
        }
    ]).then(async (value) => {
        locationID = value.location;
        note = value.note;
    });
    let x;
    x = true;
    while (x) {
        await prompts_1.default([
            {
                type: "autocomplete",
                name: "AssetID",
                message: "Asset Tag (Stop to quit!)",
                choices: assetArray,
                limit: 5
            }
        ]).then(async (value) => {
            if (value.AssetID === "stop") {
                console.log("ok bye bye");
                x = false;
            }
            else {
                spinner.start("Sending request to Snipe-IT");
                if (locationID === "none")
                    locationID = null;
                await snipe.hardware.checkin(value.AssetID, note, locationID).then((res) => {
                    spinner.stop();
                    if (res.status === "error") {
                        console.log(`${chalk_1.default.red.italic.bold("Error")} - ${res.messages}`);
                    }
                    else {
                        console.log(`${chalk_1.default.green.italic("Success")} - ${res.messages}`);
                    }
                });
            }
        });
    }
}
asyncFunction();
//# sourceMappingURL=index.js.map