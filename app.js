//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//Create new Mongoose DB
mongoose.connect('mongodb+srv://admin-petrea:Test123@cluster0.zef4n.mongodb.net/todolistDB', {
  useUnifiedTopology: true, useNewUrlParser: true 
});

//Create Scema with name field
const itemsSchema = {
  name: String
};

//Create Mongoose Model
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Hello!  Make it a great day!"
});
const item2 = new Item({
  name: "You've got this! Keep your purpose in mind."
});
const item3 = new Item({
  name: "Journal"
});

const defaultItems = [item1, item2, item3];

//Creating new listSchema to list the various custom pages
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


mongoose.set('useFindAndModify', false);


app.get("/", function(req, res) {

  //Get the items from DB to use here
  //Note: Use {} to find all
  Item.find({}, function(err, foundItems) {
    //Check if "/" is empty.  Add defaultItems if it is.
    if (foundItems.length === 0) {
      //Insert the defaultItems array into the database
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("The default items have been successfully added to the database.");
        }
      });
      //This will rerun to check if there are items stored and move to else.
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }

  });

});

//Create dynamic routes for customListName
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  //Determine if the custom list exists or not

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);

      } else {
        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });

      }
    }
  });



});


app.post("/", function(req, res) {

  //This itemName is getting passed from my list.ejs
  const itemName = req.body.newItem;
  const listName = req.body.list;

  //Create a new Mongoose document to move the inputted form item to the array
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Checked Item successfully removed from DB.");
        res.redirect("/");
      }
    });
  } else {
    //Remove item from custom list
    List.findOneAndUpdate({name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err, foundList){
        if (!err){
          res.redirect("/" + listName);
        }
      });

  }


});




app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
