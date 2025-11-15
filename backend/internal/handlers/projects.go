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

// ProjectResponse คือ shape ที่ frontend จะใช้ในหน้า /projects
type ProjectResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	TaskCount   int64  `json:"taskCount"`
	UpdatedAt   string `json:"updatedAt,omitempty"`
}

// ListProjects ดึงโปรเจกต์ทั้งหมดของผู้ใช้ แล้วรวม taskCount
func ListProjects(c *gin.Context) {
	// middleware.RequireAuth() จะเซ็ตค่า userSub (จาก token) ไว้
	userSub := c.GetString("userSub")
	// ถ้าไม่มี userSub ให้คืน 401
	if userSub == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
		return
	}

	// แปลงเป็น ObjectID เพื่อใช้ค้นหา ownerId ที่เก็บเป็น ObjectID ใน DB
	uid, err := primitive.ObjectIDFromHex(userSub)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	projColl := db.Database.Collection("projects")
	taskColl := db.Database.Collection("tasks")

	// ดึงทุกโปรเจกต์ที่ user นี้เป็นเจ้าของ (ownerId เก็บเป็น ObjectID)
	cur, err := projColl.Find(context.Background(), bson.M{
		"ownerId": uid,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer cur.Close(context.Background())

	var results []ProjectResponse

	for cur.Next(context.Background()) {
		var p struct {
			ID          primitive.ObjectID `bson:"_id"`
			Name        string             `bson:"name"`
			Description string             `bson:"description,omitempty"`
			OwnerID     primitive.ObjectID `bson:"ownerId"`
			UpdatedAt   *time.Time         `bson:"updatedAt,omitempty"`
		}

		if err := cur.Decode(&p); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "decode error"})
			return
		}

		// นับจำนวน task ในโปรเจกต์นี้
		// สมมติว่าใน collection tasks เก็บ projectId แบบ ObjectID
		taskCount, err := taskColl.CountDocuments(context.Background(), bson.M{
			"projectId": p.ID,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "count error"})
			return
		}

		resp := ProjectResponse{
			ID:          p.ID.Hex(),
			Name:        p.Name,
			Description: p.Description,
			TaskCount:   taskCount,
		}

		// ใส่ updatedAt (string) ถ้ามี
		if p.UpdatedAt != nil {
			// format เป็น readable text เช่น "2025-10-27 14:32"
			resp.UpdatedAt = p.UpdatedAt.Format("2006-01-02 15:04")
		}

		results = append(results, resp)
	}

	if err := cur.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cursor error"})
		return
	}

	c.JSON(http.StatusOK, results)
}

func CreateProject(c *gin.Context) {
	userSub := c.MustGet("userSub").(string)
	uid, _ := primitive.ObjectIDFromHex(userSub)

	var input struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p := models.Project{
		Name:        input.Name,
		Description: input.Description,
		OwnerID:     uid,
		Members:     []models.ProjectMember{{UserID: uid, Role: models.RoleAdmin}},
	}

	col := db.Database.Collection("projects")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := col.InsertOne(ctx, p)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	oid := res.InsertedID.(primitive.ObjectID)
	c.JSON(http.StatusCreated, gin.H{"id": oid.Hex(), "name": p.Name, "description": p.Description})
}

// UpdateProject อนุญาตให้แก้ไขชื่อ / description
func UpdateProject(c *gin.Context) {
	userSub := c.MustGet("userSub").(string)
	userID, _ := primitive.ObjectIDFromHex(userSub)

	projID := c.Param("id")

	oid, err := primitive.ObjectIDFromHex(projID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	// ดึงค่าใน body
	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if body.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	coll := db.Database.Collection("projects")

	// เช็ค permission: ต้องเป็นเจ้าของโปรเจกต์
	var proj struct {
		OwnerID primitive.ObjectID `bson:"ownerId"`
	}
	if err := coll.FindOne(context.Background(), bson.M{"_id": oid}).Decode(&proj); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}
	if proj.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you don't have permission to update this project"})
		return
	}

	update := bson.M{
		"$set": bson.M{
			"name":        body.Name,
			"description": body.Description,
			"updatedAt":   time.Now(),
		},
	}

	_, err = coll.UpdateOne(
		context.Background(),
		bson.M{"_id": oid},
		update,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func DeleteProject(c *gin.Context) {
	userSub := c.MustGet("userSub").(string)
	userID, _ := primitive.ObjectIDFromHex(userSub)

	projID := c.Param("id")

	oid, err := primitive.ObjectIDFromHex(projID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	coll := db.Database.Collection("projects")

	// เช็ค permission: ต้องเป็นเจ้าของโปรเจกต์
	var proj struct {
		OwnerID primitive.ObjectID `bson:"ownerId"`
	}
	if err := coll.FindOne(context.Background(), bson.M{"_id": oid}).Decode(&proj); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}
	if proj.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you don't have permission to delete this project"})
		return
	}

	res, err := coll.DeleteOne(
		context.Background(),
		bson.M{"_id": oid},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	if res.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
