package common

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var VerGWurl_upload = "http://192.168.94.194:3333/uploadOfferingMsg"

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
	return !os.IsNotExist(err)
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

func CheckRowExistsByAlias(db *sql.DB, alias string) int {
	query := `select id from offeringMetainfo where alias=?`
	ctx, cancelFunc := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelFunc()

	stmt, err := db.PrepareContext(ctx, query)
	if err != nil {
		fmt.Printf("Error %s when preparing SQL statement", err)
		return -1
	}
	defer stmt.Close()

	var rowid int
	row := stmt.QueryRowContext(ctx, alias)
	if err := row.Scan(&rowid); err != nil {
		return -1
	}
	return rowid
}

func InsertCIDgivenRowID(db *sql.DB, rowId int, cid string) (sql.Result, error) {
	stm, err := db.Prepare("UPDATE offeringMetainfo SET cid=? WHERE id=?;")
	if err != nil {
		return nil, err
	}
	res, err := stm.Exec(cid, rowId)
	if err != nil {
		return nil, err
	}
	defer stm.Close()
	return res, nil
}
