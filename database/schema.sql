-- French Teacher App 数据库架构
-- PostgreSQL 数据库设计

-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- 用户学习进度表
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id VARCHAR(50) NOT NULL,
    started BOOLEAN DEFAULT false,
    completed BOOLEAN DEFAULT false,
    score INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- 秒数
    last_attempt TIMESTAMP,
    exercises_completed JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

-- 用户积分表
CREATE TABLE user_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    daily_points INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 积分历史记录表
CREATE TABLE points_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户徽章表
CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    badge_icon VARCHAR(10),
    points INTEGER DEFAULT 0,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- 用户签到记录表
CREATE TABLE user_checkins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL,
    current_streak INTEGER DEFAULT 1,
    max_streak INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, checkin_date)
);

-- 错题记录表
CREATE TABLE user_mistakes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- fill, choice, match
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    wrong_count INTEGER DEFAULT 1,
    reviewed BOOLEAN DEFAULT false,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    UNIQUE(user_id, question_id)
);

-- 学习统计表
CREATE TABLE user_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    courses_completed INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    words_learned INTEGER DEFAULT 0,
    conversation_rounds INTEGER DEFAULT 0,
    total_study_time INTEGER DEFAULT 0, -- 秒数
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_study_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 对话历史表
CREATE TABLE dialogue_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX idx_points_history_user_id ON points_history(user_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_checkins_user_id ON user_checkins(user_id);
CREATE INDEX idx_user_checkins_date ON user_checkins(checkin_date);
CREATE INDEX idx_user_mistakes_user_id ON user_mistakes(user_id);
CREATE INDEX idx_user_mistakes_reviewed ON user_mistakes(reviewed);
CREATE INDEX idx_dialogue_history_user_id ON dialogue_history(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 创建触发器：自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建视图：用户排行榜
CREATE VIEW leaderboard AS
SELECT
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    up.total_points,
    us.courses_completed,
    us.current_streak,
    RANK() OVER (ORDER BY up.total_points DESC) as rank
FROM users u
LEFT JOIN user_points up ON u.id = up.user_id
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE u.is_active = true
ORDER BY up.total_points DESC;

-- 插入默认数据（可选）
-- 创建测试用户（密码是 'password123' 的 bcrypt hash）
INSERT INTO users (email, username, display_name, password_hash) VALUES
('demo@example.com', 'demo', 'Demo User', '$2b$10$rXKZ4qJYqJh5s5h5YQH5qOeXKZ4qJYqJh5s5h5YQH5qOeXKZ4qJYq');

-- 为测试用户初始化记录
INSERT INTO user_points (user_id, total_points, daily_points) VALUES (1, 0, 0);
INSERT INTO user_stats (user_id) VALUES (1);

-- 显示所有表
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
