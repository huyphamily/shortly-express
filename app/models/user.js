var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  //on creation, will hash password and input into database
  initialize: function(){
    this.on('creating', this.hashPass);
  },
  checkPass: function(pw, cb){
    bcrypt.compare(pw, this.get('password'), function(err, res) {
      if(err){console.log(err);}
      cb(res);
    });
  },
  hashPass: function(){
    var cipher = Promise.promisify(bcrypt.hash);
       //when we return a promise, bookshelf will hold off till this is fulfilled/unfulfillable.
       return cipher(this.get('password'), null, null)
         .bind(this)
         .then(function(hash) {
           this.set('password', hash);
         });
     }
});

module.exports = User;