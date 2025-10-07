package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"mini-taskmgr-backend/internal/db"
	"mini-taskmgr-backend/internal/handlers"
	"mini-taskmgr-backend/internal/middleware"
)

func main() {
	_ = godotenv.Load()
	db.Connect()

	r := gin.Default()
	r.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"ok": true}) })

	api := r.Group("/api/v1")
	{
		api.POST("/auth/register", handlers.Register)
		api.POST("/auth/login", handlers.Login)

		protected := api.Group("")
		protected.Use(middleware.RequireAuth())
		{
			protected.GET("/me", handlers.Me)
			protected.GET("/projects", handlers.ListProjects)
			protected.POST("/projects", handlers.CreateProject)
			protected.POST("/columns", handlers.CreateColumn)
			protected.POST("/tasks", handlers.CreateTask)
			protected.PATCH("/tasks/move", handlers.MoveTask)
		}
	}

	port := os.Getenv("PORT")
	if port == "" { port = "8080" }
	log.Println("Server listening on :" + port)
	if err := r.Run(":" + port); err != nil { log.Fatal(err) }
}
