const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")
const tokenBlacklistModel = require("../models/blacklistToken.model")


async function userRegisterController(req, res){
    const {email, password, name} = req.body

    const isExists = await userModel.findOne({
        email: email
    })

    if(isExists){
        return res.status(422).json({
            message: "User already exists with email",
            status: "failed"
        })
    }

    const user = await userModel.create({
        email, password, name
    })

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: "3d"})

    res.cookie("token", token);

    await emailService.sendRegistrationEmail(user.email, user.name);

    res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })


}

async function userLoginController(req, res){
    const {email, password} = req.body

    const user = await userModel.findOne({email}).select("+password")

    if(!user){
        return res.status(401).json({
            message: "email or password is invalid"
        })
    }

   const isValidPassword = await user.comparePassword(password)

   if(!isValidPassword){
    return res.status(401).json({
        message: "email or password is invalid"
    })
   }
//the below is being repeated from above userRegisterController, see if you can do something to DRY


const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: "3d"})

res.cookie("token", token);

await emailService.sendLoginEmail(user.email, user.name, {
    time: new Date().toLocaleString(),
    device: req.headers['user-agent'],
    location: req.ip
});


res.status(200).json({
    user: {
        _id: user._id,
        email: user.email,
        name: user.name
    },
    token
})


}

/**
 * - User logout controller
 * POST /api/auth/logout
 */

async function userLogoutController(req, res){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token){
        return res.status(200).json({
            message: "User is already logged out"
        })
    }

    await tokenBlacklistModel.create({
        token: token
    })
    res.clearCookie("token");
    res.status(200).json({
        message: "User logged out successfully"
    })
}



module.exports = {
    userRegisterController, userLoginController,
    userLogoutController
}