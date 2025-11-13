import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const socketAuth = (socket, next) => {
  console.log("Authenticating socket...");

  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: Token not provided"));
  }

  try {
    const decode = jwt.verify(token, JWT_SECRET);
    socket.user = decode;
    next();
  } catch (error) {
    return next(new Error("Authentication error: Invalid token"));
  }
};

export const optionalSocketAuth = (socket, next) => {
  const token = socket.handshake.auth.token;

  if (token) {
    try {
      const decode = jwt.verify(token, JWT_SECRET);
      socket.user = decode;
      socket.isAuthenticated = true;
    } catch (error) {
      socket.isAuthenticated = false;
    }
  } else {
    socket.isAuthenticated = false;
  }

  next();
};
