const express = require("express");
const CircuitBreaker = require("./CircuitBreaker");

const app = express();

const port = 3000;

// Make a request to server B
const request = {
  url: "http://localhost:3001",
  method: "GET",
};
// Create a new circuit breaker object
const circuitBreakerObject = new CircuitBreaker(request);

app.get("/", async (req, res) => {
  console.log("Failure count: ", circuitBreakerObject.failureCount);
  // Fire the circuit breaker
  try {
    const data = await circuitBreakerObject.fire();
    res.send(data);
  } catch (error) {
    console.log("Error in server B:", error.message);
    res.status(503).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server A listening at http://localhost:${port}`);
});
