
/*
 * GET home page.
 */

exports.pokemon = function(req, res){
  res.render('pokemon', { title: 'Console' });
};