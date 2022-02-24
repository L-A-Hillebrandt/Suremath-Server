var express = require('express');
var fs = require('fs');
var path = require('path');
var fileUpload = require('express-fileupload');
var cors = require('cors');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var _ = require('lodash');
var app = express();

var dbHandler = require('./DbHandler');
const { urlencoded } = require('body-parser');

const exerciseDir = './exercises';
const templateDir = './templates';
var port = 3000;
const ip = '127.0.0.1';

const userPort = process.argv.slice(2)[0];

if(userPort){
    port = userPort;
}

app.use(fileUpload({
    createParentPath: true,
}));

app.use(cors());
app.use(bodyParser.json());
app.use(urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(express.static('public'));
app.set('views', templateDir);
app.set('view engine', 'pug');

app.get("/", async function(req, res){
    res.render("index");
});

app.get("/list", async function(req, res){
    var list = dbHandler.getList();
    console.log(list);
    if(list)
    {
        res.render("list", {exercises: list});
    }
});

app.get("/list-app", async function(req, res){
    var list = dbHandler.getAppList();
    if(list)
    {
        res.json(list);
    }
});

app.get("/list/:id", async function(req, res){
    let id = _.toInteger(req.params.id);

    let exercise;
    
    try
    {
        exercise = dbHandler.getExercise(id);
    }
    catch(e)
    {
        res.status(400).send("ID fehlerhaft");
    }
    if(!exercise)
    {
        return res.status(404).send("Aufgabe nicht gefunden");
    }

    let file = fs.readFileSync(path.join(exerciseDir, exercise.fileName)).toString();

    if(file === "")
    {
        return res.status(500).send("Dateifehler");
    }

    let response = {};
    response.title = exercise.title;
    response.author = exercise.author;
    response.faculty = exercise.faculty;
    response.data = file;

    res.json(response);
});

app.post("/upload-new", async function(req, res){
    let title, author, faculty, exerciseFile;
    try
    {
        if(!req.files)
        {
            return res.status(400).render("upload-new", {error:"Es wurde keine Datei hochgeladen."});
        }

        title = req.body.title.toString();
        author = req.body.author.toString();
        faculty = req.body.faculty.toString();
        exerciseFile = req.files.file;

        if(!dbHandler.duplicate(exerciseFile.name))
        {
            exerciseFile.mv(path.join(exerciseDir, exerciseFile.name), (err) => {
                if(err)
                {
                    console.log(err);
                    return res.status(500).render("upload-new", {error: err});
                }
                try
                {
                    dbHandler.addExercise(title, author, faculty, exerciseFile.name.toString());
                }
                catch(e)
                {
                    return res.status(400).render("upload-new", {error: "Fehlerhafte Eingabe"});
                }
            });
        }
        else
        {
            let randomSeed = Math.floor(Math.random() * 10000000);

            let newFileName = exerciseFile.name.slice(0, -9) + randomSeed + exerciseFile.name.slice(-9);

            exerciseFile.mv(path.join(exerciseDir, newFileName), (err) => {
                if(err)
                {
                    console.log(err);
                    return res.status(500).render("upload-new", {error: err});
                }
                try
                {
                    dbHandler.addExercise(title, author, faculty, newFileName);
                }
                catch(e)
                {
                    return res.status(400).render("upload-new", {error: "Fehlerhafte Eingabe"});
                }
            });
        }
    }
    catch(err)
    {
        console.log(err);
        res.status(500).render("upload-new", {error: err});
    }
    
    let timeStamp = new Date().toLocaleString();

    res.status(201).render("upload-new", {created: {
        timeStamp: timeStamp,
        title: title,
        author: author,
        faculty: faculty
    }});
});

app.get("/upload-new", async function(req, res){
    res.render("upload-new");
});

app.delete("/list/:id", async function(req, res){
    let id = _.toInteger(req.params.id);

    let file;

    try
    {
        file = dbHandler.getExerciseFileName(id);
    }
    catch(e)
    {
        return res.status(400).render("list", {error: "Fehlerhafte Eingabe, ID ungültig"});
    }
    if(!file)
    {
        return res.status(500).render("list", {error: "Datei nicht gefunden."});
    }
    let fileName = file.fileName;
    let runResult;
    try
    {
        runResult = dbHandler.deleteExercise(id);
    }
    catch(e)
    {
        return res.status(500).render("list", {error: "Fehlerhafte ID"});
    }
    

    if(runResult !== false && runResult.changes === 1)
    {
        fs.rm(path.join(exerciseDir, fileName), (err, stat) => {
            if(err)
            {
                res.status(500).render("list", {error: err});
            }
        });
        res.status(200).send();
    }
    else
    {
        return res.status(500).render("list", {error: "Datenbankfehler."});
    }
});

app.listen(port, ip, ()=>{
    console.log("Server listening on port " + port);
});