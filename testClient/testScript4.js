// 이 테스트 스크립트는 몽구스로 디비에서 csv 파일을 만드는 것을 테스트 하기 위해 작성하였다.

var mongoose = require('mongoose').connect('mongodb://localhost/testscrip');;
var mongooseToCsv = require('mongoose-to-csv');
var fs = require('fs');

var UserSchema = new mongoose.Schema({
  fullname: {type: String},
  email: {type: String},
  age: {type: Number},
  username: {type: String}
});

UserSchema.plugin(mongooseToCsv, {
  headers: 'Firstname Lastname Username Email Age',
  constraints: {
    'Username': 'username',
    'Email': 'email',
    'Age': 'age'
  },
  virtuals: {
    'Firstname': function(doc) {
      return doc.fullname.split(' ')[0];
    },
    'Lastname': function(doc) {
      return doc.fullname.split(' ')[1];
    }
  }
});

var User = mongoose.model('Users', UserSchema);
for (var i = 1; i < 40 ; i ++){
  var test_doc = new User;
  test_doc.fullname ='Lee Jeongpyo';
  test_doc.age = i;
  test_doc.email = 'pouringlife@naver.com';
test_doc.save();
}

// Query and stream
User.findAndStreamCsv({age: {$lt: 40}})
  .pipe(fs.createWriteStream('users_under_40.csv'));

// Create stream from query results
User.find({}).exec()
  .then(function(docs) {
    User.csvReadStream(docs)
      .pipe(fs.createWriteStream('users.csv'));
  });

// Transform mongoose streams
User.find({})
  .where('age').gt(20).lt(30)
  .limit(10)
  .sort('age')
  .stream()
  .pipe(User.csvTransformStream())
  .pipe(fs.createWriteStream('users.csv'));
