package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"mini-taskmgr-backend/internal/db"
)

func GetProjectDetail(c *gin.Context) {
	projectID := c.Param("id")

	pid, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 1) project
	var project bson.M
	if err := db.Database.Collection("projects").
		FindOne(ctx, bson.M{"_id": pid}).
		Decode(&project); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	// 2) board (เอาบอร์ดแรกของโปรเจค)
	var board bson.M
	_ = db.Database.Collection("boards").
		FindOne(ctx, bson.M{"projectId": pid}).
		Decode(&board)

	// ถ้ายังไม่มี board => ส่งเปล่า ๆ กลับไป
	if board == nil {
		c.JSON(http.StatusOK, gin.H{
			"project": gin.H{
				"id":          project["_id"].(primitive.ObjectID).Hex(),
				"name":        project["name"],
				"description": project["description"],
			},
			"board":   nil,
			"columns": []gin.H{},
			"tasks":   []gin.H{},
		})
		return
	}

	boardID, _ := board["_id"].(primitive.ObjectID)

	// 3) columns
	colCur, err := db.Database.Collection("columns").
		Find(ctx, bson.M{"boardId": boardID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot load columns"})
		return
	}
	var columnsRaw []bson.M
	if err := colCur.All(ctx, &columnsRaw); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot decode columns"})
		return
	}

	// 4) tasks (ทั้งหมดในบอร์ดนี้)
	taskCur, err := db.Database.Collection("tasks").
		Find(ctx, bson.M{"boardId": boardID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot load tasks"})
		return
	}
	var tasksRaw []bson.M
	if err := taskCur.All(ctx, &tasksRaw); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot decode tasks"})
		return
	}

	// map columns -> ส่งเป็น JSON ที่ frontend อ่านง่าย
	columnsOut := []gin.H{}
	for _, col := range columnsRaw {
		idHex := ""
		if oid, ok := col["_id"].(primitive.ObjectID); ok {
			idHex = oid.Hex()
		}
		columnsOut = append(columnsOut, gin.H{
			"id":       idHex,
			"name":     col["name"],
			"position": col["position"],
		})
	}

	// map tasks -> ส่ง columnId เป็น hex string ด้วย
	tasksOut := []gin.H{}
	for _, t := range tasksRaw {
		tid := ""
		if oid, ok := t["_id"].(primitive.ObjectID); ok {
			tid = oid.Hex()
		}
		colID := ""
		if oid, ok := t["columnId"].(primitive.ObjectID); ok {
			colID = oid.Hex()
		}
		tasksOut = append(tasksOut, gin.H{
			"id":          tid,
			"title":       t["title"],
			"description": t["description"],
			"priority":    t["priority"],
			"columnId":    colID,
		})
	}

	projectOut := gin.H{
		"id":          project["_id"].(primitive.ObjectID).Hex(),
		"name":        project["name"],
		"description": project["description"],
	}

	boardOut := gin.H{
		"id":   boardID.Hex(),
		"name": board["name"],
	}

	c.JSON(http.StatusOK, gin.H{
		"project": projectOut,
		"board":   boardOut,
		"columns": columnsOut,
		"tasks":   tasksOut,
	})
}
