// import jwt from "jsonwebtoken"


export const autenticationToken = (req,res,next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]


    if (!token){
        return res.sendStatus(401) //authorised
    }

    const key = "mysecretkey"
    JsonWebTokenError.verify(token, secretKey, (err, user)=>{
        if(err) return res.sendStatus(403) //forbidden
        req.user = user
        next()
    })
}
