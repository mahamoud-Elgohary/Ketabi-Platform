import bootstrap from "./app.js";
import dotenv from "dotenv";
dotenv.config();
// Support running the server from `Backend/Ketabi_Website` while env file lives in `Backend/.env`.
dotenv.config({ path: "../.env" });
bootstrap();