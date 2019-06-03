const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");

const axios = require("axios");
const cheerio = require("cheerio");

const db = require("./modals");

const PORT = 3000;

const app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoose-scraper";

// mongoose.connect("mongodb://localhost/mongoose-scraper", { useNewUrlParser: true });

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

app.get("/scrape", function (req, res) {

    axios.get("https://www.nytimes.com/").then(function (response) {

        var $ = cheerio.load(response.data);

        var result = [];

        $("article").each(function (i, element) {
            var title = $(element).children().text()
            // var summary = $(element).find("ul");
            var link = $(element).find("a").attr("href");

            result.push({
                title: title,
                //summary: summary,
                link: link
            });

            db.Article.create(result)
                .then(function (dbArticle) {
                    console.log("_________________")
                    console.log(dbArticle);
                    console.log("_________________")
                })
                .catch(function (err) {

                    console.log(err);
                });
        });
        console.log("*******************")
        console.log(result);
        console.log("*******************")
        res.send("Scrape Complete");
    });
});

app.get("/articles", function (req, res) {

    db.Article.find({})
        .then(function (dbArticle) {

            res.send(dbArticle);
        })
        .catch(function (err) {

            res.send(err);
        });
});

app.get("/articles/:id", function (req, res) {

    db.Article.findOne({ _id: req.params.id })
        .populate("Note")
        .then(function (dbArticle) {

            res.send(dbArticle);
        })
        .catch(function (err) {

            res.send(err);
        });
});

app.post("/articles/:id", function (req, res) {
    console.log(req.body);
    db.Note.create(req.body)
        .then(function (dbNote) {

            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function(dbArticle) {

            res.send(dbArticle)
        })
        .catch(function(err) {

            res.send(err);
        });
});

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!!!")
})