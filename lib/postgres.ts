import { Pool } from "pg";

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: parseInt(process.env.PG_POOL_MAX || "5", 10), // Railway free tier limit (5 ta connection)
  min: 1, // Minimum connections
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS || "20000", 10), // 20s idle timeout
  connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT_MS || "20000", 10), // 20s connection timeout
  statement_timeout: 40000, // 40s query timeout
  query_timeout: 40000, // 40s query timeout
  keepAlive: true, // Keep connections alive
  keepAliveInitialDelayMillis: 5000, // 5s keepalive delay
  allowExitOnIdle: true, // Allow pool to close when idle
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

pool.on('connect', () => {
  console.log('New database connection established');
});

pool.on('remove', () => {
  console.log('Database connection removed from pool');
});

// Database connection status
let isDatabaseInitialized = false;

// Database schema initialization
export async function initializeDatabase() {
  if (isDatabaseInitialized) {
    return; // Already initialized
  }

  try {
    // Test database connection with retries (some cloud DBs may need a few seconds)
    const maxAttempts = parseInt(process.env.DB_CONNECT_ATTEMPTS || "5", 10);
    const baseDelay = parseInt(process.env.DB_CONNECT_BASE_DELAY_MS || "1000", 10);

    async function sleep(ms: number) {
      return new Promise((res) => setTimeout(res, ms));
    }

    let attempt = 0;
    let lastErr: any = null;
    while (attempt < maxAttempts) {
      try {
        await pool.query("SELECT 1");
        lastErr = null;
        break;
      } catch (err: any) {
        lastErr = err;
        attempt++;
        const delay = baseDelay * attempt; // linear backoff
        console.warn(`Database connection attempt ${attempt} failed, retrying in ${delay}ms...`, err?.message || err);
        await sleep(delay);
      }
    }

    if (lastErr) {
      throw lastErr;
    }
    console.log("✅ PostgreSQL database connected");
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        courses JSONB DEFAULT '[]'::jsonb
      )
    `);

    // Create courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) DEFAULT 0,
        videos JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create videos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        filename VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        duration INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_courses junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_courses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, course_id)
      )
    `);

    // Create settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        site_name VARCHAR(255) DEFAULT 'Uygunlik Learning Platform',
        site_description TEXT DEFAULT 'Professional online learning platform',
        max_video_size INTEGER DEFAULT 500,
        allowed_video_formats TEXT[] DEFAULT ARRAY['mp4', 'webm', 'avi', 'mov'],
        enable_registration BOOLEAN DEFAULT true,
        maintenance_mode BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT settings_single_row CHECK (id = 1)
      )
    `);

    // Create video_progress table to track user's video watching progress
    await pool.query(`
      CREATE TABLE IF NOT EXISTS video_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
        watched_time DECIMAL(10,2) DEFAULT 0,
        total_duration DECIMAL(10,2) DEFAULT 0,
        progress DECIMAL(5,2) DEFAULT 0,
        completed BOOLEAN DEFAULT false,
        last_watched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, video_id)
      )
    `);

    // Create default admin user if not exists
    const adminExists = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      ["admin@uygunlik.uz"]
    );
    if (adminExists.rows.length === 0) {
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("password", 10);

      await pool.query(
        `
        INSERT INTO users (first_name, last_name, email, password, role, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        ["Admin", "User", "admin@uygunlik.uz", hashedPassword, "admin", true]
      );

      console.log("✅ Default admin user created");
    }

    // Create sample video if not exists
    const videoExists = await pool.query(
      "SELECT id FROM videos WHERE filename = $1",
      ["0406.mp4"]
    );
    if (videoExists.rows.length === 0) {
      await pool.query(
        `
        INSERT INTO videos (title, description, filename, url)
        VALUES ($1, $2, $3, $4)
      `,
        [
          "Namuna Video",
          "Bu namuna video",
          "0406.mp4",
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        ]
      );

      console.log("✅ Sample video created");
    }

    isDatabaseInitialized = true;
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Failed to connect to PostgreSQL database: ${errorMessage}. Please check your DATABASE_URL environment variable.`
    );
  }
}

// User operations
export class UserService {
  static async create(userData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role?: string;
    status?: boolean;
  }) {
    const result = await pool.query(
      `
      INSERT INTO users (first_name, last_name, email, password, role, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [
        userData.first_name,
        userData.last_name,
        userData.email,
        userData.password,
        userData.role || "user",
        userData.status !== undefined ? userData.status : true,
      ]
    );

    return result.rows[0];
  }

  static async findByEmail(email: string) {
    // User ma'lumotlarini olish
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];

    if (!user) {
      return null;
    }

    // User'ga biriktirilgan kurslarni olish
    const coursesResult = await pool.query(
      `SELECT c.* 
       FROM courses c
       INNER JOIN user_courses uc ON c.id = uc.course_id
       WHERE uc.user_id = $1
       ORDER BY c.created_at DESC`,
      [user.id]
    );

    // Har bir kurs uchun videolarni olish
    const courses = coursesResult.rows;
    for (const course of courses) {
      const videosResult = await pool.query(
        `SELECT * FROM videos WHERE course_id = $1 ORDER BY created_at ASC`,
        [course.id]
      );
      course.videos = videosResult.rows;
    }

    // User obyektiga courses qo'shish
    user.courses = courses;

    return user;
  }

  static async findById(id: number) {
    // User ma'lumotlarini olish
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    const user = userResult.rows[0];

    if (!user) {
      return null;
    }

    // User'ga biriktirilgan kurslarni olish
    const coursesResult = await pool.query(
      `SELECT c.* 
       FROM courses c
       INNER JOIN user_courses uc ON c.id = uc.course_id
       WHERE uc.user_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );

    // Har bir kurs uchun videolarni olish
    const courses = coursesResult.rows;
    for (const course of courses) {
      const videosResult = await pool.query(
        `SELECT * FROM videos WHERE course_id = $1 ORDER BY created_at ASC`,
        [course.id]
      );
      course.videos = videosResult.rows;
    }

    // User obyektiga courses qo'shish
    user.courses = courses;

    return user;
  }

  static async findAll(
    page: number = 1,
    limit: number = 10,
    search: string = ""
  ) {
    const offset = (page - 1) * limit;
    let query = "SELECT * FROM users";
    let params: any[] = [];

    if (search) {
      query +=
        " WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1";
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${
      params.length + 2
    }`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Har bir user uchun courses'ni yuklash
    const users = result.rows;
    for (const user of users) {
      try {
        const coursesResult = await pool.query(
          `SELECT c.* 
           FROM courses c
           INNER JOIN user_courses uc ON c.id = uc.course_id
           WHERE uc.user_id = $1 AND uc.course_id IS NOT NULL
           ORDER BY c.created_at DESC`,
          [user.id]
        );
        
        // Har bir kurs uchun videolarni yuklash
        const courses = coursesResult.rows;
        for (const course of courses) {
          const videosResult = await pool.query(
            `SELECT * FROM videos WHERE course_id = $1 ORDER BY created_at ASC`,
            [course.id]
          );
          course.videos = videosResult.rows;
        }
        
        user.courses = courses;
      } catch (error: any) {
        console.error(`Error loading courses for user ${user.id}:`, error.message);
        user.courses = []; // Xato bo'lsa bo'sh array
      }
    }

    // Get total count
    let countQuery = "SELECT COUNT(*) FROM users";
    let countParams: any[] = [];

    if (search) {
      countQuery +=
        " WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1";
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async update(
    id: number,
    updates: {
      first_name?: string;
      last_name?: string;
      email?: string;
      password?: string;
      role?: string;
      status?: boolean;
    }
  ) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE users SET ${fields.join(
      ", "
    )} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    return result.rows[0] || null;
  }

  static async delete(id: number) {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0] || null;
  }

  static async updateUserCourses(userId: number, courseIds: number[]) {
    try {
      // Avvalgi kurslarni o'chirish
      await pool.query("DELETE FROM user_courses WHERE user_id = $1", [userId]);

      // Yangi kurslarni qo'shish
      if (courseIds.length > 0) {
        const values = courseIds
          .map((courseId, index) => `($1, $${index + 2})`)
          .join(", ");

        const query = `INSERT INTO user_courses (user_id, course_id) VALUES ${values}`;
        await pool.query(query, [userId, ...courseIds]);
      }

      // Foydalanuvchini yangilangan kurslar bilan qaytarish
      const user = await this.findById(userId);

      // Kurslar ma'lumotlarini olish
      const coursesResult = await pool.query(
        `SELECT c.* FROM courses c
         INNER JOIN user_courses uc ON c.id = uc.course_id
         WHERE uc.user_id = $1
         ORDER BY uc.created_at DESC`,
        [userId]
      );

      return {
        ...user,
        courses: coursesResult.rows,
      };
    } catch (error: any) {
      console.error("updateUserCourses error:", error);
      throw error;
    }
  }
}

