import express = require("express");
import { Request, Response, NextFunction } from "express";

const app = express();
const port = 3000;

const getCreditScore = (req: Request, res: Response, next: NextFunction) => {
  const min = Math.ceil(300);
  const max = Math.floor(850);
  const creditScore = Math.floor(Math.random() * (max - min + 1) + min);
  res.status(200).json({
    creditScore,
  });
};

app.get("/creditScore/", getCreditScore);

app.listen(port, () => {
  console.log(`Fake credit score api is running on port ${port}.`);
});
