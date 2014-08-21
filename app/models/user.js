var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  checkPass: function(pw, cb){
    bcrypt.compare(pw, this.get('password'), function(err, res) {
      if(err){console.log(err);}
      console.log(res);
      cb(res);
    });
  },
  hashPass: function(pw){
    var pwHash;

    bcrypt.hash(pw, null, null, function(err, hash){
      if(err) {console.log(err);}
      pwHash = hash;
    });

    this.set('password', pwHash);
  }
});

module.exports = User;