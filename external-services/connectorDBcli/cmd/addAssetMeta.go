/*
Copyright © 2023 Davide Scovotto <davide.scovotto@linksfoundation.com>
*/
package cmd

import (
	"common"
	"database/sql"
	"fmt"
	"log"

	"github.com/spf13/cobra"
)

// addAssetMetaCmd represents the addAssetMeta command
var addAssetMetaCmd = &cobra.Command{
	Use:   "addAssetMeta",
	Short: "Add Asset info to local DB",
	Long: `Add Asset info to local DB. The DB file path, absolute path together with a unique alias must be provided.
	For example: connectordbcli addAssetMeta ../test.db /home/peppe/asset ASSET12`,
	Args: cobra.ExactArgs(3),
	// arg[0] = dbpath, arg[1] = lpath, arg[2] = alias
	Run: func(cmd *cobra.Command, args []string) {
		// check arg[0] is a valid lpath
		isValid := common.FileAlreadyExists(args[0])
		if !isValid {
			log.Fatal("Provided DBpath does not exist!")
		}
		// check arg[1] is a valid lpath
		isValid = common.FileAlreadyExists(args[1])
		if !isValid {
			log.Fatal("Provided LPath does not exist.")
		}

		db, err := common.DbConncect(args[0])
		if err != nil {
			log.Fatal(err.Error())
		}

		res, err := addAsset(db, args[2], args[1])
		if err != nil {
			log.Fatal(err.Error())
		}
		lastID, err := res.LastInsertId()
		if err != nil {
			log.Fatal(err.Error())
		}
		fmt.Println("Success! Inserted Row with ID: ", lastID)
		err = common.DbClose(db)
		if err != nil {
			log.Fatal(err.Error())
		}
	},
}

func init() {
	rootCmd.AddCommand(addAssetMetaCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// addAssetMetaCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// addAssetMetaCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}

func addAsset(db *sql.DB, alias string, path string) (sql.Result, error) {
	stm, err := db.Prepare("INSERT INTO offeringMetainfo(alias, localpath, cid) VALUES(?, ?, ?)")
	if err != nil {
		return nil, err
	}
	res, err := stm.Exec(alias, path, "")
	if err != nil {
		return nil, err
	}
	defer stm.Close()
	return res, nil
}
