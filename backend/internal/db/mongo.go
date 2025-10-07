package db

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var Database *mongo.Database

func Connect() {
	uri := os.Getenv("MONGODB_URI")
	dbName := os.Getenv("MONGODB_DB")
	if uri == "" || dbName == "" {
		log.Fatal("MONGODB_URI or MONGODB_DB not set")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
	Client = client
	Database = client.Database(dbName)
}
