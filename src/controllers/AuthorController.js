const jwt = require("jsonwebtoken");
const authorModel = require("../models/authorModel")

//validation functions :---
const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValidEmail = function (email) {
    return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
}
const isValidPassword = function (password) {
    return (/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/.test(password))
}
const regexValidator = function (value) {
    let regex = /^[a-zA-Z]+([\s][a-zA-Z]+)*$/
    return regex.test(value)
}
const isValidTitle = function (title) {
    return ['Mr', 'Mrs', 'Miss'].indexOf(title) !== -1
}

//CreateAuthor
const createAuthor = async function (req, res) {
    try {
        let requestBody = req.body
        if (!isValidRequestBody(requestBody)) return res.status(400).send({ status: false, msg: 'invalid request parameters.Please provid author details ' })
        const { fname, lname, title, email, password } = requestBody;

        if (!isValid(fname)) return res.status(400).send({ status: false, msg: 'first name is required' })
        if (!regexValidator(fname)) return res.status(400).send({ status: false, msg: 'first name should be a valid fname' })

        if (!isValid(lname)) return res.status(400).send({ status: false, msg: 'last name is required' })
        if (!regexValidator(lname)) return res.status(400).send({ status: false, msg: 'last name should be a valid lname' })

        if (!isValid(title)) return res.status(400).send({ status: false, msg: 'title is required' })
        if (!isValidTitle(title)) return res.status(400).send({ status: false, msg: 'title should be among Mr,Mrs,Miss' })

        if (!isValid(email)) return res.status(400).send({ status: false, msg: 'email is required' })
        if (!isValidEmail(email)) return res.status(400).send({ status: false, msg: 'email should be a valid email address' })


        if (!isValid(password)) return res.status(400).send({ status: false, msg: 'password is required' })
        if (!isValidPassword(password)) return res.status(400).send({ status: false, msg: 'password must be have  one uppercase, one lowercase and one special character or number' })
        let Data = await authorModel.findOne({ email: email })
        if (Data) return res.status(400).send({ status: false, msg: 'Duplicate email' })

        //now create the author:-  
        let savedData = await authorModel.create(requestBody)
        res.status(201).send({ msg: savedData })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

//login part here:-----
const loginAuthor = async function (req, res) {
    try {
        let reqBody = req.body
        let userId = req.body.email
        let password = req.body.password
        if (!isValidRequestBody(reqBody)) return res.status(400).send({ status: false, msg: "enter some data in body" })
        if (!isValid(userId)) return res.status(400).send({ status: false, msg: "email is required" })
        if (!isValid(password)) return res.status(400).send({ status: false, msg: "password is required" })

        if (!isValidEmail(userId)) return res.status(400).send({ status: false, msg: "Provide Valid Email-Id" })
        let author = await authorModel.findOne({ userId, password });
        if (!author) return res.status(400).send({ status: false, msg: "UserId and Password Not Correct" })

        let token = jwt.sign({
            authorId: author._id.toString(),
            Group: "47",
        },
            "tokensecretKey"
        );

        res.header("x-api-key", token)
        res.status(200).send({ status: true, msg: "token created successfully", token })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


module.exports.createAuthor = createAuthor
module.exports.loginAuthor = loginAuthor

