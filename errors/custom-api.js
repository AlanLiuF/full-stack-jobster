class CustomAPIError extends Error {
  constructor(message) {     // method that gets called when an instance is created
    super(message)      // super: call the constructor of the Error(parent class) and pass the message parameter to it
  }
}

module.exports = CustomAPIError
