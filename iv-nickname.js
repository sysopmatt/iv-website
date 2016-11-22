/*jshint esversion: 6 */

const { PTCLogin, GoogleLogin, Client, Utils: { splitInventory, getIVsFromPokemon } } = require('pogobuf');
const optimist = require('optimist');

const MOVES = require('./moves.json');
const POKEMON = require('./pokemon.json');

const { PROVIDER, PG_USER, PG_PASS } = process.env;



const argv = optimist
    .usage('Change nicknames of all your Pokemon to their respective IVs.\nFormat: (total:stamina.attack.defense)')
    .demand('m', 'u', 'p', 'f')
    .alias('m', 'method')
    .alias('u', 'user')
    .alias('p', 'pass')
    .alias('f', 'fave')
    .alias('d', 'display')
    .alias('r', 'reset')
    .alias('s', 'scheme')
    .describe('m', 'Can be `google` or `ptc`')
    .describe('u', 'Username (command line argument or PG_USER)')
    .describe('p', 'Password (command line argument or PG_PASS)')
    .describe('f', 'Pokemon with total IV over this number will be favorited. 0 to disable.')
    .describe('d', 'Don\'t change anything, only display Pokemon info.')
    .describe('s', 'Can be `percentage` or `raw`')
    .describe('r', 'Reset all nicknames.')
    .default('m', 'google')
    .default('u', PG_USER)
    .default('p', PG_PASS)
    .default('f', 0)
    .default('s', 'percentage')
    .argv;

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
const provider = argv.method === 'google' ? new GoogleLogin() : new PTCLogin();

if (!argv.user || !argv.pass) {
  optimist.showHelp();
}
else {
  const promise = provider.login(argv.user, argv.pass)
    .then(token => {
      client.setAuthInfo(argv.method, token);

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
          
          
          return {
            number: poke.pokemon_id,
            name: details.name,
            nickname: poke.nickname,
            cp: poke.cp,
            moves: [
              { name: move_1.name, dps: move_1.dps },
              { name: move_2.name, dps: move_2.dps, charge: move_2.charge }
            ],
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

  if (argv.display) {
    promise.then(pokemon => {
      console.log(JSON.stringify(pokemon, null, 2));
    });
  } else {
    promise.then(pokemon => {
      client.batchStart();
      
      pokemon.forEach(poke => {
    	
    	if (!poke.nickname.includes(',')) {
    		const pokemonNameTrunc = poke.name.substring(0,8);
	    	var IVnickname = null;
	    	
	    	
	    	if (argv.scheme === 'percentage') {
	    		IVnickname = pad2(poke.iv.percentage) + ' ' + pokemonNameTrunc;
	        } else if (argv.scheme === 'raw') {
	        	IVnickname = pad2(poke.iv.total) + ':' + pad2(poke.iv.stamina) + '.' + pad2(poke.iv.attack) + '.' + pad2(poke.iv.defense);
	        }
	    	
	    	const nickname = argv.reset ? '' : IVnickname;
	
	        if (poke.nickname !== nickname) {
	          client.nicknamePokemon(poke.uuid, nickname);
	          console.log('Found a cp'+poke.cp+' '+poke.name+', named it: '+nickname);
	        }
	
	        if (!argv.reset && argv.fave !== 0 && poke.iv >= argv.fave && !poke.fave) {
	          client.setFavoritePokemon(poke.uuid, true);
	        }
    	}
      });

      return client.batchCall();
    })
    .then(() => {
      console.log('Nicknames changed successfully!');
    });
  }

  promise.catch(console.error);
}
