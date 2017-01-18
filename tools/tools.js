/*jshint esversion: 6 */
const pogobuf = require('pogobuf');

module.exports = {
		
		
		
		nickname: function (method, user, pass, fave, display, reset_commas, scheme) {
			
			var output = null; 
			
			var reset = null;
			
			const { PTCLogin, GoogleLogin, Client, Utils: { splitInventory, getIVsFromPokemon } } = require('pogobuf');
			
			const POKEMON = require('./pokemon.json');
			
			const { PROVIDER, PG_USER, PG_PASS } = process.env;
			
			
			function pad2 (num) {
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
				return "failed, incomplete login info";
			}
			
			
			
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
					
					
					
					for (var ii = 0; ii < POKEDETAILS.length; ii++) {
						
						
						//add pokemon's name to inventory
						if (pokebox[i].pokemon_id == POKEDETAILS[ii].id) {
							pokebox[i].name = POKEDETAILS[ii].name;
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
				
				var i = 0;
				
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
								
								nick = pad2(pokemon.individual_percentage) + ' ' + pokemon.name.substring(0,8);
							} else if (scheme === 'raw') {
								
								nick = pad2(pokemon.individual_total) + ':' + pad2(pokemon.individual_stamina) + '.' + pad2(pokemon.individual_attack) + '.' + pad2(pokemon.individual_defense);
							}
							
							
							//rename Pokemon that haven't already been nicknamed
							if (pokemon.nickname !== nick) {
								//i++;
								//output[i] = 'Renaming a '+ pokemon.name +' with CP of '+ pokemon.cp +' to '+ nick;
								//console.log(output);
								
								
								//MAYBE ADD THIS AFTER THE MAPPING OF THE ARRAY IS COMPLETED
								//console.log('Found a '+ pokemon.name +' with CP of '+ pokemon.cp +'.  Renamed to: '+ nick);
								//client.nicknamePokemon(pokemon.id, nick);
							}
							
						}
						i++;
						
						//TO DO: 
						//CREATE ARRAY LIKE ORIGINAL CODE DID
						//THE PART WHERE IT HAD EVERYTHING BEING CREATED INTO A SPECIFIC ARRAY, INSTEAD OF USING THE
						//ORIGINAL SHIT
						
						
						output[i] = pokemon;
					}
				});
				
				
				console.log(output);
				
				console.log('Done!');
				
				
				return client.batchCall();
				
			}).catch(console.error);
			
			
			
//			//format html for output
//			var output2 = "<tr>\n";
//			output.forEach(function() {
//			output2 = output2 + "<td>"+ output +"</td>\n";
//			});
//			output2 = output2 +"</tr>\n";
			
			
			
			console.log(output);
			console.log("Output finished displaying, now returning");
			return "do you see what I see?";
		}
};
