/**
 * AI对话历史控制器
 */

import { query, getClient } from '../config/database.js';

/**
 * 获取对话历史
 */
export const getDialogueHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const result = await query(
            `SELECT id, user_message, ai_response, created_at
             FROM dialogue_history
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get dialogue history error:', error);
        res.status(500).json({
            success: false,
            message: '获取对话历史失败'
        });
    }
};

/**
 * 保存对话记录
 */
export const saveDialogue = async (req, res) => {
    try {
        const userId = req.user.id;
        const { userMessage, aiResponse } = req.body;

        if (!userMessage || !aiResponse) {
            return res.status(400).json({
                success: false,
                message: '消息内容不能为空'
            });
        }

        const result = await query(
            `INSERT INTO dialogue_history (user_id, user_message, ai_response, created_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             RETURNING *`,
            [userId, userMessage, aiResponse]
        );

        res.json({
            success: true,
            message: '对话已保存',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Save dialogue error:', error);
        res.status(500).json({
            success: false,
            message: '保存对话失败'
        });
    }
};

/**
 * 删除对话记录
 */
export const deleteDialogue = async (req, res) => {
    try {
        const userId = req.user.id;
        const { dialogueId } = req.params;

        const result = await query(
            'DELETE FROM dialogue_history WHERE id = $1 AND user_id = $2 RETURNING id',
            [dialogueId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '对话记录不存在'
            });
        }

        res.json({
            success: true,
            message: '对话记录已删除'
        });
    } catch (error) {
        console.error('Delete dialogue error:', error);
        res.status(500).json({
            success: false,
            message: '删除对话记录失败'
        });
    }
};

/**
 * 清空对话历史
 */
export const clearDialogueHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        await query(
            'DELETE FROM dialogue_history WHERE user_id = $1',
            [userId]
        );

        res.json({
            success: true,
            message: '对话历史已清空'
        });
    } catch (error) {
        console.error('Clear dialogue history error:', error);
        res.status(500).json({
            success: false,
            message: '清空对话历史失败'
        });
    }
};
