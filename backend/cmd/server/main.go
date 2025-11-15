package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"mini-taskmgr-backend/internal/db"
	"mini-taskmgr-backend/internal/handlers"
	"mini-taskmgr-backend/internal/middleware"
)

func main() {
	// โหลด env
	_ = godotenv.Load()

	// ต่อ MongoDB
	db.Connect()

	// ใช้ gin.Default() -> มี Logger, Recovery
	r := gin.Default()

	// 👇 CORS สำคัญมาก
	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// ปิด warning proxy (ดีใน dev)
	r.SetTrustedProxies(nil)

	// health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	api := r.Group("/api/v1")
	{
		// public routes
		api.POST("/auth/register", handlers.Register)
		api.POST("/auth/login", handlers.Login)

		// protected routes
		protected := api.Group("")
		protected.Use(middleware.RequireAuth())
		{
			protected.GET("/me", handlers.Me)

			// Projects
			protected.GET("/projects", handlers.ListProjects)
			protected.POST("/projects", handlers.CreateProject)
			protected.GET("/projects/:id", handlers.GetProjectDetail)
			protected.PATCH("/projects/:id", handlers.UpdateProject)
			protected.DELETE("/projects/:id", handlers.DeleteProject)

			// Columns
			protected.POST("/columns", handlers.CreateColumn)
			protected.PATCH("/columns/:id", handlers.UpdateColumn)
			protected.DELETE("/columns/:id", handlers.DeleteColumn)

			// Tasks
			protected.POST("/tasks", handlers.CreateTask)
			protected.PATCH("/tasks/:id", handlers.UpdateTask)
			protected.DELETE("/tasks/:id", handlers.DeleteTask)
			protected.PATCH("/tasks/move", handlers.MoveTask)

			// Users
			protected.PATCH("/users/:id", handlers.UpdateProfile)
			protected.DELETE("/users/:id", handlers.DeleteAccount)
			protected.POST("/auth/change-password", handlers.ChangePassword)
		}

	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Println("Server listening on :" + port)

	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
