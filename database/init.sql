-- AI FranchTeacher 数据库初始化脚本
-- 使用 PostgreSQL 14+

-- 创建数据库（在pgAdmin中手动创建，或使用此命令）
-- CREATE DATABASE ai_franchteacher;

-- 连接到数据库后执行以下语句

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar VARCHAR(255) DEFAULT '🎓',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    is_demo BOOLEAN NOT NULL DEFAULT false
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_demo_cleanup ON users(is_demo, created_at);

-- ============================================
-- 2. 课程进度表
-- ============================================
CREATE TABLE IF NOT EXISTS user_course_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id VARCHAR(100) NOT NULL,
    progress JSONB DEFAULT '{}'::jsonb,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX idx_course_progress_user ON user_course_progress(user_id);
CREATE INDEX idx_course_progress_course ON user_course_progress(course_id);

-- ============================================
-- 3. 练习答案表
-- ============================================
CREATE TABLE IF NOT EXISTS user_exercises (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id VARCHAR(100) NOT NULL,
    answers JSONB DEFAULT '{}'::jsonb,
    score INTEGER,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, exercise_id)
);

CREATE INDEX idx_exercises_user ON user_exercises(user_id);
CREATE INDEX idx_exercises_completed ON user_exercises(user_id, completed);

-- ============================================
-- 4. 积分系统表
-- ============================================
CREATE TABLE IF NOT EXISTS user_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    today_points INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 积分历史记录表
CREATE TABLE IF NOT EXISTS user_points_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason VARCHAR(255),
    activity_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_points_history_user ON user_points_history(user_id);
CREATE INDEX idx_points_history_date ON user_points_history(user_id, created_at DESC);

-- ============================================
-- 5. 徽章表
-- ============================================
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(100) NOT NULL,
    badge_name VARCHAR(100),
    badge_icon VARCHAR(50),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_badges_user ON user_badges(user_id);

-- ============================================
-- 6. 打卡记录表
-- ============================================
CREATE TABLE IF NOT EXISTS user_checkins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL,
    current_streak INTEGER DEFAULT 1,
    max_streak INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, checkin_date)
);

CREATE INDEX idx_checkins_user ON user_checkins(user_id);
CREATE INDEX idx_checkins_date ON user_checkins(user_id, checkin_date DESC);

-- ============================================
-- 7. 错题本表
-- ============================================
CREATE TABLE IF NOT EXISTS user_mistakes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id VARCHAR(100),
    question_text TEXT,
    user_answer TEXT,
    correct_answer TEXT,
    mistake_type VARCHAR(50),
    review_count INTEGER DEFAULT 0,
    mastered BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_reviewed TIMESTAMP
);

CREATE INDEX idx_mistakes_user ON user_mistakes(user_id);
CREATE INDEX idx_mistakes_mastered ON user_mistakes(user_id, mastered);

-- ============================================
-- 8. 学习统计表
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_study_time INTEGER DEFAULT 0, -- 总学习时间（分钟）
    words_learned INTEGER DEFAULT 0,
    courses_completed INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    dialogues_completed INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_study_date DATE,
    stats_data JSONB DEFAULT '{}'::jsonb, -- 扩展统计数据
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_stats_user ON user_stats(user_id);

-- ============================================
-- 9. 对话历史表
-- ============================================
CREATE TABLE IF NOT EXISTS dialogue_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' 或 'assistant'
    content TEXT NOT NULL,
    scenario VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dialogue_user ON dialogue_history(user_id);
CREATE INDEX idx_dialogue_created ON dialogue_history(user_id, created_at DESC);

-- ============================================
-- 10. 会话管理表（可选，如果需要服务器端会话）
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    refresh_token VARCHAR(500),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);

-- ============================================
-- 触发器：自动更新 updated_at 时间戳
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON user_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 初始化视图：用户排行榜
-- ============================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
    u.id,
    u.username,
    u.display_name,
    u.avatar,
    COALESCE(p.total_points, 0) as total_points,
    COALESCE(s.words_learned, 0) as words_learned,
    COALESCE(s.current_streak, 0) as current_streak,
    ROW_NUMBER() OVER (ORDER BY COALESCE(p.total_points, 0) DESC) as rank
FROM users u
LEFT JOIN user_points p ON u.id = p.user_id
LEFT JOIN user_stats s ON u.id = s.user_id
WHERE u.is_active = true
ORDER BY total_points DESC;

-- ============================================
-- 示例数据（可选）
-- ============================================
-- 插入测试用户（密码是 'password123' 的bcrypt哈希）
-- 注意：实际使用时应该通过API注册，这里仅供测试
INSERT INTO users (username, email, password_hash, display_name, avatar)
VALUES
    ('demo_user', 'demo@example.com', '$2b$10$example_hash_here', '演示用户', '🎓')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 权限设置（根据需要调整）
-- ============================================
-- 创建应用专用数据库用户
-- CREATE USER ai_franchteacher_app WITH PASSWORD 'your_secure_password';
-- GRANT CONNECT ON DATABASE ai_franchteacher TO ai_franchteacher_app;
-- GRANT USAGE ON SCHEMA public TO ai_franchteacher_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ai_franchteacher_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ai_franchteacher_app;

-- ============================================
-- 完成
-- ============================================
COMMENT ON TABLE users IS '用户账户表';
COMMENT ON TABLE user_course_progress IS '用户课程学习进度';
COMMENT ON TABLE user_exercises IS '用户练习答案和成绩';
COMMENT ON TABLE user_points IS '用户积分统计';
COMMENT ON TABLE user_points_history IS '积分变化历史记录';
COMMENT ON TABLE user_badges IS '用户获得的徽章';
COMMENT ON TABLE user_checkins IS '用户每日打卡记录';
COMMENT ON TABLE user_mistakes IS '用户错题本';
COMMENT ON TABLE user_stats IS '用户学习统计数据';
COMMENT ON TABLE dialogue_history IS '用户AI对话历史';
COMMENT ON TABLE user_sessions IS '用户会话管理';
