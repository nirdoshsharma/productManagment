const mongoose = require('mongoose')
const blogModel = require("../models/blogModel")
const authorModel = require("../models/authorModel")

//validation functions :---
const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.length === 0) return false
    return true;
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

//Createblogsdata//post
const createBlogs = async function (req, res) {
    try {
        let requestBody = req.body
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. please provide blog details' })

        }
        const { title, body, authorId, tags, category, subcategory, isPublished } = requestBody;

        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: 'Blog title is required' })

        }
        if (!isValid(body)) {
            return res.status(400).send({ status: false, message: 'blog body  is required' })

        }

        if (!isValid(authorId)) {
            return res.status(400).send({ status: false, message: 'author id  is required' })
        }
        if (!isValidObjectId(authorId)) {
            return res.status(400).send({ status: false, message: `${authorId}is not a valid author id` })
        }
        if (!isValid(category)) {
            return res.status(400).send({ status: false, message: 'Blog category is required' })

        }
        let checkAuthor = await authorModel.findById(authorId)
        if (!checkAuthor) {
            return res.status(400).send({ status: false, msg: "please provide valid author id" })
        }
        //data creation
        let savedData = await blogModel.create(requestBody)
        res.status(201).send({ msg: savedData }) //successfull blog creation
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

}
//Get Blog Data-- (which are not deleted and published) :---
const getBlogsData = async function (req, res) {
    try {
        const filterQuery = { isDeleted: false, isPublished: true }
        const queryParams = req.query
        if (isValidRequestBody(queryParams)) {
            const { authorId, category, tags, subcategory } = queryParams

            if (isValid(authorId) && isValidObjectId(authorId)) {
                filterQuery.authorId = authorId
            }
            if (isValid(category)) {
                filterQuery.category = category
            }

            if (isValid(tags)) {
                filterQuery.tags = tags
            }
            if (isValid(subcategory)) {
                filterQuery.subcategory = subcategory
            }
        }
        const Blogs = await blogModel.find(filterQuery)
        if (Array.isArray(Blogs) && Blogs.length === 0) {
            res.status(404).send({ status: false, msg: "no blogs found" })
            return
        }
        res.status(200).send({ status: true, message: 'Blogs list', data: Blogs })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
//update the blogs  data 
const updateBlog = async function (req, res) {
    try {
        const blogId = req.params.blogId;
        if (!isValidObjectId(blogId)) {
            return res.status(400).send({ status: false, message: "Invalid blog id" })
        }
        const reqBody = req.body;
        const { title, body, tags, subcategory } = reqBody;

        let isUpdateRequired = false
        const updateQuery = {
            $set: {},
            $push: {}
        };

        if (isValid(title)) {
            updateQuery['$set']['title'] = title
            isUpdateRequired = true
        }

        if (isValid(body)) {
            updateQuery['$set']['body'] = body
            isUpdateRequired = true
        }

        if (isValid(tags)) {
            updateQuery['$push']['tags'] = tags
            isUpdateRequired = true
        }

        if (isValid(subcategory)) {
            updateQuery['$push']['subcategory'] = subcategory
            isUpdateRequired = true
        }

        if (isUpdateRequired) {
            updateQuery['$set']['isPublished'] = true
            updateQuery['$set']['publishedAt'] = new Date()
        }

        const updatedBlog = await blogModel.findOneAndUpdate(
            {
                _id: blogId,
                isDeleted: false
            },
            updateQuery,
            { new: true },
        )

        if (!updatedBlog) {
            return res.status(400).send({ status: false, message: "Blog not found" })
        }

        return res.status(200).send({ status: true, message: 'Blog Updated Successfully', data: updatedBlog })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

// DELETE /blogs/:blogId (delete blogs by path param):----
const deleteBlogs = async function (req, res) {
    try {
        const requestBody = req.body
        const params = req.params
        const blogId = params.blogId
        if (!isValidObjectId(blogId)) {
            return res.status(400).send({ status: false, message: "Invalid blog id" })
        }
        const blog = await blogModel.findOne({ _id: blogId, isDeleted: false })
        if (!blog) {
            return res.status(404).send({ status: false, message: 'blog does not found ' })
        }
        //for blog delete
        await blogModel.findOneAndUpdate({ _id: blogId }, { $set: { isDeleted: true, deletedAt: new Date() }, new: true })
        res.status(200).send({ status: true, msg: 'Blog deleted succesfully' })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

}

// DELETE /blogs?queryParams (delete blogs by query param):---
const deleteBlogsByFilter = async function (req, res) {
    try {
        let obj = req.query
        let { authorId, category, tags, subcategory, isPublished } = obj
        let isValid = mongoose.Types.ObjectId.isValid(authorId)
        if (Object.keys(obj).length === 0) {
            return res.status(400).send({ status: false, message: "Please give some parameters to check" })
        }
        if (authorId) {
            if (!isValid) {
                return res.status(400).send({ status: false, message: "Not a valid Author ID" })
            }
        }
        let filter = { isDeleted: false, isPublished: false }
        if (authorId != null) { filter.authorId = authorId }
        if (category != null) { filter.category = category }
        if (tags != null) { filter.tags = { $in: [tags] } }
        if (subcategory != null) { filter.subcategory = { $in: [subcategory] } }
        // if (isPublished != null) { filter.isPublished = isPublished }
        let filtered = await blogModel.find(filter)
        if (filtered.length == 0) {
            return res.status(404).send({ status: false, message: "No such data found" })
        } else {

            let deletedData = await blogModel.updateMany(filter, { isDeleted: true, deletedAt: new Date() }, { upsert: true, new: true })
            let deletedAt = new Date()
            return res.status(200).send({ status: true, msg: "data deleted successfully" })
        }
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


module.exports.createBlogs = createBlogs
module.exports.getBlogsData = getBlogsData
module.exports.updateBlog = updateBlog
module.exports.deleteBlogs = deleteBlogs
module.exports.deleteBlogsByFilter = deleteBlogsByFilter
