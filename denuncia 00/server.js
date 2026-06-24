const express = require("express");
const http = require("http");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const helmet = require("helmet");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set("trust proxy", true);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

app.use(
session({
secret: process.env.SESSION_SECRET || "ALTERAR_EM_PRODUCAO",
resave: false,
saveUninitialized: false
})
);

app.use(express.static("public"));

const db = new sqlite3.Database("database.db");

db.run("CREATE TABLE IF NOT EXISTS leads ( id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT, ip TEXT, latitude TEXT, longitude TEXT, device TEXT, extra_info TEXT, created_at TEXT )");
db.run("CREATE TABLE IF NOT EXISTS visitors ( id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, latitude TEXT, longitude TEXT, created_at TEXT )");

/* LOGIN ADMIN */

app.post("/api/login", (req, res) => {

const { user, pass } = req.body;

const adminUser = "admin";
const adminPass = "123";

if (user === adminUser && pass === adminPass) {

req.session.auth = true;

return res.json({
  ok: true
});

}

res.status(401).json({
ok: false
});
});

/* SALVAR REGISTRO */

app.post("/api/save", (req, res) => {

const {
phone,
latitude,
longitude,
device,
extra_info
} = req.body;

if (!latitude || !longitude) {

return res.status(400).json({
  ok: false,
  error: "Localização obrigatória"
});

}

const ip =
req.headers["x-forwarded-for"] ||
req.socket.remoteAddress ||
"";

const created_at = new Date().toISOString();

db.run(
"INSERT INTO leads ( phone, ip, latitude, longitude, device, extra_info, created_at ) VALUES (?,?,?,?,?,?,?)",
[
phone,
ip,
latitude,
longitude,
device,
extra_info,
created_at
],
function (err) {

  if (err) {

    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }

  const lead = {
    id: this.lastID,
    phone,
    ip,
    latitude,
    longitude,
    device,
    extra_info,
    created_at
  };

  io.emit("new-lead", lead);

  res.json({
    ok: true,
    id: this.lastID
  });
}

);
});

/* LISTAR REGISTROS */

app.get("/api/leads", (req, res) => {
if(!req.session.auth){ return res.status(401).json({error:"Nao autorizado"}); }

db.all(
"SELECT * FROM leads ORDER BY id DESC",
[],
(err, rows) => {

  if (err) {

    return res.status(500).json({
      error: err.message
    });
  }

  res.json(rows);
}

);
});

/* TESTE */

app.get("/api/test", (req, res) => {

res.json({
status: "ok"
});
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

console.log("Servidor rodando na porta", PORT);
});


app.post("/api/track",(req,res)=>{
 const ip=((req.headers["x-forwarded-for"]||req.socket.remoteAddress||"")+"").split(",")[0].trim();
 const {latitude,longitude}=req.body||{};
 db.run("INSERT INTO visitors(ip,latitude,longitude,created_at) VALUES(?,?,?,?)",
 [ip,latitude||"",longitude||"",new Date().toISOString()],
 ()=>{ io.emit("new-visitor",{ip,latitude,longitude}); res.json({ok:true}); });
});

app.get("/api/visitors",(req,res)=>{
 if(!req.session.auth){ return res.status(401).json({error:"Nao autorizado"}); }
 db.all("SELECT * FROM visitors ORDER BY id DESC",[],(e,r)=>res.json(r||[]));
});

app.get("/admin.html",(req,res)=>{
 if(!req.session.auth) return res.redirect("/login.html");
 res.sendFile(__dirname + "/public/admin.html");
});
