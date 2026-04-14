import mongoose from 'mongoose';
import Post from '../models/Post.js';

export const createPost = async (req, res) => {
  try {
    const { image, caption } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Картинка обязательна' });
    }

    if (typeof image !== 'string') {
      return res.status(400).json({ message: 'image должен быть строкой' });
    }

    if (!image.startsWith('data:image/')) {
      return res.status(400).json({
        message: 'image должен быть base64-строкой формата data:image/...'
      });
    }

    if (caption !== undefined && typeof caption !== 'string') {
      return res.status(400).json({ message: 'caption должен быть строкой' });
    }

    const newPost = await Post.create({
      author: req.userId,
      image,
      caption: caption || ''
    });

    const populatedPost = await Post.findById(newPost._id)
      .populate('author', 'username email avatar bio')
      .populate('likes', 'username email avatar')
      .populate('comments.author', 'username email avatar');

    res.status(201).json({
      message: 'Пост создан',
      post: {
        ...populatedPost.toObject(),
        likesCount: populatedPost.likes.length,
        commentsCount: populatedPost.comments.length
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при создании поста',
      error: error.message
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username email avatar bio')
      .populate('likes', 'username email avatar')
      .populate('comments.author', 'username email avatar')
      .sort({ createdAt: -1 });

    const postsWithCounts = posts.map((post) => ({
      ...post.toObject(),
      likesCount: post.likes.length,
      commentsCount: post.comments.length
    }));

    res.status(200).json(postsWithCounts);
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при получении постов',
      error: error.message
    });
  }
};

export const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.userId })
      .populate('author', 'username email avatar bio')
      .populate('likes', 'username email avatar')
      .populate('comments.author', 'username email avatar')
      .sort({ createdAt: -1 });

    const postsWithCounts = posts.map((post) => ({
      ...post.toObject(),
      likesCount: post.likes.length,
      commentsCount: post.comments.length
    }));

    res.status(200).json(postsWithCounts);
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при получении ваших постов',
      error: error.message
    });
  }
};

export const getPostsByUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Некорректный id пользователя' });
    }

    const posts = await Post.find({ author: id })
      .populate('author', 'username email avatar bio')
      .populate('likes', 'username email avatar')
      .populate('comments.author', 'username email avatar')
      .sort({ createdAt: -1 });

    const postsWithCounts = posts.map((post) => ({
      ...post.toObject(),
      likesCount: post.likes.length,
      commentsCount: post.comments.length
    }));

    res.status(200).json(postsWithCounts);
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при получении постов пользователя',
      error: error.message
    });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { image, caption } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Некорректный id поста' });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет доступа к редактированию этого поста' });
    }

    if (image !== undefined) {
      if (typeof image !== 'string') {
        return res.status(400).json({ message: 'image должен быть строкой' });
      }

      if (!image.startsWith('data:image/')) {
        return res.status(400).json({
          message: 'image должен быть base64-строкой формата data:image/...'
        });
      }

      post.image = image;
    }

    if (caption !== undefined) {
      if (typeof caption !== 'string') {
        return res.status(400).json({ message: 'caption должен быть строкой' });
      }

      post.caption = caption;
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'username email avatar bio')
      .populate('likes', 'username email avatar')
      .populate('comments.author', 'username email avatar');

    res.status(200).json({
      message: 'Пост обновлён',
      post: {
        ...updatedPost.toObject(),
        likesCount: updatedPost.likes.length,
        commentsCount: updatedPost.comments.length
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при обновлении поста',
      error: error.message
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Некорректный id поста' });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет доступа к удалению этого поста' });
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({ message: 'Пост удалён' });
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при удалении поста',
      error: error.message
    });
  }
};

export const toggleLikePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Некорректный id поста' });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }

    const alreadyLiked = post.likes.some(
      (userId) => userId.toString() === req.userId
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (userId) => userId.toString() !== req.userId
      );
    } else {
      post.likes.push(req.userId);
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'username email avatar bio')
      .populate('likes', 'username email avatar')
      .populate('comments.author', 'username email avatar');

    res.status(200).json({
      message: alreadyLiked ? 'Лайк убран' : 'Лайк поставлен',
      post: {
        ...updatedPost.toObject(),
        likesCount: updatedPost.likes.length,
        commentsCount: updatedPost.comments.length,
        isLikedByMe: !alreadyLiked
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при обработке лайка',
      error: error.message
    });
  }
};

export const addCommentToPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Некорректный id поста' });
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'Текст комментария обязателен' });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }

    post.comments.push({
      author: req.userId,
      text: text.trim()
    });

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'username email avatar bio')
      .populate('likes', 'username email avatar')
      .populate('comments.author', 'username email avatar');

    res.status(201).json({
      message: 'Комментарий добавлен',
      post: {
        ...updatedPost.toObject(),
        likesCount: updatedPost.likes.length,
        commentsCount: updatedPost.comments.length
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при добавлении комментария',
      error: error.message
    });
  }
};

export const deleteCommentFromPost = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Некорректный id поста' });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'Некорректный id комментария' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Комментарий не найден' });
    }

    const isCommentAuthor = comment.author.toString() === req.userId;
    const isPostAuthor = post.author.toString() === req.userId;

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({
        message: 'Нет доступа к удалению комментария'
      });
    }

    post.comments.pull(commentId);
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'username email avatar bio')
      .populate('likes', 'username email avatar')
      .populate('comments.author', 'username email avatar');

    res.status(200).json({
      message: 'Комментарий удалён',
      post: {
        ...updatedPost.toObject(),
        likesCount: updatedPost.likes.length,
        commentsCount: updatedPost.comments.length
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при удалении комментария',
      error: error.message
    });
  }
};