// Course operations
export class CourseService {
  static async create(courseData: {
    title: string;
    description?: string;
    price?: number;
    videos?: any[];
  }) {
    try {
      // Convert video IDs to integers
      const videoIds = Array.isArray(courseData.videos)
        ? courseData.videos
            .map((v) => {
              const id = typeof v === "string" ? parseInt(v, 10) : v;
              return isNaN(id) ? null : id;
            })
            .filter((id) => id !== null)
        : [];

      console.log("CourseService.create - Input:", courseData);
      console.log("CourseService.create - Converted video IDs:", videoIds);

      const result = await pool.query(
        `
        INSERT INTO courses (title, description, price, videos)
        VALUES ($1, $2, $3, $4::jsonb)
        RETURNING *
      `,
        [
          courseData.title,
          courseData.description || "",
          courseData.price || 0,
          JSON.stringify(videoIds), // Convert to JSON string for JSONB
        ]
      );

      console.log("CourseService.create - Result:", result.rows[0]);
      return result.rows[0];
    } catch (error: any) {
      console.error("CourseService.create - Error:", error);
      console.error("CourseService.create - Error details:", error.message);
      throw error;
    }
  }

  static async findAll() {
    const result = await pool.query(
      "SELECT * FROM courses ORDER BY created_at DESC"
    );

    // Har bir kurs uchun video ma'lumotlarini to'ldirish
    const coursesWithVideos = await Promise.all(
      result.rows.map(async (course) => {
        const videoIds = course.videos || [];

        if (videoIds.length > 0) {
          // Video ma'lumotlarini olish
          const videosResult = await pool.query(
            "SELECT * FROM videos WHERE id = ANY($1::int[])",
            [videoIds]
          );

          return {
            ...course,
            videos: videosResult.rows,
          };
        }

        return {
          ...course,
          videos: [],
        };
      })
    );

    return coursesWithVideos;
  }

