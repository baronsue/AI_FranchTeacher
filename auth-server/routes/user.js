const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getCourseProgress,
    saveCourseProgress,
    getExercises,
    saveExercise,
    getPoints,
    addPoints,
    getPointsHistory,
    getBadges,
    addBadge,
    getCheckins,
    checkin,
    getMistakes,
    addMistake,
    markMasteredMistake,
    getStats,
    updateStats,
    getDialogueHistory,
    saveDialogue,
    getLeaderboard
} = require('../controllers/userController');

// 所有路由都需要认证
router.use(authenticateToken);

// 课程进度
router.get('/progress', getCourseProgress);
router.get('/progress/:courseId', getCourseProgress);
router.post('/progress', saveCourseProgress);

// 练习
router.get('/exercises', getExercises);
router.get('/exercises/:exerciseId', getExercises);
router.post('/exercises', saveExercise);

// 积分
router.get('/points', getPoints);
router.post('/points', addPoints);
router.get('/points/history', getPointsHistory);

// 徽章
router.get('/badges', getBadges);
router.post('/badges', addBadge);

// 打卡
router.get('/checkins', getCheckins);
router.post('/checkins', checkin);

// 错题本
router.get('/mistakes', getMistakes);
router.post('/mistakes', addMistake);
router.patch('/mistakes/:id/mastered', markMasteredMistake);

// 学习统计
router.get('/stats', getStats);
router.post('/stats', updateStats);

// 对话历史
router.get('/dialogue', getDialogueHistory);
router.post('/dialogue', saveDialogue);

// 排行榜
router.get('/leaderboard', getLeaderboard);

module.exports = router;
