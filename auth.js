import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

import path from "path"
import { fileURLToPath } from "url"
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../.env") })

const app = express()
const PORT = 3000
app.use(express.json())

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export const autenticationToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]


    if (!token) {
        return res.sendStatus(401) //authorised
    }

    const key = "mysecretkey"
    jwt.verify(token, key, (err, user) => {
        if (err) return res.sendStatus(403) //forbidden
        req.user = user
        next()
    })
}
//registration
app.post('/register', async (req, res) => {
    //getting the data
    const { name: userName, email, password } = req.body
    console.log({ userName, email, password })
    //processing the data
    if (!userName || !email || !password) {
        return res.status(400).json({ message: "please provide what is missing", success: false })
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        console.log(`hashed password is ${hashedPassword}`)

        const { data, error } = await supabase
            .from('users')
            .insert([
                { name: userName, email: email, password: hashedPassword }
            ])
            .select()

        if (error) {
            console.error(error)
            // Check for duplicate key error (code 23505 is common for unique constraint violation in Postgres)
            if (error.code === '23505') {
                return res.status(409).json({ message: "User with this email already exists", success: false })
            }
            return res.status(500).json({ message: "Error creating user", success: false, error: error.message })
        }

        const user = data[0]
        res.status(200).json({ message: "User successfully created✅", user: user })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Server error during registration", success: false })
    }
})


app.post("/login", async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ msg: "input all fileds", succes: false })
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        if (error || !user) {
            console.log("User not found or error:", error)
            return res.status(404).json({ message: "user not found ........" })
        }

        console.log(`user is ${JSON.stringify(user)}`)
        const comparePassword = await bcrypt.compare(password, user.password)
        console.log(`compare password is ${comparePassword}`)

        if (comparePassword) {
            // res.status(201).json({message:"user is authorised"})
            const payload = {
                id: user.id,
                email: user.email
            }
            //secret key
            const key = "mysecretkey"
            //sign the user or give user a token
            const token = jwt.sign(payload, key, { expiresIn: "1h" })
            res.json({ message: "user authorised", token: token })
            // console.log(`token is ${token}`)
        }
        else {
            res.status(401).json({ message: "Invalid password" })
        }

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Server error during login", success: false })
    }
})

app.get("/dashboard", autenticationToken, (req, res) => {
    console.log("you can access this route")
    res.json({ message: `welcome to the dashboard, ${req.user}` })
})






app.listen(PORT, () => {
    console.log(`app running on http://localhost:${PORT} `);
});