import express from "express";
import path from "path";
import {fileURLToPath} from "url";
import { Client } from "pg";
import ejs from "ejs";
import cookieSession from "cookie-session";


const db=new Client({
         user:"postgres",
         host:"localhost",
         database:"world",
         password:"12345234534545",
         port:5432
});
await db.connect();

const app=express();
app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));
app.use(
  cookieSession({
    name: "session",
    keys: ["studentTrackerSecret"],
    maxAge: 24 * 60 * 60 * 1000
  })
);
app.set('view engine','ejs');
app.get("/",(req,res)=>{
    res.sendFile(path.resolve("login.html"));
})
app.get("/Sign-up",async(req,res)=>{
    res.sendFile(path.resolve("sign-up.html"));
})
app.post("/Sign-up", async (req, res) => {
     try {
        await db.query(
            "INSERT INTO username(name,password) VALUES($1,$2)",
            [req.body.name2, req.body.password2]
        );
        
        res.redirect("/");
        

    } catch(err) {

        console.log(err);
        res.send(err.message);

    }

});
app.post("/", async (req, res) => {
    const username = req.body.name1;
    const password = req.body.password1;
    const result = await db.query(
        "SELECT * FROM username WHERE name = $1",
        [username]
    );

    if (result.rows.length === 0) {
        return res.send("User does not exist");
    }

    const user = result.rows[0];

    if (user.password === password) {
        req.session.name1 = user.name;
        res.redirect("/homepage");
    } else {
        res.send("Incorrect Password");
    }

});
app.get("/homepage",(req,res)=>{
    res.sendFile(path.resolve('homepage.html'));
})
app.get("/academics",(req,res)=>{
    res.render('homepage');
})



app.get("/edit-grades",(req,res)=>{
    res.sendFile(path.resolve("edit_grades.html"));
});

app.post("/edit-grades", async (req,res)=>{

    const year = parseInt(req.body.year);
    const semesters = year * 2;

    const userId = req.session.name1;
    let cgpa1=0;
    let credits1=0;

    for(let i=1;i<=semesters;i++){

        const gpa = req.body[`gpa${i}`];
        const credits = req.body[`credits${i}`];
        credits1+=Number(credits);
        cgpa1+=Number(gpa)*Number(credits);

        const result=await db.query(
            `UPDATE username
         SET gpa${i} = $1,
             credits${i} = $2
         WHERE name = $3`,
        [gpa, credits, req.session.name1]
        );
        
    }
    cgpa1=cgpa1/credits1;
    const result=await db.query(
            `UPDATE username
         SET cgpa = $1,
             credits = $2
         WHERE name = $3`,
        [cgpa1, credits1, req.session.name1]
        );


    res.redirect("/grades");
});
app.get("/timetable",(req,res)=>{
    res.sendFile(path.resolve("timetable.html"));
})
app.get("/grades", async (req, res) => {

    const result = await db.query(
        "SELECT * FROM username WHERE name = $1",
        [req.session.name1]
    );

    const student = result.rows[0];

res.render("grades", {
    student,
    cgpa: student.cgpa,
    credits: student.credits
});

});
app.post("/assignment/add", async(req,res)=>{

    try{

        const name=req.session.name1;
        const {subject,assignment,deadline}=req.body;

        await db.query(
            `INSERT INTO assignment
            (name,subject,assignment,deadline)
            VALUES($1,$2,$3,$4)`,
            [name,subject,assignment,deadline]
        );

        res.redirect("/assignment");

    }

    catch(err){

        console.log(err);

    }

});
app.get("/assignment",async(req,res)=>{

    try{

        const name=req.session.name1;

        const upcoming=await db.query(
            `SELECT *
            FROM assignment
            WHERE name=$1
            AND deadline>=CURRENT_DATE
            ORDER BY deadline`,
            [name]
        );

        const backlog=await db.query(
            `SELECT *
            FROM assignment
            WHERE name=$1
            AND deadline<CURRENT_DATE
            ORDER BY deadline`,
            [name]
        );

        res.render("assignment",{

            assignments:upcoming.rows,
            backlogs:backlog.rows

        });

    }

    catch(err){

        console.log(err);

    }

});
app.get("/assignment/delete/:id",async(req,res)=>{

    try{

        await db.query(
            `DELETE FROM assignment
            WHERE id=$1`,
            [req.params.id]
        );

        res.redirect("/assignment");

    }

    catch(err){

        console.log(err);

    }

});
app.get("/attendance",(req,res)=>{
    res.sendFile(path.resolve("Attendance.html"));
})

app.listen(3000,()=>{
    console.log("server is running");
})