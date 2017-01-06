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

function pad2 (num) {
	  return (num < 10 ? '0' : '') + num;
}


login.login('mattpadams@gmail.com', 'fireplace111')
.then(token => {
    client.setAuthInfo('google', token);
    //client.setPosition(lat, lng);
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

    const pokebox = inv.pokemon;

    for(var i = 0; i < pokebox.length; i++) {
    	


    	for (var ii = 0; ii < POKEDETAILS.length; ii++) {
    		
    		
    		//add pokemon's name to inventory
    		if (pokebox[i].pokemon_id == POKEDETAILS[ii].id) {
    			pokebox[i].name = POKEDETAILS[ii].name;
    		}
    		
    		//calculate IV percentage
    		
    		pokebox[i].individual_percentage = truncateDecimals(((pokebox[i].individual_stamina + pokebox[i].individual_attack + pokebox[i].individual_defense) / 45) * 100,0);
    		
    		
    	}
    	
    }
	console.log('Array created!');
	
	//pogobuf.client.batchStart();
	
	pokebox.forEach(function(pokemon) {
		
		//exclude eggs
		if (!pokemon.is_egg) {
			
			
			var pokemonNameTrunc = pokemon.name.substring(0,8);
	    	var nick = pad2(pokemon.individual_percentage) + ' ' + pokemonNameTrunc;
			pogobuf.client.nicknamePokemon(pokemon.id, nick);
	    	console.log(pokemon.id, nick);

		}
	});
	
	console.log('Done!');
	
    return true; //pogobuf.client.batchCall();
})
.catch(console.error);
