import express, { Response, Request, response } from 'express';
import { createServer } from 'node:http';
import http, { IncomingMessage, request } from 'http';
import { db } from './db'; // importing connection to database
import { DefaultClause, resolveModuleName } from 'typescript';

import { join } from 'node:path';
import { Server, Socket } from 'socket.io';
import bodyParser from "body-parser"; //to get the body of a request or response

// importing interfaces
import User from "./interfaces/User";
import Message from "./interfaces/Message";
import Room from './interfaces/Room';

import expressSession, { SessionData } from 'express-session'; // using session with express and socket
// declaring additional properties on session object:
declare module 'express-session' { 
  interface SessionData {
    //user?: {id: number, username: string};
    user?: {username: string};
  }
};

// session declaration
const session = expressSession({
  secret: 'verysecret',
  resave: false,
  saveUninitialized: true,
  cookie: {}
})

// getting object created by server to send it to our socket
interface SessionIncomingMessage extends IncomingMessage {
  session: SessionData
}

interface SessionSocket extends Socket {
  request: SessionIncomingMessage
}

// initializing variables
const messages: Message[] = [];
const users: User[] = [];
//const rooms: Room = [];
let userPseudo: string = '';

const app = express(); //init express server
const httpserver = createServer(app); // creating http server
const io = new Server(httpserver); // creating websocket server

// middleware that takes the request to put it in the socket
const wrapper = (middleware: any) => (socket: Socket, next: any) => middleware(socket.request, {}, next);
io.use(wrapper(session));

const jsonParser = bodyParser.json(); // parsing the body
const urlencodedParser = bodyParser.urlencoded({ extended: true }); // parsing the body too

// saying to server using...
app.use(jsonParser); // saying to express to use bodyParser
app.use(urlencodedParser);
app.use(session);
app.use(express.static(__dirname + "/public"));// to put css in a file outside html page

app.get('/', (req: Request, res: Response) => {
  //console.log('request: ', req);
  //console.log('app.get response: ', res);
  res.sendFile(join(__dirname, '/public/views/index.html')); //to send the response to the route
  //if(req.session.user) {
    //res.send(`Welcome ${req.session.user.username}!`);
  //} else {
    //res.send('You don\'t have a pseudo yet');
  //}
  
});

app.get('/chat', (req: Request, res: Response) => {
  //if (req.session.user) {
    res.sendFile(join(__dirname, '/public/views/chat.html')); //absolute path from current directory
  //} else {
    //res.redirect("/");
  //}
    
}); 
/*
app.get('/login', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '/views/login.html'));
}); 
*/

app.get('/pseudo', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '/public/views/pseudo.html'));
  //console.log(req.query.idroom);
}); 

app.get('/rooms', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '/public/views/rooms.html'));
});

app.get('/room1', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '/public/views/room1.html'));
  console.log('query: ', req.query.room);
});

app.post('/pseudo', (req: Request, res: Response) => {
  const pseudo = req.body.pseudo;
  userPseudo = pseudo;
  
  if (userPseudo) {
    console.log('Welcome ', userPseudo);
    req.session.user = {username: userPseudo};
    console.log(req.session.user);
    res.redirect('/chat');
  } else {
    console.log('pseudo missing');
    res.send('pseudo missing');
  }
  //console.log(users);
});
//const rooms = [];
//createRoom();
//joinRoom();
//getPseudo();
/* Room {
  name,
  users[]
} */


function createNewUser(socket: Socket) {
   
  const newUser: User = {
    //name: 'User' + (users.length + 1),
    name: userPseudo,
    socket: socket.id
  }
  users.push(newUser);
  console.log(users);
}

function findUserBySocket(socket: Socket) {
  const user = users.find((u) => u.socket === socket.id);
  return (user ? user : null)
}
/*
app.post('/login', (req, res) => {
  const username = req.body.username;
  console.log(username);
  const password = req.body.password;
  console.log(password);
});
*/
  
// listening connection event
io.on('connection', (socket: Socket) => {
  console.log('a user connected');
  socket.emit('getMessages', messages);

  createNewUser(socket);
  
  socket.on('message', (msg: string) => {
    // if (findUserBySocket(socket)?.name === '') {
      //console.log("Choose a pseudo");
    //} 
    const message: Message = {
      sender: findUserBySocket(socket)?.name,
      content: msg,
    }
    if (message.sender != undefined) {
      messages.push(message);
    }
    io.emit('message', message);
  })

// test create room
  socket.on('create', function(room) {
    socket.join(room);
    console.log('room: ', room);
    const message: Message = {
      sender: findUserBySocket(socket)?.name,
      content: 'test',
    }
    if (message.sender != undefined) {
      messages.push(message);
    }
    socket.on("private message", (room, msg) => {
      socket.to(room).emit("private message", socket.id, msg);
    });
    //socket.to("room1").emit('message', message);
  });
});

/* io.on('connection', (defaultSocket: Socket) => {
  const socket = <SessionSocket> defaultSocket;
  const userSession = socket.request.session.user;
  if (userSession) {
    console.log(userSession?.username + " is connected");
    socket.on('message', (msg) => {
      io.emit('message', userSession.username + " : " + msg);
    });
    socket.on('disconnect', () => {
    console.log(userSession?.username +  ' is disconnected');
  });
  }
}); */

// port 3000 listener 
httpserver.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});