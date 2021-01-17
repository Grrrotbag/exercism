const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const { faDiceOne } = require("@fortawesome/free-solid-svg-icons");
require("dotenv").config();

// =============================================================================
// Config
// =============================================================================
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true }, () => {
  console.log("Database connection status: ", mongoose.connection.readyState);
});

const { Schema } = mongoose;

const ExerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: Date,
});

const UserSchema = new Schema({
  username: { type: String, required: true, unique: "Username already taken" },
  log: [ExerciseSchema],
});

let User = mongoose.model("User", UserSchema);
let Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors());
app.use(express.static("public"));

// =============================================================================
// Functions
// =============================================================================
const createNewUser = (username) => {
  let newUser = new User({ username: username });
  newUser.save();
};
// =============================================================================
// Server
// =============================================================================
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/exercise/new-user", async (req, res) => {
  // You can POST to /api/exercise/new-user with form data username to create a new user.
  // The returned response will be an object with username and _id properties.
  // Returns {"username":"bobbyb","_id":"600478940aa40e05f2b893ff"}
  console.log(req.body);
  let username = req.body.username;

  const existingUser = await User.findOne({ username: username });
  if (existingUser) {
    res.send("Username already taken");
  } else {
    let newUser = new User({ username: username });
    newUser.save().then(
      res.json({
        username: newUser.username,
        _id: newUser.id,
      })
    );
  }
});

app.get("/api/exercise/users", async (req, res) => {
  // You can make a GET request to api/exercise/users to get an array of all users.
  // Each element in the array is an object containing a user's username and _id.
  const all = await User.find();

  res.send(all);
});

app.post("api/exercise/add", (req, res) => {
  // You can POST to /api/exercise/add with form data userId=_id, description, duration,
  // and optionally date. If no date is supplied, the current date will be used.
  // The response returned will be the user object with the exercise fields added.
  // Return {"_id":"6004774f0aa40e05f2b893fc","username":"bobby","date":"Thu Jan 16 2020","duration":3,"description":"Sex"}
  const { userId, decription, duration, date } = req.body;
});

app.get("/api/exercise/log/:userId=_id", (req, res) => {
  // You can make a GET request to /api/exercise/log with a parameter of userId=_id
  // to retrieve a full exercise log of any user. The returned response will be the user
  // object with a log array of all the exercises added. Each log item has the description,
  // duration, and date properties.
  // A request to a user's log (/api/exercise/log) returns an object with a count property
  // representing the number of exercises returned.
  // You can add from, to and limit parameters to a /api/exercise/log request to retrieve
  // part of the log of any user. from and to are dates in yyyy-mm-dd format.
  // limit is an integer of how many logs to send back.
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
