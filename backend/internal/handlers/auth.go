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
		"name":         body.Name,
		"email":        strings.ToLower(strings.TrimSpace(body.Email)),
		"passwordHash": string(hash),
		"role":         "MEMBER",
		"createdAt":    time.Now(),
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

// UpdateProfile อัปเดตชื่อผู้ใช้
func UpdateProfile(c *gin.Context) {
	userSub := c.MustGet("userSub").(string)
	currentUserID, _ := primitive.ObjectIDFromHex(userSub)

	userID := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	// เช็ค permission: user สามารถแก้ไขเฉพาะข้อมูลของตัวเองเท่านั้น
	if currentUserID != oid {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only update your own profile"})
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

	col := db.Database.Collection("users")
	_, err = col.UpdateByID(ctx, oid, bson.M{"$set": bson.M{"name": input.Name}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// ChangePassword เปลี่ยนรหัสผ่าน
func ChangePassword(c *gin.Context) {
	sub := c.MustGet("userSub").(string)
	oid, _ := primitive.ObjectIDFromHex(sub)

	var input struct {
		CurrentPassword string `json:"currentPassword" binding:"required"`
		NewPassword     string `json:"newPassword" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(input.NewPassword) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 6 characters"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	col := db.Database.Collection("users")
	var u models.User
	if err := col.FindOne(ctx, bson.M{"_id": oid}).Decode(&u); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// ตรวจสอบรหัสผ่านเก่า
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(input.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "current password is incorrect"})
		return
	}

	// hash รหัสผ่านใหม่
	newHash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "hash error"})
		return
	}

	// อัปเดตรหัสผ่าน
	_, err = col.UpdateByID(ctx, oid, bson.M{"$set": bson.M{"passwordHash": string(newHash)}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "password changed"})
}

// DeleteAccount ลบบัญชี (ลบ user และ projects/tasks ทั้งหมด)
func DeleteAccount(c *gin.Context) {
	userSub := c.MustGet("userSub").(string)
	currentUserID, _ := primitive.ObjectIDFromHex(userSub)

	userID := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	// เช็ค permission: user สามารถลบเฉพาะบัญชีของตัวเองเท่านั้น
	if currentUserID != oid {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only delete your own account"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// ลบ projects ที่ user นี้เป็นเจ้าของ
	projCol := db.Database.Collection("projects")
	projCol.DeleteMany(ctx, bson.M{"ownerId": oid})

	// ลบ user
	userCol := db.Database.Collection("users")
	result, err := userCol.DeleteOne(ctx, bson.M{"_id": oid})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "account deleted"})
}

// ForgotPassword generates a password reset token and returns it
func ForgotPassword(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	email := strings.ToLower(strings.TrimSpace(input.Email))
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Find user by email
	usersColl := db.Database.Collection("users")
	var user models.User
	if err := usersColl.FindOne(ctx, bson.M{"email": email}).Decode(&user); err != nil {
		// Don't reveal if user exists or not (security best practice)
		c.JSON(http.StatusOK, gin.H{"message": "if email exists, reset link will be sent"})
		return
	}

	// Generate reset token (JWT-based, 24-hour expiry)
	resetToken, err := utils.SignResetToken(user.ID.Hex())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate reset token"})
		return
	}

	// Store reset token in database
	resetTokensColl := db.Database.Collection("passwordResetTokens")
	_, err = resetTokensColl.InsertOne(ctx, bson.M{
		"userId":    user.ID,
		"email":     email,
		"token":     resetToken,
		"expiresAt": time.Now().Add(24 * time.Hour),
		"createdAt": time.Now(),
		"used":      false,
	})
	if err != nil {
		log.Println("FORGOT_PASSWORD: insert token error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save reset token"})
		return
	}

	// In production, you would send this via email
	// For now, return it for testing purposes
	c.JSON(http.StatusOK, gin.H{
		"message":    "password reset link sent to your email",
		"resetToken": resetToken, // Remove in production, send via email instead
	})
}

// ResetPassword validates the reset token and updates password
func ResetPassword(c *gin.Context) {
	var input struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"newPassword" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(input.NewPassword) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 6 characters"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Verify token
	claims, err := utils.VerifyResetToken(input.Token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired reset token"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(claims.Sub)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid token"})
		return
	}

	// Check if token exists and hasn't been used
	resetTokensColl := db.Database.Collection("passwordResetTokens")
	var resetToken models.PasswordResetToken
	if err := resetTokensColl.FindOne(ctx, bson.M{
		"token": input.Token,
		"used":  false,
	}).Decode(&resetToken); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or already used reset token"})
		return
	}

	// Check if token has expired
	if time.Now().After(resetToken.ExpiresAt) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "reset token has expired"})
		return
	}

	// Hash new password
	newHash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "hash error"})
		return
	}

	// Update user password
	usersColl := db.Database.Collection("users")
	_, err = usersColl.UpdateByID(ctx, userID, bson.M{
		"$set": bson.M{"passwordHash": string(newHash)},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update password"})
		return
	}

	// Mark token as used
	_, err = resetTokensColl.UpdateOne(ctx, bson.M{"token": input.Token}, bson.M{
		"$set": bson.M{"used": true},
	})
	if err != nil {
		log.Println("RESET_PASSWORD: mark token used error:", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "password reset successfully"})
}
