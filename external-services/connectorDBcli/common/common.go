package common

import (
	"database/sql"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

func DbConncect(dbpath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", dbpath)

	if err != nil {
		return nil, err
	}
	return db, nil
}

func DbClose(db *sql.DB) error {
	return db.Close()
}

func FileAlreadyExists(fp string) bool {
	// Check if file already exists
	_, err := os.Stat(fp)
	// check if error is "file not exists"
	if os.IsNotExist(err) {
		return false
	}
	return true
}

func IsValidLpath(fp string) bool {
	if FileAlreadyExists(fp) {
		// Attempt to create it
		var d []byte
		if err := os.WriteFile(fp, d, 0644); err == nil {
			os.Remove(fp) // And delete it
			return true
		}
	}
	return false
}
