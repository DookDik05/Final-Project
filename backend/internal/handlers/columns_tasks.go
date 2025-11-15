package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"mini-taskmgr-backend/internal/db"
	"mini-taskmgr-backend/internal/models"
)

func CreateColumn(c *gin.Context) {
	var input struct {
		BoardID   string `json:"boardId"`   // optional
		ProjectID string `json:"projectId"` // optional
		Name      string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	boardsColl := db.Database.Collection("boards")
	columnsColl := db.Database.Collection("columns")

	var boardID primitive.ObjectID
	var err error

	if input.BoardID != "" {
		boardID, err = primitive.ObjectIDFromHex(input.BoardID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid boardId"})
			return
		}
	} else if input.ProjectID != "" {
		pid, err := primitive.ObjectIDFromHex(input.ProjectID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid projectId"})
			return
		}

		var board models.Board
		err = boardsColl.FindOne(ctx, bson.M{"projectId": pid}).Decode(&board)
		if err == mongo.ErrNoDocuments {
			board = models.Board{
				ID:        primitive.NewObjectID(),
				ProjectID: pid,
				Name:      "Main board",
			}
			if _, err = boardsColl.InsertOne(ctx, board); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create board"})
				return
			}
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not query board"})
			return
		}

		boardID = board.ID
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "boardId or projectId is required"})
		return
	}

	// column struct ต้องตรงกับ models.Column
	column := models.Column{
		ID:      primitive.NewObjectID(),
		BoardID: boardID,
		Name:    input.Name,
	}

	if _, err := columnsColl.InsertOne(ctx, column); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create column"})
		return
	}

	c.JSON(http.StatusOK, column)
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

