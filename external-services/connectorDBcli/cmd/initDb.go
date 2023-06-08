/*
Copyright © 2023 Davide Scovotto <davide.scovotto@linksfoundation.com>
*/
package cmd

import (
	"common"
	"database/sql"
	"fmt"
	"log"

	_ "github.com/mattn/go-sqlite3"
	"github.com/spf13/cobra"
)

// initDbCmd represents the initDb command
var initDbCmd = &cobra.Command{
	Use:   "initDb",
	Short: "Initializes local DB for local Asset Metadata storage",
	Long: `Initializes local DB for local Asset Metadata storage. To coorectly initialize the DB pass the path of where 
	the DB files should be stored. For example: connectordbcli initDb ../test.db`,
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		dbAlreadyexists := common.FileAlreadyExists(args[0])
		if dbAlreadyexists {
			log.Fatal("initDB: DB file already exists: ", args[0])
		}
		db, err := common.DbConncect(args[0])
		if err != nil {
			log.Fatal(err.Error())
		}

		res, err := DbInitOfferingMetaTable(db)
		if err != nil {
			log.Fatal(err.Error())
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			fmt.Println("Error in initializing OfferingMeta table")
			log.Fatal(err.Error())
		}
		fmt.Println("Success: Created ID row = ", lastID)

		err = common.DbClose(db)
		if err != nil {
			log.Fatal(err.Error())
		}
	},
}

func init() {
	rootCmd.AddCommand(initDbCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// initDbCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// initDbCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}

func DbInitOfferingMetaTable(db *sql.DB) (sql.Result, error) {
	sts :=
		`
	DROP TABLE IF EXISTS offeringMetainfo;
	CREATE TABLE offeringMetainfo(id INTEGER PRIMARY KEY, alias TEXT, localpath TEXT, cid TEXT);
	`
	res, err := db.Exec(sts)
	if err != nil {
		return nil, err
	}
	return res, nil
}
