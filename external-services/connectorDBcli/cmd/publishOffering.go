/*
Copyright © 2023 Davide Scovotto <davide.scovotto@linksfoundation.com>
*/
package cmd

import (
	"bytes"
	"common"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"

	"github.com/spf13/cobra"
)

type verGw_resp struct {
	CID string `json:"CID"`
}

// publishOfferingCmd represents the publishOffering command
var publishOfferingCmd = &cobra.Command{
	Use:   "publishOffering",
	Short: "Publish an Offering together with its policies on the Private-IPFS",
	Long: `
	Publish an Offering together with its policies on the Private-IPFS. The Offering defines the asset to be tokenized and 
	is strictly related to the Policies defined by the Data Owner. The Policies allow the Marketplace's Catalogue
	to properly filter out the correct Offerings that may be later shown to potential buyers. The Offering together with the Policy
	defines an Offering Message.
	
	The Data Owner must contact the Verification Gateway that will take care of publishing the Offering Message on its behalf. 
	The Verification Gateway will provide back the generated CID by the Private-IPFS node that must then saved into the Connector's
	local Database, linking it to the correct Asset that the Data Owner wants to tokenize.
	The Verification Gateway expects a .json file (relative/absolute path) that must be passed as argument to the command together with 
	the Alias of the Asset that the CID must refer to, and also the DB filepath. 
	
	As an example:
		connectordbcli publishOffering offeringMsg.json ASSET_DAVIDE
	`,
	Args: cobra.ExactArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
		// check db file exists, if not throw error
		exists := common.FileAlreadyExists(args[2])
		if !exists {
			log.Fatal("Provided DBpath does not exist!")
		}
		// check offering message file exists
		exists = common.FileAlreadyExists(args[0])
		if !exists {
			log.Fatal("Provided LPath does not exist.")
		}
		db, err := common.DbConncect()
		if err != nil {
			log.Fatal(err.Error())
		}
		// resolve ALIAS -> row ID
		// check if the corresponding row exists in the DB
		// if not throw an error
		rowId := common.CheckRowExistsByAlias(db, args[1])
		if rowId <= 0 {
			log.Fatal("Provided alias does not match any row in local DB!")
		}

		// call verification GW
		// get CID back
		CID, err := postOffering(args[0])
		if err != nil {
			log.Fatal(err.Error())
		}

		// update asset row by adding the received CID
		res, err := common.InsertCIDgivenRowID(db, rowId, CID)
		if err != nil {
			log.Fatal(err.Error())
		}
		affected, err := res.RowsAffected()
		if err != nil {
			log.Fatal(err.Error())
		}

		fmt.Println("Successfully updated row " + string(rune(affected)) + " with CID: " + CID)
		err = common.DbClose(db)
		if err != nil {
			log.Fatal(err.Error())
		}
	},
}

func init() {
	rootCmd.AddCommand(publishOfferingCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// publishOfferingCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// publishOfferingCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}

func postOffering(fname string) (string, error) {
	offeringMsg, err := os.Open(fname)
	if err != nil {
		return "", err
	}
	defer offeringMsg.Close()

	// Prepare a form.
	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	var fw io.Writer
	fw, err = w.CreateFormFile("file", offeringMsg.Name())
	if err != nil {
		return "", err
	}
	_, err = io.Copy(fw, offeringMsg)
	if err != nil {
		return "", err
	}
	w.Close()

	client := &http.Client{}
	req, err := http.NewRequest("POST", common.VerGWurl_upload, &b)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	fmt.Println(string(body))

	_verGw_resp := verGw_resp{}
	jsonErr := json.Unmarshal(body, &_verGw_resp)
	if jsonErr != nil {
		return "", err

	}
	return _verGw_resp.CID, nil
}
