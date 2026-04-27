// Import express.js
const express = require("express");

// Create express app
var app = express();

app.set('view engine', 'pug');
app.set('views', './app/views');

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function(req, res) {
    res.render("index", { title: "Home Page"});
});

app.get("/roehampton", function(req, res) {
    let path = req.url;

    // remove the "/"
    let word = path.substring(1);

    // split → reverse → join
    let reversed = word.split("").reverse().join("");

    res.send(reversed);
});

app.get("/user/:id", function(req, res) {
    res.send("User ID is " + req.params.id);
});

// Create a route for testing the db
app.get("/db_test", function(req, res) {
    // Assumes a table called test_table exists in your database
    let sql = 'select * from test_table';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    });
});

app.get("/db_test/:id", async function(req, res) {
    let id = req.params.id;

    let rows = await db.query(
        "SELECT * FROM test_table WHERE id = ?",
        [id]
    );

    if (rows.length > 0) {
        res.send("<h1>" + rows[0].name + "</h1>");
    } else {
        res.send("No user found");
    }
});

app.get("/number/:n", function(req, res) {
    let n = req.params.n;

    let output = "<table border='1'>";

    for (let i = 0; i <= n; i++) {
        output += "<tr><td>" + i + "</td></tr>";
    }

    output += "</table>";

    res.send(output);
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});

app.get("/students", async function(req, res) {
    let rows = await db.query("SELECT * FROM Students");

    let output = `
        <h1>Students</h1>
        <table border="1">
            <tr>
                <th>ID</th>
                <th>Name</th>
            </tr>
    `;

    rows.forEach(student => {
        output += `
            <tr>
                <td>${student.id}</td>
                <td>
                    <a href="/student/${student.id}">
                        ${student.name}
                    </a>
                </td>
            </tr>
        `;
    });

    output += "</table>";

    res.send(output);
});

app.get("/all-students-formatted", function(req, res) {
    let sql = 'SELECT * FROM Students';

    db.query(sql).then(results => {
        res.render('all-students', { data: results });
    });
});

app.get("/students/json", async function(req, res) {
    let rows = await db.query("SELECT * FROM Students");
    res.json(rows);
});

app.get("/student/:id", async function(req, res) {
    let id = req.params.id;

    let student = await db.query(
        "SELECT * FROM Students WHERE id = ?",
        [id]
    );

    let programme = await db.query(
        "SELECT name FROM Programmes WHERE id = (SELECT programme FROM Student_Programme WHERE id = ?)",
        [id]
    );

    let modules = await db.query(
        `SELECT Modules.name 
         FROM Modules 
         WHERE code IN (
             SELECT module FROM Programme_Modules 
             WHERE programme = (
                 SELECT programme FROM Student_Programme WHERE id = ?
             )
         )`,
        [id]
    );

    if (student.length > 0) {
        res.render("student-single", {
            student: student[0],
            programme: programme,
            modules: modules
        });
    } else {
        res.send("Student not found");
    }
});

app.get("/all-programmes", function(req, res) {
    let sql = "SELECT * FROM Programmes";

    db.query(sql).then(results => {
        res.render("all-programmes", { data: results });
    });
});

app.get("/programme/:id", async function(req, res) {
    let id = req.params.id;

    // Get programme
    let programme = await db.query(
        "SELECT * FROM Programmes WHERE id = ?",
        [id]
    );

    // Get modules
    let modules = await db.query(
        `SELECT Modules.code, Modules.name 
         FROM Modules
         JOIN Programme_Modules 
         ON Modules.code = Programme_Modules.module
         WHERE Programme_Modules.programme = ?`,
        [id]
    );

    if (programme.length > 0) {
        res.render("programme-single", {
            programme: programme[0],
            modules: modules
        });
    } else {
        res.send("Programme not found");
    }
});

app.get("/module/:code", async function(req, res) {
    let code = req.params.code;

    let module = await db.query(
        "SELECT * FROM Modules WHERE code = ?",
        [code]
    );

    let programmes = await db.query(
        `SELECT Programmes.name
         FROM Programmes
         JOIN Programme_Modules
         ON Programmes.id = Programme_Modules.programme
         WHERE Programme_Modules.module = ?`,
        [code]
    );

    let students = await db.query(
        `SELECT Students.name
         FROM Students
         JOIN Student_Programme
         ON Students.id = Student_Programme.id
         WHERE Student_Programme.programme IN (
             SELECT programme
             FROM Programme_Modules
             WHERE module = ?
         )`,
        [code]
    );

    if (module.length > 0) {
        res.render("module-single", {
            module: module[0],
            programmes: programmes,
            students: students
        });
    } else {
        res.send("Module not found");
    }
});

app.get("/about-me", function(req, res) {
    res.render("about-me", {
        title: "About Me"
    });
});

app.get("/tips", async function(req, res) {
    let tips = await db.query(
        `SELECT tips.tip_id, tips.game, tips.title, tips.short_description, tips.full_description, tips.likes, users.username
         FROM tips
         JOIN users ON tips.user_id = users.user_id`
    );

    res.render("tips", {
        tips: tips
    });
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});