package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"mini-taskmgr-backend/internal/db"
	"mini-taskmgr-backend/internal/models"
	"mini-taskmgr-backend/internal/utils"
)

func Register(c *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	col := db.Database.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// check exists
	var exists models.User
	err := col.FindOne(ctx, bson.M{"email": input.Email}).Decode(&exists)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already used"})
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(input.Password), 10)
	u := models.User{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: string(hash),
		Role:         models.RoleMember,
	}
	res, err := col.InsertOne(ctx, u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create user"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": res.InsertedID})
}

func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	col := db.Database.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var u models.User
	if err := col.FindOne(ctx, bson.M{"email": input.Email}).Decode(&u); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(input.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	id := u.ID.Hex()
	token, _ := utils.Sign(id, string(u.Role))
	c.JSON(http.StatusOK, gin.H{"accessToken": token, "user": gin.H{"id": id, "name": u.Name, "email": u.Email, "role": u.Role}})
}

func Me(c *gin.Context) {
	sub := c.MustGet("userSub").(string)
	oid, _ := primitive.ObjectIDFromHex(sub)
	col := db.Database.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var u models.User
	if err := col.FindOne(ctx, bson.M{"_id": oid}).Decode(&u); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": u.ID.Hex(), "name": u.Name, "email": u.Email, "role": u.Role})
}
