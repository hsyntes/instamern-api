const express = require("express");
const compression = require("compression");
const cors = require("cors");
const path = require("path");
const expressRateLimit = require("express-rate-limit");
const expressMongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const hpp = require("hpp");
const xss = require("xss-clean");
const userRouters = require("./routers/userRouters");
const postRouters = require("./routers/postRouters");
const storyRouters = require("./routers/storyRouters");
const ErrorProvider = require("./classes/ErrorProvider");
const errorController = require("./controllers/errorController");

const app = express();

// * Handle Cross-Origin Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "https://instamern.netlify.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// * Pug engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// * Limitting API requests
const limit = expressRateLimit({
  max: 15,
  windowsMs: 60 * 60 * 1000,
  mesage: "Too many requests.",
  standartHeaders: true,
  legacyHeaders: false,
});

// * Express body parser
app.use(express.json({ limit }));

// * Compression
app.use(compression());

// * Security
app.use(expressMongoSanitize());
app.use(helmet());
app.use(hpp());
app.use(xss());

// * Root Route
app.get("/", (req, res) => {
  res.send("Welcome to the InstaMERN API");
});

// * Routers
app.use("/instamern/users", userRouters);
app.use("/instamern/posts", postRouters);
app.use("/instamern/stories", storyRouters);

// * Unsupported URL
app.all("*", (req, res, next) =>
  next(new ErrorProvider(404, "fail", `Unsupported URL: ${req.originalUrl}`))
);

// * Error handler
app.use(errorController);

module.exports = app;
