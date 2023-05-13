const http = require('http');
const express = require("express");
const app = express();
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') });

const databaseAndCollection = { db: "CMSC335_DB", collection: "riderCollection" };
const uri = `mongodb+srv://lstenger7:Skateboard23$@cluster0.kroh5pn.mongodb.net/?retryWrites=true&w=majority`;

const MongoClient = require("mongodb").MongoClient;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// PORT STUFF
const user_input_port = process.argv[2];

function isValidSeat(seatNumber) {
    const wlSeats = ['WL1', 'WL2', 'wl1', 'wl2'];
    
    if (wlSeats.includes(seatNumber)) {
      return true;
    } else {
      const num = parseInt(seatNumber, 10);
  
      if (!isNaN(num) && num > 0 && num < 20) {
        return true;
      } else {
        return false;
      }
    }
  }
  

// starting server on users inputted port number
app.listen(user_input_port);
console.log(`Web server started and running at http://localhost:${user_input_port}`);
process.stdin.setEncoding("utf8");

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "templates")));

// Replace this line with the one below
// app.use(bodyParser.urlencoded({extended: false}));
app.use(express.urlencoded({ extended: false }));

app.get("/", (request, response) => {
  response.render("index");
});

app.get("/seatSelector", async (request, response) => {
  const collection = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection);
  const availableSeats = await getAvailableSeats(collection);
  response.render("seatSelector", {availableSeats: availableSeats});
  });
  
app.get("/fillPayInfo", (request, response) => {
    response.render("fillPayInfo");
  });
  
client.connect((err) => {
  if (err) {
    process.exit(1);
  }
});

app.post("/submitSeat", async (req, res) => {

  const seatNumber = req.body.seatNumber.toString();
  const name = req.body.name;
  const uid = req.body.uid;

  const collection = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection);
  const availableSeats = await getAvailableSeats(collection);

  // Validate seat number
  if (!isValidSeat(seatNumber)) {
    res.render("seatError", { availableSeats });
    return;
  }

  try {
    const result = await collection.findOne({ seatNumber: seatNumber });
    const duplicate = await collection.findOne({ uid: uid });
  
    if (result || duplicate) {
      res.render("seatError", { availableSeats });

    } else {
      await collection.insertOne({ name: name, seatNumber: seatNumber, uid: uid });
      res.render("confirmation", { name: name, seatNumber: seatNumber, uid: uid  });
    }
  } catch (err) {
    res.status(500).send("Error searching for or inserting seat number");
  }
  
});
  

app.post("/submitPayment", async (req, res) => {
    const collection = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection);
    let ticket = await collection.findOne({ uid: req.body.uid });
    //if there is no matching uid in the database 
    if (!ticket) {
      //print to screen the word error
      res.send("There is no matching UID in the database.");
      
    }
    
    else {
      try {
        res.render("confirmation", { name: ticket.name, seatNumber: ticket.seatNumber, uid: ticket.uid });
      } catch (err) {
        console.log("Error rendering paymentConfirmation view:", err);
        res.status(500).send("An error occurred while rendering the payment confirmation.");
      }
      
    }

    });
  

  
async function getAvailableSeats(collection) {
    const takenSeats = await collection.find({}).toArray();
    const takenSeatNumbers = takenSeats.map(seat => seat.seatNumber);
    const allSeats = Array.from({ length: 19 }, (_, i) => i + 1).map(String).concat(['WL1', 'WL2']);
    return allSeats.filter(seat => !takenSeatNumbers.includes(seat));
}


  
  
/* GETTING USER INPUT FOR SERVER PORT */
const user_prompt = "Stop to shutdown the server: ";
process.stdout.write(user_prompt);
process.stdin.on("readable", function () {
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();

        if (command === "stop") {
            process.stdout.write(`Shutting down the server\n`);
            process.exit(1);
        }

        process.stdout.write(user_prompt);
        process.stdin.resume();
    }

});
