/*jshint esversion: 6 */


'use strict';

/*
    This example script shows how to work with the getInventory() API call and the
    splitInventory() function.
*/
const pogobuf = require('pogobuf');

const lat = 44.0664517,
	lng = -123.1029851;

var login = new pogobuf.GoogleLogin(),
    client = new pogobuf.Client();


function truncateDecimals (number, digits) {
    var multiplier = Math.pow(10, digits),
        adjustedNum = number * multiplier,
        truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);

    return truncatedNum / multiplier;
}

login.login('mattpadams@gmail.com', 'fireplace111')
.then(token => {
    client.setAuthInfo('google', token);
    client.setPosition(lat, lng);
    return client.init();
}).then(() => {
    // Make some API calls!
    return client.getInventory(0);
}).then(inventory => {
    // Use the returned data
    if (!inventory.success) throw Error('success=false in inventory response');

    // Split inventory into individual arrays and log them on the console
    const inv = pogobuf.Utils.splitInventory(inventory);

    const POKEDETAILS = require('./tools/pokemon.json');
    const POKEMOVES = require('./tools/moves.json');

    //console.log(inv);
    
    //console.log('Starting loop:');
    //console.log(inv.pokemon.length);

    for(var i = 0; i < inv.pokemon.length; i++) {
    	var pokemon = inv.pokemon[i];

    	for (var ii = 0; ii < POKEDETAILS.name; ii++) {
    		if (inv.pokemon[i].pokemon_id == POKEDETAILS.id) {
    			inv.pokemon[i].name = POKEDETAILS.name;
    			console.log(POKEDETAILS.name);
    		}
    	}
    	
    	console.log('Pokemon:', pokemon);
    }
	console.log('Done!');
})
.catch(console.error);
