package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"mini-taskmgr-backend/internal/db"
	"mini-taskmgr-backend/internal/models"
)

func CreateColumn(c *gin.Context) {
	var input struct {
		BoardID string `json:"boardId" binding:"required"`
		Name    string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	boardOID, err := primitive.ObjectIDFromHex(input.BoardID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid boardId"})
		return
	}
	col := models.Column{Name: input.Name, BoardID: boardOID, Position: 0}

	collection := db.Database.Collection("columns")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := collection.InsertOne(ctx, col)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	id := res.InsertedID.(primitive.ObjectID).Hex()
	c.JSON(http.StatusCreated, gin.H{"id": id, "name": col.Name})
}

func CreateTask(c *gin.Context) {
	var input struct {
		ColumnID    string `json:"columnId" binding:"required"`
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		Priority    string `json:"priority"`
		DueDate     string `json:"dueDate"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	colOID, err := primitive.ObjectIDFromHex(input.ColumnID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid columnId"})
		return
	}
	colCol := db.Database.Collection("columns")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var column models.Column
	if err := colCol.FindOne(ctx, bson.M{"_id": colOID}).Decode(&column); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "column not found"})
		return
	}
	task := models.Task{
		Title:       input.Title,
		Description: input.Description,
		Priority:    input.Priority,
		ColumnID:    colOID,
		BoardID:     column.BoardID,
		Position:    0,
	}
	taskCol := db.Database.Collection("tasks")
	res, err := taskCol.InsertOne(ctx, task)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	id := res.InsertedID.(primitive.ObjectID).Hex()
	c.JSON(http.StatusCreated, gin.H{"id": id, "title": task.Title})
}

func MoveTask(c *gin.Context) {
	var input struct {
		TaskID     string `json:"taskId" binding:"required"`
		ToColumnID string `json:"toColumnId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	taskOID, err := primitive.ObjectIDFromHex(input.TaskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid taskId"})
		return
	}
	colOID, err := primitive.ObjectIDFromHex(input.ToColumnID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid toColumnId"})
		return
	}
	taskCol := db.Database.Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = taskCol.UpdateByID(ctx, taskOID, bson.M{"$set": bson.M{"columnId": colOID}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