// UpdateTask แก้ไข task (title, description, priority)
func UpdateTask(c *gin.Context) {
	userSub := c.MustGet("userSub").(string)
	userID, _ := primitive.ObjectIDFromHex(userSub)

	taskID := c.Param("id")
	taskOID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Priority    string `json:"priority"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	taskCol := db.Database.Collection("tasks")

	// หา task และตรวจสอบว่า user เป็นเจ้าของ project นี้
	var task struct {
		ColumnID primitive.ObjectID `bson:"columnId"`
	}
	if err := taskCol.FindOne(ctx, bson.M{"_id": taskOID}).Decode(&task); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}

	// หา column เพื่อได้ board
	colCol := db.Database.Collection("columns")
	var column struct {
		BoardID primitive.ObjectID `bson:"boardId"`
	}
	if err := colCol.FindOne(ctx, bson.M{"_id": task.ColumnID}).Decode(&column); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "column not found"})
		return
	}

	// หา project เพื่อตรวจสอบ owner
	boardCol := db.Database.Collection("boards")
	var board struct {
		ProjectID primitive.ObjectID `bson:"projectId"`
	}
	if err := boardCol.FindOne(ctx, bson.M{"_id": column.BoardID}).Decode(&board); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "board not found"})
		return
	}

	projCol := db.Database.Collection("projects")
	var proj struct {
		OwnerID primitive.ObjectID `bson:"ownerId"`
	}
	if err := projCol.FindOne(ctx, bson.M{"_id": board.ProjectID}).Decode(&proj); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "project not found"})
		return
	}

	if proj.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you don't have permission to update this task"})
		return
	}

	updateDoc := bson.M{}
	if input.Title != "" {
		updateDoc["title"] = input.Title
	}
	if input.Description != "" {
		updateDoc["description"] = input.Description
	}
	if input.Priority != "" {
		updateDoc["priority"] = input.Priority
	}

	_, err = taskCol.UpdateByID(ctx, taskOID, bson.M{"$set": updateDoc})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// DeleteTask ลบ task
func DeleteTask(c *gin.Context) {
	userSub := c.MustGet("userSub").(string)
	userID, _ := primitive.ObjectIDFromHex(userSub)

	taskID := c.Param("id")
	taskOID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	taskCol := db.Database.Collection("tasks")

	// หา task และตรวจสอบ permission
	var task struct {
		ColumnID primitive.ObjectID `bson:"columnId"`
	}
	if err := taskCol.FindOne(ctx, bson.M{"_id": taskOID}).Decode(&task); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}

	// หา column -> board -> project -> ตรวจสอบ owner
	colCol := db.Database.Collection("columns")
	var column struct {
		BoardID primitive.ObjectID `bson:"boardId"`
	}
	if err := colCol.FindOne(ctx, bson.M{"_id": task.ColumnID}).Decode(&column); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "column not found"})
		return
	}

	boardCol := db.Database.Collection("boards")
	var board struct {
		ProjectID primitive.ObjectID `bson:"projectId"`
	}
	if err := boardCol.FindOne(ctx, bson.M{"_id": column.BoardID}).Decode(&board); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "board not found"})
		return
	}

	projCol := db.Database.Collection("projects")
	var proj struct {
		OwnerID primitive.ObjectID `bson:"ownerId"`
	}
	if err := projCol.FindOne(ctx, bson.M{"_id": board.ProjectID}).Decode(&proj); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "project not found"})
		return
	}

	if proj.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you don't have permission to delete this task"})
		return
	}

	result, err := taskCol.DeleteOne(ctx, bson.M{"_id": taskOID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// UpdateColumn แก้ไข column name
func UpdateColumn(c *gin.Context) {
	userSub := c.MustGet("userSub").(string)
	userID, _ := primitive.ObjectIDFromHex(userSub)

	columnID := c.Param("id")
	colOID, err := primitive.ObjectIDFromHex(columnID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid column id"})
		return
	}

	var input struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	colCol := db.Database.Collection("columns")

	// หา column แล้วตรวจสอบ permission
	var column struct {
		BoardID primitive.ObjectID `bson:"boardId"`
	}
	if err := colCol.FindOne(ctx, bson.M{"_id": colOID}).Decode(&column); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "column not found"})
		return
	}

	// หา board -> project -> ตรวจสอบ owner
	boardCol := db.Database.Collection("boards")
	var board struct {
		ProjectID primitive.ObjectID `bson:"projectId"`
	}
	if err := boardCol.FindOne(ctx, bson.M{"_id": column.BoardID}).Decode(&board); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "board not found"})
		return
	}

	projCol := db.Database.Collection("projects")
	var proj struct {
		OwnerID primitive.ObjectID `bson:"ownerId"`
	}
	if err := projCol.FindOne(ctx, bson.M{"_id": board.ProjectID}).Decode(&proj); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "project not found"})
		return
	}

	if proj.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you don't have permission to update this column"})
		return
	}

	_, err = colCol.UpdateByID(ctx, colOID, bson.M{"$set": bson.M{"name": input.Name}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// DeleteColumn ลบ column และงานทั้งหมดในนั้น
func DeleteColumn(c *gin.Context) {
	userSub := c.MustGet("userSub").(string)
	userID, _ := primitive.ObjectIDFromHex(userSub)

	columnID := c.Param("id")
	colOID, err := primitive.ObjectIDFromHex(columnID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid column id"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	colCol := db.Database.Collection("columns")

	// หา column และตรวจสอบ permission
	var column struct {
		BoardID primitive.ObjectID `bson:"boardId"`
	}
	if err := colCol.FindOne(ctx, bson.M{"_id": colOID}).Decode(&column); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "column not found"})
		return
	}

	// หา board -> project -> ตรวจสอบ owner
	boardCol := db.Database.Collection("boards")
	var board struct {
		ProjectID primitive.ObjectID `bson:"projectId"`
	}
	if err := boardCol.FindOne(ctx, bson.M{"_id": column.BoardID}).Decode(&board); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "board not found"})
		return
	}

	projCol := db.Database.Collection("projects")
	var proj struct {
		OwnerID primitive.ObjectID `bson:"ownerId"`
	}
	if err := projCol.FindOne(ctx, bson.M{"_id": board.ProjectID}).Decode(&proj); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "project not found"})
		return
	}

	if proj.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you don't have permission to delete this column"})
		return
	}

	// ลบ tasks ที่อยู่ใน column นี้
	taskCol := db.Database.Collection("tasks")
	taskCol.DeleteMany(ctx, bson.M{"columnId": colOID})

	// ลบ column
	result, err := colCol.DeleteOne(ctx, bson.M{"_id": colOID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "column not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
