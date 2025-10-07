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

func ListProjects(c *gin.Context) {
	userSub := c.MustGet("userSub").(string)
	uid, _ := primitive.ObjectIDFromHex(userSub)

	col := db.Database.Collection("projects")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cur, err := col.Find(ctx, bson.M{"members.userId": uid})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
		return
	}
	defer cur.Close(ctx)

	var items []models.Project
	if err := cur.All(ctx, &items); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "decode failed"})
		return
	}
	type out struct{ ID, Name, Description string }
	res := []out{}
	for _, p := range items {
		res = append(res, out{ID: p.ID.Hex(), Name: p.Name, Description: p.Description})
	}
	c.JSON(http.StatusOK, res)
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
