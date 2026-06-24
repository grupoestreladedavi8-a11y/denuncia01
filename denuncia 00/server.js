const express=require('express');
const http=require('http');
const sqlite3=require('sqlite3').verbose();
const cors=require('cors');
const bodyParser=require('body-parser');
const session=require('express-session');
const helmet=require('helmet');
const {Server}=require('socket.io');
const app=express(); const server=http.createServer(app); const io=new Server(server);
app.set('trust proxy',true);
app.use(helmet({contentSecurityPolicy:false}));
app.use(cors()); app.use(bodyParser.json({limit:'10mb'}));
app.use(session({secret:process.env.SESSION_SECRET||'ALTERAR_EM_PRODUCAO',resave:false,saveUninitialized:false}));
app.use(express.static('public'));
const db=new sqlite3.Database('database.db');
db.run(`CREATE TABLE IF NOT EXISTS leads (
id INTEGER PRIMARY KEY AUTOINCREMENT,
phone TEXT, ip TEXT, latitude TEXT, longitude TEXT,
device TEXT, extra_info TEXT, created_at TEXT)`);
server.listen(3000,()=>console.log('OK'));
