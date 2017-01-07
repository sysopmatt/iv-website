/*jshint esversion: 6 */


module.exports = {
		


	nickname: function (method, user, pass, fave, display, reset_commas, scheme) {
		
		//var output;
		//var i = 0;
		
		var reset = null;
		
		const { PTCLogin, GoogleLogin, Client, Utils: { splitInventory, getIVsFromPokemon } } = require('pogobuf');
		
		const MOVES = require('./moves.json');
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
		    //return "failed";
		}
		else {
			
		  const promise = provider.login(user, pass)
		    .then(token => {
		      client.setAuthInfo(method, token);
		
		      return client.init();
		    })
		    
		    .then(() => client.getInventory(0))
		    .then(inventory => {
		      if (!inventory.success) {
		        throw new Error('Inventory could not be retrieved.');
		      }
		      
		      const { pokemon } = splitInventory(inventory);
		      
		      const pokemonDetails = pokemon
		        .filter(poke => poke.pokemon_id)
		        .map(poke => {
		        	
		          const ivs = getIVsFromPokemon(poke);
		          const details = POKEMON[poke.pokemon_id - 1];
		          const move_1 = MOVES[poke.move_1];
		          const move_2 = MOVES[poke.move_2];
		          var ivsTotal;
		          //console.log(details.name);
		          return {
		            number: poke.pokemon_id,
		            name: details ? details.name : 'Unknown - new pokemon',
		            nickname: poke.nickname,
		            cp: poke.cp,
//		            moves: [
//		              { name: move_1.name, dps: move_1.dps },
//		              { name: move_2.name, dps: move_2.dps, charge: move_2.charge }
//		            ],
		            iv: {
		              total: ivsTotal = ivs.stam + ivs.att + ivs.def,
		              percentage: truncateDecimals(((ivs.stam + ivs.att + ivs.def) / 45) * 100,0),
		              stamina: ivs.stam,
		              attack: ivs.att,
		              defense: ivs.def
		            },
		            fave: poke.favorite,
		            uuid: poke.id
		          };
		          
		        });
		
		      return pokemonDetails.sort((a, b) => b.iv.total - a.iv.total);
		    });
		
		  if (display) {
		    promise.then(pokemon => {
		      console.log(JSON.stringify(pokemon, null, 2));
		    });
		  } else {
		    promise.then(pokemon => {
		      client.batchStart();
		      var renamePokemon = true;
		      
		      
		      pokemon.forEach(poke => {
		    	
		    	if(poke.nickname.includes(',')) { renamePokemon = false;}
		    	if(reset_commas === "yes") {renamePokemon = true;}
		    	
		    	if (renamePokemon) {
		    		const pokemonNameTrunc = poke.name.substring(0,8);
			    	var IVnickname = null;
			    	
			    	
			    	if (scheme === 'percentage') {
			    		IVnickname = pad2(poke.iv.percentage) + ' ' + pokemonNameTrunc;
			        } else if (scheme === 'raw') {
			        	IVnickname = pad2(poke.iv.total) + ':' + pad2(poke.iv.stamina) + '.' + pad2(poke.iv.attack) + '.' + pad2(poke.iv.defense);
			        }
			    	
			    	const nickname = reset ? '' : IVnickname;
			
			        if (poke.nickname !== nickname) {
			          client.nicknamePokemon(poke.uuid, nickname);
			          console.log('Found a cp'+poke.cp+' '+poke.name+', named it: '+nickname);
			          //output[i] = 'Found a cp'+poke.cp+' '+poke.name+', named it: '+nickname;
			          //i++;
			        }
			
			        if (!reset && fave !== 0 && poke.iv >= fave && !poke.fave) {
			          client.setFavoritePokemon(poke.uuid, true);
			        }
			        renamePokemon = true;
		    	}
		    	
		      });
		
		      return client.batchCall();
		    })
		    .then(() => {
		      console.log('Nicknames changed successfully!');
		      //try putting output here!!!
		    });
		  }
		
		  promise.catch(console.error);
		  //return output;
		}	
	}
};