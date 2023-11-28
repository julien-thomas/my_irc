import express, { Response, Request, response } from 'express';
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
import bodyParser from "body-parser"; //to get the body of a request or response
import { User, Room, Message } from './interfaces';
import { db } from './db'; // importing connection to database
import { Socket } from 'socket.io';
// import { parse } from 'path';
import { RowDataPacket } from 'mysql2';
// initializing variables
const messages: Message[] = [];
const users: User[] = [];
const rooms: Room[] = [{
  users: [],
  messages: [],
  room_id: 0
}];
let roomId: number = 1;
let userPseudo: string = '';
let roomChoice: number = 0;
let roomnumberplease: number = 0;
let private_room: number[] = [];

const app = express(); //init express server
const httpserver = createServer(app); // creating http server
const io = new Server(httpserver); // creating websocket server
const jsonParser = bodyParser.json(); // parsing the body
const urlencodedParser = bodyParser.urlencoded({ extended: true }); // parsing the body too

// saying to server using...
app.use(jsonParser); // saying to express to use bodyParser
app.use(urlencodedParser);
app.use(express.static(__dirname + "/public"));// to put css in a file outside html page

app.get('/', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '/public/views/index.html'));//to send the response to the route
});

app.get('/chat', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '/public/views/chat.html'));//absolute path from current directory
  // const room_choice = req.query.room_choice;
  // console.log("ROOM number", room_choice);
}); 

app.post('/chat', (req, res) => {
  const room_choice = req.body.room_choice;
  roomChoice = parseInt(room_choice);
  private_room.push(roomChoice);
  const room_number_please = req.body.room_number_please;
  roomnumberplease = parseInt(room_number_please);
  private_room.push(roomnumberplease);
})

app.get('/pseudo', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '/public/views/pseudo.html'));
}); 

app.post('/pseudo', (req, res) => {
  const pseudo = req.body.pseudo;
  userPseudo = pseudo;
  console.log("Pseudo : ", userPseudo);
  res.redirect("/chat");
});

app.get('/rooms', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '/public/views/rooms.html'));
}); 

function createNewUser(socket: Socket) {
  const newUser: User = {
    //name: 'User' + (users.length + 1),
    name: userPseudo,
    socket: socket.id,
    room_id: roomId
  }
  users.push(newUser);
  roomId++;
  console.log("Users : ", users);
}

function findUserBySocket(socket: Socket) {
  const user = users.find((u) => u.socket === socket.id);
  return (user ? user : null)
}

app.get('/login', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '/public/views/login.html'));
}); 

app.post('/login', (req: Request, res: Response) => {
  const username = req.body.username;
  console.log("email: ", username);
  const password = req.body.password;
  console.log("password: ", password);
  if (username != '' && password != '') {
    const query = "select * from users where email = ?";
    db.query(query, username, (error, result) => {
      if (error) {
        console.log(error);
        res.send("user not found");
      } else {
        const data = <RowDataPacket> result;
        if (data.length != 0) {
          console.log(data);
          console.log("user found");
          res.redirect("/pseudo");
        } else {
          res.send("user not found");
        }
      }
    })
  } else {
    console.log("username or password missing");
    response.send("username or password missing");
  }
});


// listening connection event
io.on('connection', (socket: Socket) => {
  // console.log('a user connected');

  createNewUser(socket);

  // const newRoom: Room = {
  //   users: [users[users.length - 1]],
  //   messages: [],
  //   room_id: rooms[rooms.length - 1].room_id + 1
  // };
  // rooms.push(newRoom);
  // console.log("Rooms : ", rooms);
  // io.emit('list of rooms', rooms);
  // socket.on('buttonClicked', (socket: Socket) => {
  //   const socketId = socket.id;
  //   console.log(`Button clicked by client with socket ID: ${socketId}`);
  // });
  socket.on('chat message', (msg: string) => {
    const messager = findUserBySocket(socket);
    const message: Message = {
      sender: messager?.name,
      room_id: messager?.room_id,
      content: msg
    }
    if (message.sender != undefined) {
      messages.push(message);
    }
    if (roomChoice === 0) {
    io.emit('chat message', (`${messages[messages.length - 1].sender} (Room n°${messages[messages.length - 1].room_id}) : ${messages[messages.length - 1].content}`));
    // console.log(`${messages[messages.length - 1].sender} : ${messages[messages.length - 1].content}`);
    } else {
      console.log(private_room);
      for (const elem of users) {
        if (elem.room_id === private_room[private_room.length - 4] || elem.room_id === private_room[private_room.length - 1]) {
        io.to(elem.socket).emit('chat message', (`${messages[messages.length - 1].sender} (Room n°${messages[messages.length - 1].room_id}) : ${messages[messages.length - 1].content}`));
        }
      }
    }
  })
});

// port 3000 listener 
httpserver.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
