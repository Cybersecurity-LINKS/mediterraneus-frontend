package offeringdao

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

func DbConncect() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "test.db")

	if err != nil {
		fmt.Println(err.Error())
		return nil, err
	}
	defer db.Close()

	return db, nil
}

func DbInitOfferingMetaTable(db *sql.DB) {
	sts :=
		`
	DROP TABLE IF EXISTS offeringMetainfo;
	CREATE TABLE offeringMetainfo(id INTEGER PRIMARY KEY, name TEXT, localpath TEXT, cid TEXT);
	`
	res, err := db.Exec(sts)
	if err != nil {
		fmt.Println(err.Error())
	}
	fmt.Println("Result: ", res)
}
