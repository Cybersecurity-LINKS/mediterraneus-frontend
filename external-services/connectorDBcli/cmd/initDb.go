/*
Copyright © 2023 Davide Scovotto <davide.scovotto@linksfoundation.com>
*/
package cmd

import (
	"common"
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
	"github.com/spf13/cobra"
)

// initDbCmd represents the initDb command
var initDbCmd = &cobra.Command{
	Use:   "initDb",
	Short: "Initializes local DB for local Asset Metadata storage",
	Long: `Initializes local DB for local Asset Metadata storage. 
			For example: connectordbcli initDb`,
	Run: func(cmd *cobra.Command, args []string) {
		db, err := common.DbConncect()
		if err != nil {
			log.Fatal(err.Error())
		}

		_, err = DbInitOfferingMetaTable(db)
		if err != nil {
			log.Fatal(err.Error())
		}

		fmt.Println("Table initialized successfully")

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
	CREATE TABLE offeringMetainfo(id SERIAL PRIMARY KEY, alias VARCHAR NOT NULL, localpath VARCHAR NOT NULL, cid VARCHAR NOT NULL)
	`
	res, err := db.Exec(sts)
	if err != nil {
		return nil, err
	}
	return res, nil
}
