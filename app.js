var express = require('express');
var app = express();

var server=require('http').createServer(app);
var io=require('socket.io').listen(server);
var mongoose=require('mongoose');
users = {};

server.listen(5001);
mongoose.connect('mongodb://localhost/chat',function(err){
  if(err){
    console.log(err);

  }
  else{
    console.log('connected to mongodb');
  }
});
var chatSchema=mongoose.Schema({
  nick:String,
  msg:String,
  created :{type:Date,default:Date.now}
});
var Chat=mongoose.model('Message',chatSchema);
console.log('servr listening');
// view engine setup
app.get('/',function(req,res){
  res.sendFile(__dirname + '/index.html');
});
io.sockets.on('connection',function(socket){
  socket.on('new user',function(data,callback){
    if(data in users){
      callback(false);
    } else{
      callback(true);
      socket.nickname = data;
  users[socket.nickname]=socket;
      updateNicknames();
      }
  });
  function updateNicknames(){
    io.sockets.emit('usernames',Object.keys(users));
  }
  socket.on('send message',function(data,callback){
    var msg=data.trim();
   if(msg.substr(0,3) === '/w '){
     msg =msg.substr(3);
     var ind = msg.indexOf(' ');
     if(ind !== -1){
       var name=msg.substring(0,ind);
       var msg=msg.substring(ind + 1);
       if(name in users){
         users[name].emit('whisper',{msg :msg,nick:socket.nickname});
       console.log('Whisper');
    } else{
          callback('Error! enter a valid user. ');
     }
   }else{
       callback('Error! please enter a messaqge for your whisper.');
     }

   }else{
     var newMsg=new Chat({msg:msg,nick:socket.nickname});
     newMsg.save(function(err){
     io.sockets.emit('new message',{msg: data, nick:socket.nickname});
   });
  }
    //socket.broadcast.emit('new message',data);
  });
  socket.on('disconnect',function(daa) {

    if(!socket.nickname)
    return;
    delete users[socket.nickname];
    updateNicknames();
  });
});
