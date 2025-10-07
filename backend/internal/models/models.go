package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Role string
const (
	RoleAdmin  Role = "ADMIN"
	RoleMember Role = "MEMBER"
	RoleViewer Role = "VIEWER"
)

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name         string             `bson:"name" json:"name"`
	Email        string             `bson:"email" json:"email"`
	PasswordHash string             `bson:"passwordHash" json:"-"`
	Role         Role               `bson:"role" json:"role"`
}

type Project struct {
	ID          primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Name        string               `bson:"name" json:"name"`
	Description string               `bson:"description,omitempty" json:"description,omitempty"`
	OwnerID     primitive.ObjectID   `bson:"ownerId" json:"ownerId"`
	Members     []ProjectMember      `bson:"members" json:"members"`
}

type ProjectMember struct {
	UserID primitive.ObjectID `bson:"userId" json:"userId"`
	Role   Role               `bson:"role" json:"role"`
}

type Board struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string             `bson:"name" json:"name"`
	ProjectID primitive.ObjectID `bson:"projectId" json:"projectId"`
}

type Column struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name     string             `bson:"name" json:"name"`
	Position int                `bson:"position" json:"position"`
	WipLimit *int               `bson:"wipLimit,omitempty" json:"wipLimit,omitempty"`
	BoardID  primitive.ObjectID `bson:"boardId" json:"boardId"`
}

type Task struct {
	ID          primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Title       string               `bson:"title" json:"title"`
	Description string               `bson:"description,omitempty" json:"description,omitempty"`
	Priority    string               `bson:"priority" json:"priority"`
	StartDate   *primitive.DateTime  `bson:"startDate,omitempty" json:"startDate,omitempty"`
	DueDate     *primitive.DateTime  `bson:"dueDate,omitempty" json:"dueDate,omitempty"`
	Position    int                  `bson:"position" json:"position"`
	BoardID     primitive.ObjectID   `bson:"boardId" json:"boardId"`
	ColumnID    primitive.ObjectID   `bson:"columnId" json:"columnId"`
	CreatedByID primitive.ObjectID   `bson:"createdById" json:"createdById"`
	Assignees   []primitive.ObjectID `bson:"assignees" json:"assignees"`
	Labels      []primitive.ObjectID `bson:"labels" json:"labels"`
}
