package common

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
	"github.com/spf13/viper"
)

var VerGWurl_upload = "http://192.168.94.194:3333/uploadOfferingMsg"

func getEnvVar(key string) (string, error, bool) {
	viper.SetConfigFile("../.env")

	err := viper.ReadInConfig()
	if err != nil {
		return "", err, true
	}

	value, ok := viper.Get(key).(string)
	if !ok {
		return "", nil, false
	}
	return value, nil, true
}

func DbConncect() (*sql.DB, error) {
	driver, err, ok := getEnvVar("DB_DRIVER")
	if err != nil {
		fmt.Println(err.Error())
	}
	if !ok {
		fmt.Println("Value not found in env file")
	}
	user, _, _ := getEnvVar("DB_USER")
	pwd, _, _ := getEnvVar("DB_PWD")
	db_name, _, _ := getEnvVar("DB_name")
	port, _, _ := getEnvVar("DB_PORT")

	connStr := "postgresql://" + user + ":" + pwd + "@127.0.0.1:" + port + "/" + db_name + "?sslmode=disable"

	db, err := sql.Open(driver, connStr)

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
