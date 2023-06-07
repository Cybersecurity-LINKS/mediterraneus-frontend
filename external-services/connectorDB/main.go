package main

import (
	"log"

	"offeringdao"
)

func main() {
	db, err := offeringdao.DbConncect()
	if err != nil {
		log.Fatal(err.Error())
	}

	offeringdao.DbInitOfferingMetaTable(db)

}
