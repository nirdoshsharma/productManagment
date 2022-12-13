let jwt = require('jsonwebtoken')
let mongoose = require('mongoose')
const blogModel = require("../models/blogModel")

//authentication part here:--
const authentication = async function (req, res, next) {
    try {
        token = req.headers['x-api-key']
        if (!token) { return res.status(400).send({ status: false, message: "Token is missing" }) }
        decodedToken = jwt.verify(token, "tokensecretKey", (err, decode) => {
            if (err) {
                return res.status(400).send({ status: false, message: "Token is not correct!" })
            } (decode == true)
            next()
        })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
//authorization part here:--
const authorization = async function (req, res, next) {
    try {
        let token = req.headers['x-api-key']
        if (!token) return res.status(403).send({ status: false, msg: "token must be present in header" })

        let ObjectID = mongoose.Types.ObjectId
        let decodedToken = jwt.verify(token, "tokensecretKey")
        if (req.query.authorId) {
            let authorId = req.query.authorId
            if (!ObjectID.isValid(authorId)) { return res.status(400).send({ status: false, message: "Not a valid AuthorID" }) }
            if (authorId != decodedToken.authorId) {
                return res.status(403).send({ status: false, message: "You are not a authorized user" })
            }
            return next()
        }
        if (req.params.blogId) {
            let blogId = req.params.blogId
            if (!ObjectID.isValid(blogId)) { return res.status(400).send({ status: false, message: "Not a valid BlogID" }) }
            let check = await blogModel.findById(blogId)
            if (!check) { return res.status(404).send({ status: false, message: "No such blog exists" }) }
            if (check.authorId != decodedToken.authorId) {
                return res.status(403).send({ status: false, message: "You are not a authorized user" })
            }
            return next()
        }
        else {
            return res.status(403).send({ status: false, message: "BlogID is mandatory" })
        }
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
// //authorization for //deleteBlogsByFilter api
const authorization1 = async function (req, res, next) {
    try {
        let token = req.headers['x-api-key']//token
        let query = req.query//allQueries
        if (!query) return res.status(403).send({ status: false, msg: "Query must be present in Param" })
        if (!token) return res.status(403).send({ status: false, msg: "token must be present in header" })

        let decodedToken = jwt.verify(token, "tokensecretKey")
        const blog = await blogModel.findOne({ ...query })
        if (!blog) return res.status(404).send({ status: false, msg: "blog is not found" })

        let headerId = decodedToken.authorId.toString() //headerid
        let blogId = blog.authorId.toString()//blogId
        console.log("headerId--", headerId)
        console.log("decodedId---", blogId)
        if (headerId != blogId) return res.status(403).send({ status: false, msg: "You Are Not Authorized" })
        next()
        return
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports.authentication = authentication
module.exports.authorization = authorization
module.exports.authorization1 = authorization1