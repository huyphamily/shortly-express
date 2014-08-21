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
  }
});

module.exports = User;