  static async findById(id: number) {
    const result = await pool.query("SELECT * FROM courses WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) return null;

    const course = result.rows[0];
    const videoIds = course.videos || [];

    if (videoIds.length > 0) {
      // Video ma'lumotlarini olish
      const videosResult = await pool.query(
        "SELECT * FROM videos WHERE id = ANY($1::int[])",
        [videoIds]
      );

      return {
        ...course,
        videos: videosResult.rows,
      };
    }

    return {
      ...course,
      videos: [],
    };
  }

  static async update(id: number, updates: any) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === "videos") {
          // Convert video IDs to integers
          const videoIds = Array.isArray(value)
            ? value
                .map((v) => {
                  const id = typeof v === "string" ? parseInt(v, 10) : v;
                  return isNaN(id) ? null : id;
                })
                .filter((id) => id !== null)
            : [];
          fields.push(`${key} = $${paramCount}::jsonb`);
          values.push(JSON.stringify(videoIds)); // Convert to JSON string
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE courses SET ${fields.join(
      ", "
    )} WHERE id = $${paramCount} RETURNING *`;
    console.log("Course update query:", query);
    console.log("Course update values:", values);

    const result = await pool.query(query, values);

    return result.rows[0] || null;
  }

  static async delete(id: number) {
    const result = await pool.query(
      "DELETE FROM courses WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0] || null;
  }
}

// Video operations
export class VideoService {
  static async create(videoData: {
    title: string;
    description?: string;
    filename: string;
    url: string;
  }) {
    const result = await pool.query(
      `
      INSERT INTO videos (title, description, filename, url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [
        videoData.title,
        videoData.description || "",
        videoData.filename,
        videoData.url,
      ]
    );

    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query(
      "SELECT * FROM videos ORDER BY created_at DESC"
    );
    return result.rows;
  }

