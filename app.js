//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

mongoose.connect("mongodb+srv://admin-bojan:bojan123@cluster0.3ca1q.mongodb.net/todolistDB", { useNewUrlParser: true,  useUnifiedTopology: true, useFindAndModify: false })

const itemsSchema = {
  name: String
};

// ITEM SCHEMA
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
    name: "Welcome to your todolist!"
});

const item2 = new Item ({
    name: "Hit the + button to add a new item."
});

const item3 = new Item ({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

// LIST SCHEMA
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        err ? console.log(err) : console.log("Succesfully inserted multiple items!");
      });
      res.redirect("/");
    } else {
      res.render('list', {listTitle: "Today", listItems: foundItems});
    }
  })
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect(`/${customListName}`)
      } else {
        // Show an existing list
        res.render("list", {listTitle: customListName, listItems: foundList.items})
      }
    } else {
      console.log(err);
    }
  })
})

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    console.log("Succesfully INSERTED item!");
    res.redirect("/");
  } else {
      List.findOne({name: listName}, function(err, foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect(`/${listName}`);
      })
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      err ? console.log(err) : console.log("Succesfully DELETED item!");
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      !err ? res.redirect(`/${listName}`) : console.log(err);
    });
  }
})

app.get("/about", function(req,res){
  res.render("about")
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
  console.log("Server has started succesfully.");
});
