"use strict";

var base = require("xbase");
var fs = require("fs");
var runUtil = require("xutil").run;
var shared = require("shared");
var path = require("path");
var tiptoe = require("tiptoe");

var cardsByName = {};

tiptoe(
	function getJSON()
	{
		base.info("Loading promo sets...");

		shared.getMCISetCodes().serialForEach(function(setCode, subcb)
		{
			fs.readFile(path.join(__dirname, "..", "json", setCode + ".json"), {encoding : "utf8"}, subcb);
		}, this);
	},
	function processSets(setsRaw)
	{
		base.info("Parsing promo sets...");

		var sets = setsRaw.map(function(setRaw) { return JSON.parse(setRaw); });

		base.info("Iterating over promo set cards...");
		sets.forEach(function(set)
		{
			set.cards.forEach(function(card)
			{
				if(!cardsByName.hasOwnProperty(card.name))
					cardsByName[card.name] = [];

				cardsByName[card.name].push(set);
			});
		});

		sets.forEach(function(set)
		{
			set.cards.forEach(function(card)
			{
				card.printings.push(set.name);
				card.printings = card.printings.concat(cardsByName[card.name].map(function(set) { return set.name; }));
				shared.finalizePrintings(card);
			});
		});

		base.info("Saving promo sets...");
		sets.serialForEach(function(set, subcb)
		{
			shared.saveSet(set, subcb);
		}, this);
	},
	function updateOtherSets()
	{
		runUtil.run("node", [path.join(__dirname, "updatePrintingsFromSet.js"), "mcisets"], {"redirect-stderr" : false}, this);
	},
	function finish(err)
	{
		if(err)
		{
			base.error(err);
			process.exit(1);
		}

		process.exit(0);
	}
);