  static async findById(id: number) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await pool.query("SELECT * FROM videos WHERE id = $1", [id]);
        return result.rows[0] || null;
      } catch (error: any) {
        lastError = error;
        console.error(`VideoService.findById attempt ${attempt}/${maxRetries} error:`, error.message);
        
        // Retry on connection/timeout errors
        if (
          attempt < maxRetries &&
          (error.message.includes("timeout") || 
           error.message.includes("terminated") ||
           error.message.includes("connection"))
        ) {
          // Exponential backoff: wait 500ms, 1s, 1.5s
          const delay = attempt * 500;
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Don't retry other errors
        throw error;
      }
    }
    
    throw lastError;
  }

  static async findByFilename(filename: string) {
    const result = await pool.query(
      "SELECT * FROM videos WHERE filename = $1",
      [filename]
    );
    return result.rows[0] || null;
  }

  static async update(id: number, updates: any) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE videos SET ${fields.join(
      ", "
    )} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    return result.rows[0] || null;
  }

  static async delete(id: number) {
    const result = await pool.query(
      "DELETE FROM videos WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0] || null;
  }
}

export class SettingsService {
  static async get() {
    const result = await pool.query("SELECT * FROM settings WHERE id = 1");
    if (result.rows.length === 0) {
      // Return default settings
      return {
        id: 1,
        site_name: "Uygunlik Learning Platform",
        site_description: "Professional online learning platform",
        max_video_size: 500,
        allowed_video_formats: ["mp4", "webm", "avi", "mov"],
        enable_registration: true,
        maintenance_mode: false,
      };
    }
    return result.rows[0];
  }

  static async update(settings: any) {
    const {
      site_name,
      site_description,
      max_video_size,
      allowed_video_formats,
      enable_registration,
      maintenance_mode,
    } = settings;

    // Check if settings exist
    const existing = await pool.query("SELECT id FROM settings WHERE id = 1");

    if (existing.rows.length === 0) {
      // Insert new settings
      const result = await pool.query(
        `INSERT INTO settings 
         (id, site_name, site_description, max_video_size, allowed_video_formats, enable_registration, maintenance_mode)
         VALUES (1, $1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          site_name,
          site_description,
          max_video_size,
          allowed_video_formats,
          enable_registration,
          maintenance_mode,
        ]
      );
      return result.rows[0];
    } else {
      // Update existing settings
      const result = await pool.query(
        `UPDATE settings 
         SET site_name = $1, 
             site_description = $2, 
             max_video_size = $3, 
             allowed_video_formats = $4, 
             enable_registration = $5, 
             maintenance_mode = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = 1
         RETURNING *`,
        [
          site_name,
          site_description,
          max_video_size,
          allowed_video_formats,
          enable_registration,
          maintenance_mode,
        ]
      );
      return result.rows[0];
    }
  }
}

// Video Progress Service
export const VideoProgressService = {
  // Update or create video progress
  async updateProgress(
    userId: number,
    videoId: number,
    currentTime: number,
    duration: number
  ) {
    // Calculate progress percentage
    let progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    // If user watched 98% or more, consider it 100% (to account for video end buffer)
    if (progress >= 98) {
      progress = 100;
    }

    // Mark as completed only when 100%
    const completed = progress >= 100;

    const result = await pool.query(
      `INSERT INTO video_progress (user_id, video_id, watched_time, total_duration, progress, completed, last_watched, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, video_id) 
       DO UPDATE SET 
         watched_time = $3,
         total_duration = $4,
         progress = $5,
         completed = $6,
         last_watched = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, videoId, currentTime, duration, progress, completed]
    );
    return result.rows[0];
  },

  // Get progress for a specific video
  async getProgress(userId: number, videoId: number) {
    const result = await pool.query(
      `SELECT * FROM video_progress WHERE user_id = $1 AND video_id = $2`,
      [userId, videoId]
    );
    return result.rows[0] || null;
  },

  // Get all progress for a user
  async getUserProgress(userId: number) {
    const result = await pool.query(
      `SELECT * FROM video_progress WHERE user_id = $1 ORDER BY last_watched DESC`,
      [userId]
    );
    return result.rows;
  },

  // Get progress for multiple videos (for course playlist)
  async getVideosProgress(userId: number, videoIds: number[]) {
    if (videoIds.length === 0) return [];

    const result = await pool.query(
      `SELECT * FROM video_progress 
       WHERE user_id = $1 AND video_id = ANY($2)`,
      [userId, videoIds]
    );
    return result.rows;
  },
};

export default pool;
