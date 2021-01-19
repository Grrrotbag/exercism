const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
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

const UserSchema = new Schema({
  username: { type: String, required: true, unique: "Username already taken" },
  log: [
    {
      description: String,
      duration: Number,
      date: Date,
    },
  ],
});

let User = mongoose.model("User", UserSchema);

app.use(cors());
app.use(express.static("public"));

// =============================================================================
// functions
// =============================================================================
// Detect an invalid date - which is what you get if no date is in the query string.
// https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript

const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
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

app.post("/api/exercise/add", async (req, res) => {
  // You can POST to /api/exercise/add with form data userId=_id, description, duration,
  // and optionally date. If no date is supplied, the current date will be used.
  // The response returned will be the user object with the exercise fields added.
  // Return {"_id":"6004774f0aa40e05f2b893fc","username":"bobby","date":"Thu Jan 16 2020","duration":3,"description":"Jogging"}
  console.log(req.body);
  const { userId, description, duration, date } = req.body;

  const payload = {
    description: description,
    duration: Number(duration),
    date: date.length > 0 ? new Date(date) : new Date(),
  };

  try {
    let user = await User.findById(userId);

    if (user) {
      user.log.push(payload);
      user.save();
      res.json({
        username: user.username,
        description: payload.description,
        duration: payload.duration,
        _id: user._id,
        date: payload.date.toString().substring(0, 15),
      });
    } else {
      res.json({
        Error: "user does not exist",
      });
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

app.get("/api/exercise/log", (req, res) => {
  // You can make a GET request to /api/exercise/log with a parameter of userId=_id
  // to retrieve a full exercise log of any user. The returned response will be the user
  // object with a log array of all the exercises added. Each log item has the description,
  // duration, and date properties.
  // A request to a user's log (/api/exercise/log) returns an object with a count property
  // representing the number of exercises returned.
  // You can add from, to and limit parameters to a /api/exercise/log request to retrieve
  // part of the log of any user. from and to are dates in yyyy-mm-dd format.
  // limit is an integer of how many logs to send back.
  const { userId, from, to, limit } = req.query;

  User.findById({ _id: userId }, (err, doc) => {
    if (doc === "null") {
      res.send("error: No user with that ID");
    } else {
      let data = doc.log;

      let fromDate = isValidDate(new Date(from)) ? new Date(req.query.from) : new Date(data[0].date);
      let toDate = isValidDate(new Date(to)) ? new Date(req.query.to) : new Date();
      let itemLimit = limit ? Number(limit) : Number(data.length);

      console.log("from: ", fromDate, "to: ", toDate, "limit: ", limit);

      data = data
        .filter((exercise) => exercise.date <= toDate)
        .filter((exercise) => exercise.date >= fromDate)
        .slice(0, itemLimit);

      // Add count of returned exercises
      data["count"] = data[0].length;

      console.log("filtered: ", data);
      res.send({ log: data });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
