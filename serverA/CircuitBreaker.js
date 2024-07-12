// Class based in https://dev.to/lovepreetsingh/how-use-circuit-breaker-in-nodejs-4ake

const axios = require("axios");

const CircuitBreakerStates = {
  CLOSED: "CLOSED", // circuit is closed and requests are allowed to go through
  HALF: "HALF", // circuit is half open and only a certain number of requests are allowed to go through
  OPENED: "OPENED", // circuit is open and no requests are allowed to go through
};

class CircuitBreaker {
  request = null;
  state = CircuitBreakerStates.CLOSED;
  failureCount = 0;
  failureThreshold = 5; // number of failures to determine when to open the circuit
  resetAfter = 50000;
  openTimeout = 5000; // declare request failure if the function takes more than 5 seconds

  constructor(request) {
    this.request = request;
    this.state = CircuitBreakerStates.CLOSED; // allowing requests to go through by default
    this.failureCount = 0;
    // allow request to go through after the circuit has been opened for resetAfter seconds
    // open the circuit again if failure is observed, close the circuit otherwise
    this.resetAfter = Date.now();
  }

  async fire() {
    // if the circuit is open, check if it's time to close it
    if (this.state === CircuitBreakerStates.OPENED) {
      if (this.resetAfter <= Date.now()) {
        this.state = CircuitBreakerStates.HALF;
      } else {
        throw new Error(
          "Circuit is in open state right now. Please try again later."
        );
      }
    }
    // if the circuit is not open, fire the request
    try {
      const response = await axios(this.request);
      if (response.status === 200) return this.success(response.data);
      return this.failure(response.data);
    } catch (err) {
      return this.failure(err.message);
    }
  }

  success(data) {
    this.failureCount = 0;
    if (this.state === CircuitBreakerStates.HALF) {
      this.state = CircuitBreakerStates.CLOSED;
    }
    return data;
  }

  failure(data) {
    this.failureCount += 1;
    if (
      this.state === CircuitBreakerStates.HALF ||
      this.failureCount >= this.failureThreshold
    ) {
      this.state = CircuitBreakerStates.OPENED;
      this.resetAfter = Date.now() + this.openTimeout;
    }
    return data;
  }
}

module.exports = CircuitBreaker;
