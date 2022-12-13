const express = require('express');
const router = express.Router();

const authorController = require('../controllers/authorController')
const blogController = require('../controllers/blogController')
const mid = require('../middleware/mid1')

//author apis:-
router.post('/authors', authorController.createAuthor)//createAuthors 

//blog apis:-
router.post("/blogs", mid.authentication, blogController.createBlogs)//createBlogs
router.put("/blogs/:blogId", mid.authorization, blogController.updateBlog)//updateBlog
router.delete("/blogs/:blogId", mid.authorization, blogController.deleteBlogs)//deleteBlogs
router.delete("/blogs", mid.authorization1, blogController.deleteBlogsByFilter)//deleteBlogsByFilter


//login api:-
router.post("/login", authorController.loginAuthor)//login author

//get apis:-
router.get("/blogs", mid.authentication, blogController.getBlogsData)//get Blogs

module.exports = router;