/*jshint esversion: 6 */
const pogobuf = require('pogobuf');

module.exports = {
		
		
		
		nickname: function (method, user, pass, reset_commas, scheme) {
			
			
			var reset = null;
			
			const { PTCLogin, GoogleLogin, Client, Utils: { splitInventory, getIVsFromPokemon } } = require('pogobuf');
			
			const POKEMON = require('./pokemon.json');
			
			const { PROVIDER, PG_USER, PG_PASS } = process.env;
			
			
			function pad (num) {
				//adds leading zero to single digits for sorting purposes
				return (num < 10 ? '0' : '') + num;
			}
			
			function truncateDecimals (number, digits) {
				var multiplier = Math.pow(10, digits),
				adjustedNum = number * multiplier,
				truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);
				
				return truncatedNum / multiplier;
			}
			
			const client = new Client();
			
			const provider = (method === 'google') ? new GoogleLogin() : new PTCLogin();
			
			if (!user || !pass) {
				return "Login failed - incomplete login information.";
			} else {
				var promise = provider.login(user, pass).then(function (token) {
					client.setAuthInfo(method, token);
					
					return client.init();
				}).then(function () {
					return client.getInventory(0);
				}).then(function (inventory) {
					
					
					// Use the returned data
					if (!inventory.success) throw Error('success=false in inventory response');
					
					// Split inventory into individual arrays and log them on the console
					const inv = pogobuf.Utils.splitInventory(inventory);
					
					const POKEDETAILS = require('./pokemon.json');
					
					const pokebox = inv.pokemon;
					
					for(var i = 0; i < pokebox.length; i++) {
						
						
						
						for (var j = 0; j < POKEDETAILS.length; j++) {
							
							
							//add pokemon's name to inventory
							if (pokebox[i].pokemon_id == POKEDETAILS[j].id) {
								pokebox[i].name = POKEDETAILS[j].name;
							}
							
							//calculate IV percentage
							
							pokebox[i].individual_percentage = truncateDecimals(((pokebox[i].individual_stamina + pokebox[i].individual_attack + pokebox[i].individual_defense) / 45) * 100,0);
							pokebox[i].individual_total = pokebox[i].individual_attack + pokebox[i].individual_defense + pokebox[i].individual_stamina;
							
						}
						
						
					}
					console.log('Array created!');
					
					return pokebox.sort(function (a, b) {
						return a.number - b.number;	
						
					});
				}).then(function (pokebox) {
					
					//start batch statement
					client.batchStart();
					
					
					
					//run through each pokemon in the pokebox
					pokebox.forEach(function(pokemon) {
						
						//exclude eggs
						if (!pokemon.is_egg) {
							
							
							
							//determine if this iteration should be renamed
							var renamePokemon = true;
							if(pokemon.nickname.includes(',')) { renamePokemon = false;}
							if(reset_commas === "yes") {renamePokemon = true;}
							
							if (renamePokemon) {
								
								//determine naming scheme
								var nick = null;
								
								if (scheme === 'percentage') {
									
									nick = pad(pokemon.individual_percentage) + ' ' + pokemon.name.substring(0,8);
								} else if (scheme === 'raw') {
									
									nick = pad(pokemon.individual_total) + ':' + pad(pokemon.individual_stamina) + '.' + pad(pokemon.individual_attack) + '.' + pad(pokemon.individual_defense);
								}
								
								
								//rename Pokemon that haven't already been nicknamed
								if (pokemon.nickname !== nick) {
									console.log('Found a '+ pokemon.name +' with CP of '+ pokemon.cp +'.  Renamed to: '+ nick);
									//client.nicknamePokemon(pokemon.id, nick);
								}
								
							}
							
						}
					});
					
					console.log('Done!');
					
					return client.batchCall();
					
				}).catch(console.error);
				
			}
			return "this is what's returned";
		}
};