import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/users.js';

const formatUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  followers: user.followers,
  following: user.following,
  followersCount: user.followers?.length || 0,
  followingCount: user.following?.length || 0
});

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Заполните все поля' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName: fullName || '',
      username,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: 'Пользователь зарегистрирован',
      user: formatUser(newUser)
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Введите email и пароль' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Вход выполнен успешно',
      token,
      user: formatUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.status(200).json({
      ...user.toObject(),
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    const { fullName, username, bio, avatar } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (fullName !== undefined) {
      if (typeof fullName !== 'string') {
        return res.status(400).json({ message: 'fullName должен быть строкой' });
      }

      user.fullName = fullName.trim();
    }

    if (username !== undefined) {
      if (typeof username !== 'string') {
        return res.status(400).json({ message: 'Username должен быть строкой' });
      }

      const trimmedUsername = username.trim();

      if (!trimmedUsername) {
        return res.status(400).json({ message: 'Username не может быть пустым' });
      }

      if (trimmedUsername !== user.username) {
        const existingUsername = await User.findOne({ username: trimmedUsername });

        if (existingUsername) {
          return res.status(400).json({ message: 'Username уже занят' });
        }
      }

      user.username = trimmedUsername;
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return res.status(400).json({ message: 'bio должен быть строкой' });
      }

      user.bio = bio;
    }

    if (avatar !== undefined) {
      if (typeof avatar !== 'string') {
        return res.status(400).json({ message: 'avatar должен быть строкой' });
      }

      const isValidAvatar =
        avatar === '' || avatar.startsWith('data:image/');

      if (!isValidAvatar) {
        return res.status(400).json({
          message: 'avatar должен быть base64-строкой формата data:image/...'
        });
      }

      user.avatar = avatar;
    }

    await user.save();

    res.status(200).json({
      message: 'Профиль обновлён',
      user: formatUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

export const searchUsersByUsername = async (req, res) => {
  try {
    const query = req.query.query?.trim() || '';

    if (!query) {
      return res.status(200).json([]);
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const users = await User.find({
      username: { $regex: escapedQuery, $options: 'i' },
      _id: { $ne: req.userId }
    })
      .select('-password')
      .limit(10);

    const result = users.map((user) => ({
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при поиске пользователей',
      error: error.message
    });
  }
};

export const toggleFollowUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Некорректный id пользователя' });
    }

    if (id === req.userId) {
      return res.status(400).json({ message: 'Нельзя подписаться на самого себя' });
    }

    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(id);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const alreadyFollowing = currentUser.following.some(
      (userId) => userId.toString() === id
    );

    if (alreadyFollowing) {
      currentUser.following = currentUser.following.filter(
        (userId) => userId.toString() !== id
      );

      targetUser.followers = targetUser.followers.filter(
        (userId) => userId.toString() !== req.userId
      );
    } else {
      currentUser.following.push(id);
      targetUser.followers.push(req.userId);
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      message: alreadyFollowing ? 'Подписка удалена' : 'Подписка оформлена',
      currentUser: formatUser(currentUser),
      targetUser: formatUser(targetUser),
      isFollowing: !alreadyFollowing
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при обработке подписки',
      error: error.message
    });
  }
};

export const getUserProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Некорректный id пользователя' });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const isFollowing = user.followers.some(
      (followerId) => followerId.toString() === req.userId
    );

    res.status(200).json({
      ...user.toObject(),
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      isFollowing
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при получении профиля пользователя',
      error: error.message
    });
  }
};