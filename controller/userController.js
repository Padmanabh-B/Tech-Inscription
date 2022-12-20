const User = require("../models/User")
const Note = require("../models/Note")
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

// @desc Get All User
// @route Get /users
// @access private


const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()
    if (!users?.length) {
        return res.status(400).json({
            message: "No Users Found"
        })
    }
    res.json(users)
})

// @desc Create New User
// @route Post /users
// @access private

const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body;
    // Confirm Data
    if (!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({ message: "All Fields are Required" })
    }


    //check for duplicate
    const duplicate = await User.findOne({ username }).lean().exec()
    if (duplicate) {
        return res.status(409).json({
            message: "Duplicate username"
        })
    }

    //Hash Password
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds

    const userObject = { username, "password": hashedPwd, roles }

    //create and store new user

    const user = await User.create(userObject)

    if (user) {
        //created
        res.status(201).json({
            message: `New User ${username} created`
        })
    }
    else {
        res.status(201).json({
            message: "Invalid Data is Received"
        })
    }
})

// @desc Update a User
// @route patch /users
// @access private

const updateUser = asyncHandler(async (req, res) => {
    const { id, username, roles, active, password } = req.body;

    if (!id || !username || !password || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({ message: "All Fields are Required" })
    }


    const user = await User.findById(id).exec()
    if (!user) {
        return res.status(400).json({ message: "User Not Found" })
    }

    //check for duplicate
    const duplicate = await User.findOne({ username }).lean().exec()

    //Allow updates to the original user
    if (duplicate && duplicate?._id.toString !== id) {
        return res.status(409).json({
            message: "Duplicate Username"
        })
    }

    user.username = username;
    user.roles = roles;
    user.active = active

    if (password) {
        //hash password
        user.password = await bcrypt.hash(password, 10) // salt rounds
    }

    const updatedUser = await user.save()

    res.json({ message: `${updatedUser.username} Updated` })
})

// @desc Delete a User
// @route delete /users
// @access private

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "User ID Required" })
    }

    const notes = await Note.findOne({ user: id }).lean().exec()
    if (notes?.length) {
        return res.status(400).json({ message: "User has assigned notes" })
    }

    const user = await User.findById(id).exec()
    if (!user) {
        return res.status(400).json({ message: "User Not Found" })
    }

    const result = await user.deleteOne()
    const reply = `Username ${result.username} With ID ${result._id} deleted`

    res.json(reply)
})


module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser,
}