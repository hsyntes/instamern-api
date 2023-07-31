const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

// ! Uncaought Exception Error
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception. Server is shutting down.");
  console.error(err.name, err.message);
  process.exit(1);
});

const app = require("./app");
const mongoose = require("mongoose");

// * Connect to the database
(async () => {
  try {
    await mongoose.connect(process.env.URI);
    console.error(`Connected to the database successfully.`);
  } catch (e) {
    console.error(`Error connecting to the database: ${e}`);
  }
})();

// * Start and listen to the server
const server = app.listen(process.env.PORT, () =>
  console.log(`Server is running on PORT: ${process.env.PORT}`)
);

// ! Unahndled Rejection Error
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection.");
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});
