const express = require('express');
const { createPost,
    getAllpost,
    getPost,
    updatePost,
    deletePost,
    LikePost,
    UnlikePost,
    createComment,
    deleteComment,
    postPhotoUpload
} = require('../controllers/posts');


const Post = require('../models/Post');


const router = express.Router();
const { protect } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');


router.post('/createpost', protect, createPost);
router.get('/getallpost', advancedResults(Post), protect, getAllpost);
router.get('/:id', protect, getPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/like/:id', protect, LikePost);
router.post('/unlike/:id', protect, UnlikePost);
router.post('/comment/:id', protect, createComment);
router.delete('/comment/:id/:comment_id', protect, deleteComment);
router.put('/:id/photo', protect, postPhotoUpload);






module.exports = router;