const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

const User = require('../models/User');
const Post = require('../models/Post');


// @desc      Register user
// @route     POST /api/v1/posts/createPost
// @access    Priavte 

exports.createPost = asyncHandler(async (req, res, next) => {

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
        return next(new ErrorResponse('No user exists with that ID', 404));
    }

    const newPost = new Post({
        text: req.body.text,
        name: user.name,
        user: req.user.id
    });

    const post = await newPost.save();

    res.status(200).json({ success: true, data: post });
});


// @route    GET api/posts
// @desc     Get all posts
// @access   Private
exports.getAllpost = asyncHandler(async (req, res, next) => {
    // const posts = await Post.find().sort({ date: -1 });
    res.status(200).json({ success: true, data: res.advancedResults });

});



// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Private
exports.getPost = asyncHandler(async (req, res, next) => {

    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new ErrorResponse('Post not found', 404));
    }
    res.status(200).json({ success: true, data: post });
});


// @desc      Delete post
// @route     DELETE /api/v1/posts/:id
// @access    Private
exports.deletePost = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(
            new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
        );
    }

    // Make sure user is post owner
    if (post.user.toString() !== req.user.id) {
        return next(
            new ErrorResponse(
                `User ${req.user.id} is not authorized to delete this post`,
                401
            )
        );
    }

    await post.remove();

    res.status(200).json({ success: true, data: {} });
});

// @desc      Update post
// @route     PUT /api/v1/posts/:id
// @access    Private
exports.updatePost = asyncHandler(async (req, res, next) => {
    let post = await Post.findById(req.params.id);

    if (!post) {
        return next(
            new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
        );
    }

    // Make sure user is post owner
    if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${req.user.id} is not authorized to update this post`,
                401
            )
        );
    }

    post = await Post.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: post });
});



// @route    PUT api/posts/like/:id
// @desc     Like a post
// @access   Private

exports.LikePost = asyncHandler(async (req, res, next) => {

    const post = await Post.findById(req.params.id);

    // Check if the post has already been liked
    if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
        return next(new ErrorResponse('Post already liked', 400));
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.status(200).json({ success: true, data: post.likes });

});


// @route    PUT api/posts/unlike/:id
// @desc     Like a post
// @access   Private

exports.UnlikePost = asyncHandler(async (req, res, next) => {

    const post = await Post.findById(req.params.id);

    // Checking if the post has already been liked
    if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
        return next(new ErrorResponse('Post has not yet been liked', 400));
    }

    // Get remove index
    const removeIndex = post.likes
        .map(like => like.user.toString())
        .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.status(200).json({ success: true, data: post.likes });

});


// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private


exports.createComment = asyncHandler(async (req, res, next) => {

    const user = await User.findById(req.user.id).select('-password');
    const post = await Post.findById(req.params.id);

    const newComment = {
        text: req.body.text,
        name: user.name,
        user: req.user.id
    };

    post.comments.unshift(newComment);

    await post.save();
    res.status(200).json({ success: true, data: post.comments });
});



// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Privateno

exports.deleteComment = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(
        comment => comment.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
        return next(new ErrorResponse('Comment does not exist', 404));
    }

    // Check user
    if (comment.user.toString() !== req.user.id) {
        return next(new ErrorResponse('User not authorized', 401));
    }

    // Get remove index
    const removeIndex = post.comments
        .map(comment => comment.id)
        .indexOf(req.params.comment_id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);
});



// @desc      Upload photo for post
// @route     PUT /api/v1/posts/:id/photo
// @access    Private

exports.postPhotoUpload = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(
            new ErrorResponse(`post not found with id of ${req.params.id}`, 404)
        );
    }

    // Make sure user is post owner
    if (post.user.toString() !== req.user.id) {
        return next(
            new ErrorResponse(
                `User ${req.user.id} is not authorized to update this post`,
                401
            )
        );
    }

    if (!req.files) {
        return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const file = req.files.file;
    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    // Check filesize
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
            new ErrorResponse(
                `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
                400
            )
        );
    }

    // Create custom filename
    file.name = `photo_${post._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.error(err);
            return next(new ErrorResponse(`Problem with file upload`, 500));
        }

        await Post.findByIdAndUpdate(req.params.id, { photo: file.name });

        res.status(200).json({
            success: true,
            data: file.name
        });
    });
});
