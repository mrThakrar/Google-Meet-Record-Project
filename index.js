import express from "express";
import cors from "cors";
import Router from "./routes/routes.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(Router);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

