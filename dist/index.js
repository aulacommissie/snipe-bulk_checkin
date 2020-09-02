#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prompts_1 = __importDefault(require("prompts"));
const ora_1 = __importDefault(require("ora"));
const spinner = ora_1.default({
    color: "blue",
    spinner: "bouncingBall",
    text: "Loading..."
});
const snipe_it_js_1 = require("snipe-it.js");
const snipe = new snipe_it_js_1.Snipe(process.env.SNIPE_URL, process.env.SNIPE_TOKEN);
async function asyncFunction() {
    spinner.start("Fetching resources from Snipe-IT...");
    const assets = await snipe.hardware.get({ limit: 10000 });
    const locations = await snipe.locations.get({ limit: 1000 });
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
        spinner.stop();
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
                console.log(`locationID: ${locationID}, assetID: ${value.AssetID}`);
                if (locationID === "none") {
                    const res = await snipe.hardware.checkin(value.AssetID, note);
                    console.log(res.messages);
                }
                else {
                    const res = await snipe.hardware.checkin(value.AssetID, note, locationID);
                    console.log(res.messages);
                }
            }
        });
    }
}
asyncFunction();
//# sourceMappingURL=index.js.map