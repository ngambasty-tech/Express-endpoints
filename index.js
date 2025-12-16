import express from "express";
import { users } from "./db.js";

const app = express();
app.use(express.json())

const PORT = 3000;

//get request
app.get("/", (req, res) => {
  res.send({
    name: "Basty",
    age: "34",
    favClub: "team",
  });
});
app.patch('/users/:id', (req,res)=>{
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex((a) => a.id === userId);
  console.log(`the user id is: ${userId}`);
  console.log(`the user index is: ${userIndex}`);
  if(userIndex === -1){
    return res.status(404).json({message:"user not found"});
  }
  
  const patchedUser = {
    ...users[userIndex],
    ...req.body
  };
  users[userIndex] = patchedUser;
  res.status(200);
  res.json(patchedUser);
})

app.get("/users", (req, res) => {
  if (!users)
    return res
      .status(404)
      .json({ message: "no users found in the database", success: false });
  res.json(users);
});

//path parmeters>get user
app.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  // console.log(`the id is: ${id}`)
  const user = users.find((a) => a.id === id);
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }
  res.json(user);
});


app.post("/users", (req, res)=>{
    const { name, email } = req.body;
    if(!name || !email){
        return res.status(400).json({message:"no name or email", success:false});
    }
    const userData = {
    id: users.length + 2,
    name,
    email,
  };
  users.push(userData);
  res.json(users);
})

app.put("/users/:id", (req, res)=>{
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex((a) => a.id === id);
    if(userIndex === -1){
        return res.status(404).json({message:"user not found"});
    }

    const updatedUser = {
        id: id,
        ...req.body
    }
    users[userIndex] = updatedUser;
    res.json(updatedUser);
})

app.delete("/users/:id", (req, res)=>{
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex((a) => a.id === id);
    if(userIndex === -1){
        return res.status(404).json({message:"user not found"});
    }
    const deletedUser = users.splice(userIndex, 1);
    res.json({message:"user deleted successfully", deletedUser: deletedUser[0]});
})

app.listen(PORT, () => {
  console.log(`app running on http://localhost:${PORT}`);
});
