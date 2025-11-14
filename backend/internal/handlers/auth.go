package handlers

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
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
	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	// hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "hash error"})
		return
	}

	// insert to MongoDB
	coll := db.Client.Database(os.Getenv("MONGODB_DB")).Collection("users")
	_, err = coll.InsertOne(context.TODO(), bson.M{
		"name":      body.Name,
		"email":     body.Email,
		"password":  string(hash),
		"role":      "MEMBER",
		"createdAt": time.Now(),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "insert error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "registered"})
}

func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ให้รูปแบบ email ตรงกับตอน Register (ปกติจะ lower-case)
	email := strings.ToLower(strings.TrimSpace(input.Email))

	ctx := c.Request.Context()
	usersColl := db.Database.Collection("users")

	var u models.User
	if err := usersColl.FindOne(ctx, bson.M{"email": email}).Decode(&u); err != nil {
		log.Println("LOGIN: user not found for email:", email, "err:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// สมมติ struct User มี field PasswordHash (hash จาก bcrypt)
	if err := bcrypt.CompareHashAndPassword(
		[]byte(u.PasswordHash),
		[]byte(input.Password),
	); err != nil {
		log.Println("LOGIN: password mismatch for email:", email, "err:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	id := u.ID.Hex()
	token, err := utils.Sign(id, string(u.Role))
	if err != nil {
		log.Println("LOGIN: sign token error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not sign token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accessToken": token,
		"user": gin.H{
			"id":    id,
			"name":  u.Name,
			"email": u.Email,
			"role":  u.Role,
		},
	})
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
