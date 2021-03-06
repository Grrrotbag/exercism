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
  const all = await User.find();

  res.send(all);
});

app.post("/api/exercise/add", async (req, res) => {
  const { userId, description, duration, date } = req.body;

  let addDate = isValidDate(new Date(date)) ? new Date(date) : new Date();

  const payload = {
    description: description,
    duration: Number(duration),
    date: addDate,
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
  const { userId, from, to, limit } = req.query;

  User.findById({ _id: userId }, (err, doc) => {
    if (doc === "null") {
      res.send("error: No user with that ID");
    } else {
      let data = doc.log;

      let fromDate = isValidDate(new Date(from)) ? new Date(from) : new Date(data[0].date);
      let toDate = isValidDate(new Date(to)) ? new Date(to) : new Date();
      let itemLimit = limit ? Number(limit) : Number(data.length);

      data = data
        .filter((exercise) => exercise.date <= toDate)
        .filter((exercise) => exercise.date >= fromDate)
        .slice(0, itemLimit);

      const payload = data.map(function (exercise) {
        return {
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toString().substring(0, 15),
        };
      });

      res.json({
        _id: userId,
        username: doc.username,
        count: data.length,
        log: payload,
      });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Exercism is listening on port " + listener.address().port);
});
