var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var dataSchema = new Schema({
  time : Number,
  x : Number,
  y : Number
});

var testSchema = new Schema({
    deviceName : String,
    dateTime : { type: Date , default : Date.now },
    takeOrder : String,
    data: [dataSchema],
    testId: Schema.ObjectId
});
mongoose.model('test',testSchema);
mongoose.model('data',dataSchema);
